import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FamilyPost } from '../entities/family-post.entity';
import { FamilyPostComment } from '../entities/family-post-comment.entity';
import { FamilyMember, MemberRole } from '../../family/entities/family-member.entity';
import { Family } from '../../family/entities/family.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import type { CreatePostDto, CreateCommentDto, CreateBoardFamilyDto, JoinFamilyDto } from '../dto/board.dto';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(FamilyPost)
    private readonly postRepo: Repository<FamilyPost>,
    @InjectRepository(FamilyPostComment)
    private readonly commentRepo: Repository<FamilyPostComment>,
    @InjectRepository(FamilyMember)
    private readonly memberRepo: Repository<FamilyMember>,
    @InjectRepository(Family)
    private readonly familyRepo: Repository<Family>,
    private readonly notificationService: NotificationService,
  ) {}

  /** 가족 전체(계정 보유 멤버, 제외 대상 빼고)에게 알림 발송 */
  private async notifyFamily(familyId: number, excludeUserIds: number[], title: string, body: string) {
    const members = await this.memberRepo.find({ where: { familyId } });
    const userIds = members
      .map((m) => (m.userId ? Number(m.userId) : null))
      .filter((id): id is number => !!id && !excludeUserIds.includes(id));
    for (const uid of [...new Set(userIds)]) {
      await this.notificationService
        .create(uid, title, body, 'FAMILY', `board:${familyId}`)
        .catch(() => {});
    }
  }

  /** 내가 속한 가족 목록 */
  async myFamilies(userId: number): Promise<{ id: number; name: string; role: string; isPublic: boolean; commentsEnabled: boolean }[]> {
    const members = await this.memberRepo.find({ where: { userId } });
    if (members.length === 0) return [];
    const families = await this.familyRepo.findBy({ id: In(members.map((m) => Number(m.familyId))) });
    const roleMap = new Map(members.map((m) => [Number(m.familyId), m.role]));
    return families.map((f) => ({
      id: f.id,
      name: f.name,
      role: roleMap.get(f.id) || 'MEMBER',
      isPublic: !!f.isPublic,
      commentsEnabled: f.commentsEnabled !== false,
    }));
  }

  /** 댓글 허용/비허용 설정 — 가족장은 항상, 공개 그룹은 멤버 누구나 */
  async setCommentsEnabled(familyId: number, userId: number, enabled: boolean) {
    const member = await this.assertMember(familyId, userId);
    const family = await this.familyRepo.findOne({ where: { id: familyId } });
    if (!family) throw new NotFoundException('가족을 찾을 수 없습니다');
    const canToggle = member.role === MemberRole.HEAD || !!family.isPublic;
    if (!canToggle) {
      throw new ForbiddenException('댓글 설정은 가족장만 변경할 수 있습니다');
    }
    await this.familyRepo.update({ id: familyId }, { commentsEnabled: enabled });
    return { id: familyId, commentsEnabled: enabled };
  }

  /** 공개 그룹 검색 (아파트 공지, 동네 모임 등) */
  async searchGroups(keyword: string | undefined, userId: number) {
    const myMemberFamilyIds = (await this.memberRepo.find({ where: { userId } })).map((m) =>
      Number(m.familyId),
    );
    const qb = this.familyRepo
      .createQueryBuilder('f')
      .where('f.isPublic = :pub', { pub: true })
      .orderBy('f.createdAt', 'DESC')
      .take(50);
    if (keyword) qb.andWhere('f.name ILIKE :kw', { kw: `%${keyword}%` });
    const groups = await qb.getMany();
    // 멤버 수 계산
    const counts = await this.memberRepo
      .createQueryBuilder('m')
      .select('m.familyId', 'familyId')
      .addSelect('COUNT(*)', 'count')
      .where('m.familyId IN (:...ids)', { ids: groups.map((g) => g.id) })
      .groupBy('m.familyId')
      .getRawMany();
    const countMap = new Map(counts.map((c) => [Number(c.familyId), Number(c.count)]));
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description || null,
      address: g.address || null,
      memberCount: countMap.get(g.id) || 0,
      joined: myMemberFamilyIds.includes(g.id),
    }));
  }

  /** 공개 그룹 가입 (초대코드 없이 바로 가입) */
  async joinGroup(familyId: number, userId: number) {
    const family = await this.familyRepo.findOne({ where: { id: familyId } });
    if (!family) throw new NotFoundException('그룹을 찾을 수 없습니다');
    if (!family.isPublic) throw new BadRequestException('초대 코드가 필요한 그룹입니다');
    const existing = await this.memberRepo.findOne({ where: { familyId, userId } });
    if (existing) throw new BadRequestException('이미 가입한 그룹입니다');
    await this.memberRepo.save(
      this.memberRepo.create({
        familyId,
        userId,
        role: MemberRole.MEMBER,
        name: `사용자 ${userId}`,
      }),
    );
    return { id: family.id, name: family.name, role: MemberRole.MEMBER };
  }

  /** 가족 생성 — 생성자를 HEAD 멤버로 등록 */
  async createFamily(data: CreateBoardFamilyDto) {
    const family = await this.familyRepo.save(this.familyRepo.create({ name: data.name, address: '' }));
    await this.memberRepo.save(
      this.memberRepo.create({
        familyId: family.id,
        userId: data.userId,
        role: MemberRole.HEAD,
        name: `사용자 ${data.userId}`,
      }),
    );
    return { id: family.id, name: family.name, role: MemberRole.HEAD };
  }

  /** 초대 코드로 가족/그룹 참가 — families.code 기준 */
  async joinFamily(data: JoinFamilyDto) {
    const family = await this.familyRepo.findOne({ where: { code: data.code.toUpperCase() } });
    if (!family) throw new BadRequestException('유효하지 않은 초대 코드입니다');
    if (family.expiresAt && new Date(family.expiresAt) < new Date()) {
      throw new BadRequestException('초대 코드가 만료되었습니다. 새 코드를 발급받아주세요');
    }
    const existing = await this.memberRepo.findOne({
      where: { familyId: family.id, userId: data.userId },
    });
    if (existing) throw new BadRequestException('이미 해당 가족의 멤버입니다');
    await this.memberRepo.save(
      this.memberRepo.create({
        familyId: family.id,
        userId: data.userId,
        role: MemberRole.MEMBER,
        name: `사용자 ${data.userId}`,
      }),
    );
    return { id: family.id, name: family.name, role: MemberRole.MEMBER };
  }

  /** 초대 코드 발급/조회 — HEAD만 가능. 유효한 코드가 있으면 재사용, 없거나 만료 시 새로 발급 (20분 유효) */
  async getOrCreateInviteCode(familyId: number, userId: number, regenerate = false) {
    const member = await this.assertMember(familyId, userId);
    if (member.role !== MemberRole.HEAD) {
      throw new ForbiddenException('초대 코드는 가족장만 발급할 수 있습니다');
    }
    const family = await this.familyRepo.findOne({ where: { id: familyId } });
    if (!family) throw new NotFoundException('가족을 찾을 수 없습니다');

    // 공개 그룹은 초대코드 무제한, 비공개 가족은 20분 유효
    const unlimited = !!family.isPublic;
    const valid =
      !regenerate &&
      family.code &&
      (unlimited || !family.expiresAt || new Date(family.expiresAt) > new Date());
    if (valid) {
      return { code: family.code, expiresAt: family.expiresAt };
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const expiresAt = unlimited ? null : new Date(Date.now() + 20 * 60 * 1000);
    await this.familyRepo.update({ id: familyId }, { code, expiresAt });
    return { code, expiresAt };
  }

  /** 가족 구성원 목록 */
  async listMembers(familyId: number, userId: number) {
    await this.assertMember(familyId, userId);
    const members = await this.memberRepo.find({
      where: { familyId },
      order: { role: 'ASC', id: 'ASC' },
    });
    return members.map((m) => ({
      id: m.id,
      name: m.name || (m.userId ? `사용자 ${m.userId}` : '이름 없음'),
      relation: m.relation || null,
      role: m.role,
      birthDate: m.birthDate || null,
      hasAccount: !!m.userId,
      isMe: Number(m.userId) === userId,
    }));
  }

  /** 가족 나가기 — 본인 멤버십 삭제. HEAD가 나가면 다른 멤버를 HEAD로 승격 */
  async leaveFamily(familyId: number, userId: number) {
    const member = await this.memberRepo.findOne({ where: { familyId, userId } });
    if (!member) throw new ForbiddenException('가족 멤버가 아닙니다');
    await this.memberRepo.delete({ id: member.id });
    if (member.role === MemberRole.HEAD) {
      const next = await this.memberRepo.findOne({
        where: { familyId },
        order: { id: 'ASC' },
      });
      if (next) await this.memberRepo.update({ id: next.id }, { role: MemberRole.HEAD });
    }
    return { success: true };
  }

  /** 구성원 내보내기 — HEAD만 가능 (자기 자신 제외) */
  async removeMember(familyId: number, memberId: number, userId: number) {
    const requester = await this.assertMember(familyId, userId);
    if (requester.role !== MemberRole.HEAD) {
      throw new ForbiddenException('구성원 내보내기는 가족장만 가능합니다');
    }
    const target = await this.memberRepo.findOne({ where: { id: memberId, familyId } });
    if (!target) throw new NotFoundException('구성원을 찾을 수 없습니다');
    if (Number(target.userId) === userId) {
      throw new BadRequestException('자기 자신은 내보낼 수 없습니다. 가족 나가기를 이용하세요');
    }
    await this.memberRepo.delete({ id: target.id });
    return { success: true };
  }

  /** 가족 멤버 여부 확인 — 아니면 403 */
  private async assertMember(familyId: number, userId: number): Promise<FamilyMember> {
    const member = await this.memberRepo.findOne({ where: { familyId, userId } });
    if (!member) throw new ForbiddenException('이 가족의 게시판에 접근할 수 없습니다');
    return member;
  }

  /** 읽기 전용 접근: 멤버이거나 공개 그룹이면 허용 (비멤버+비공개만 403) */
  private async assertReadable(familyId: number, userId: number): Promise<void> {
    const member = await this.memberRepo.findOne({ where: { familyId, userId } });
    if (member) return;
    const family = await this.familyRepo.findOne({ where: { id: familyId } });
    if (!family?.isPublic) throw new ForbiddenException('이 가족의 게시판에 접근할 수 없습니다');
  }

  private authorName(member: FamilyMember, userId: number): string {
    return member.name || member.user?.name || `사용자 ${userId}`;
  }

  async listPosts(familyId: number, userId: number) {
    await this.assertReadable(familyId, userId);
    const family = await this.familyRepo.findOne({ where: { id: familyId } });
    const now = new Date();
    const qb = this.postRepo
      .createQueryBuilder('p')
      .where('p.family_id = :familyId', { familyId })
      .orderBy('p.is_notice', 'DESC')
      .addOrderBy('p.created_at', 'DESC')
      .take(100);
    if (family?.isPublic) {
      // 공개 그룹(기본 게시판): 지정된 노출 기간 안에만 표시
      qb.andWhere('(p.visible_until IS NULL OR p.visible_until > :now)', { now })
        .andWhere('(p.visible_from IS NULL OR p.visible_from <= :now)', { now });
    } else {
      // 가족 게시판: 최근 3개월 게시글만 표시
      const since = new Date(now);
      since.setMonth(since.getMonth() - 3);
      qb.andWhere('p.created_at >= :since', { since });
    }
    const posts = await qb.getMany();
    if (posts.length === 0) return [];
    const counts = await this.commentRepo
      .createQueryBuilder('c')
      .select('c.post_id', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('c.post_id IN (:...ids)', { ids: posts.map((p) => p.id) })
      .groupBy('c.post_id')
      .getRawMany();
    const countMap = new Map(counts.map((c) => [String(c.postId), Number(c.count)]));
    return posts.map((p) => ({ ...p, commentCount: countMap.get(String(p.id)) || 0 }));
  }

  /** 내가 속한 모든 가족/그룹의 게시글을 한 번에 조회 (전체 보기) */
  async allPosts(userId: number) {
    const members = await this.memberRepo.find({ where: { userId } });
    if (members.length === 0) return [];
    const familyIds = members.map((m) => Number(m.familyId));
    const families = await this.familyRepo.findBy({ id: In(familyIds) });
    const familyMap = new Map(families.map((f) => [Number(f.id), f]));
    const now = new Date();
    const since = new Date(now);
    since.setMonth(since.getMonth() - 3);
    const posts = await this.postRepo
      .createQueryBuilder('p')
      .where('p.family_id IN (:...ids)', { ids: familyIds })
      .andWhere('(p.created_at >= :since OR p.family_id IN (:...publicIds))', {
        since,
        publicIds: families.filter((f) => f.isPublic).map((f) => Number(f.id)),
      })
      .orderBy('p.is_notice', 'DESC')
      .addOrderBy('p.created_at', 'DESC')
      .take(200)
      .getMany();
    const visible = posts.filter((p) => {
      const family = familyMap.get(Number(p.familyId));
      if (!family?.isPublic) return true;
      if (p.visibleUntil && new Date(p.visibleUntil) <= now) return false;
      if (p.visibleFrom && new Date(p.visibleFrom) > now) return false;
      return true;
    });
    if (visible.length === 0) return [];
    const counts = await this.commentRepo
      .createQueryBuilder('c')
      .select('c.post_id', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('c.post_id IN (:...ids)', { ids: visible.map((p) => p.id) })
      .groupBy('c.post_id')
      .getRawMany();
    const countMap = new Map(counts.map((c) => [String(c.postId), Number(c.count)]));
    return visible.map((p) => ({
      ...p,
      commentCount: countMap.get(String(p.id)) || 0,
      familyName: familyMap.get(Number(p.familyId))?.name || '',
    }));
  }

  async createPost(data: CreatePostDto): Promise<FamilyPost> {
    const member = await this.assertMember(data.familyId, data.userId);
    // 공지사항은 HEAD만
    if (data.isNotice && member.role !== MemberRole.HEAD) {
      throw new ForbiddenException('공지사항은 가족장만 등록할 수 있습니다');
    }
    const family = await this.familyRepo.findOne({ where: { id: data.familyId } });
    // 공개 그룹(기본 게시판)은 노출 기간 필수, 가족 게시판은 3개월 후 자동 숨김
    let visibleFrom: Date | null = null;
    let visibleUntil: Date | null = null;
    if (family?.isPublic) {
      if (!data.visibleUntil) {
        throw new BadRequestException('공개 그룹 게시글은 노출 종료일을 지정해야 합니다');
      }
      visibleUntil = new Date(data.visibleUntil);
      visibleUntil.setHours(23, 59, 59, 999);
      if (data.visibleFrom) {
        visibleFrom = new Date(data.visibleFrom);
        visibleFrom.setHours(0, 0, 0, 0);
        if (visibleFrom > visibleUntil) {
          throw new BadRequestException('노출 시작일이 종료일보다 늦습니다');
        }
      }
    }
    const post = this.postRepo.create({
      familyId: data.familyId,
      authorUserId: data.userId,
      authorName: this.authorName(member, data.userId),
      title: data.title,
      content: data.content,
      isNotice: data.isNotice || false,
      visibleFrom,
      visibleUntil,
    });
    const saved = await this.postRepo.save(post);
    this.notifyFamily(
      data.familyId,
      [data.userId],
      saved.isNotice ? '📌 새 공지사항' : '새 게시글',
      `${this.authorName(member, data.userId)}님: ${saved.title}`,
    ).catch(() => {});
    return saved;
  }

  async deletePost(postId: number, userId: number): Promise<void> {
    const post = await this.postRepo.findOne({ where: { id: String(postId) } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    const member = await this.assertMember(post.familyId, userId);
    const isAuthor = post.authorUserId === userId;
    const isHead = member.role === MemberRole.HEAD;
    if (!isAuthor && !isHead) throw new ForbiddenException('삭제 권한이 없습니다');
    await this.commentRepo.delete({ postId: post.id });
    await this.postRepo.delete({ id: post.id });
  }

  async listComments(postId: number, userId: number) {
    const post = await this.postRepo.findOne({ where: { id: String(postId) } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    await this.assertReadable(post.familyId, userId);
    return this.commentRepo.find({ where: { postId: post.id }, order: { createdAt: 'ASC' } });
  }

  async createComment(data: CreateCommentDto): Promise<FamilyPostComment> {
    const post = await this.postRepo.findOne({ where: { id: String(data.postId) } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    const member = await this.assertMember(post.familyId, data.userId);
    const family = await this.familyRepo.findOne({ where: { id: post.familyId } });
    if (family && family.commentsEnabled === false) {
      throw new BadRequestException('댓글이 비활성화된 게시판입니다');
    }
    const comment = this.commentRepo.create({
      postId: post.id,
      authorUserId: data.userId,
      authorName: this.authorName(member, data.userId),
      content: data.content,
    });
    const saved = await this.commentRepo.save(comment);
    // 게시글 작성자 + 같은 가족 다른 멤버에게 댓글 알림
    const postAuthorId = Number(post.authorUserId);
    const authorName = this.authorName(member, data.userId);
    // 게시글 작성자에게는 별도 알림, 나머지 가족에게는 일반 댓글 알림
    this.notifyFamily(
      post.familyId,
      [data.userId, postAuthorId],
      '💬 새 댓글',
      `${authorName}님이 "${post.title}"에 댓글을 남겼습니다`,
    ).catch(() => {});
    if (postAuthorId !== data.userId) {
      this.notificationService
        .create(postAuthorId, '💬 내 글에 댓글', `${authorName}님이 댓글을 남겼습니다: "${post.title}"`, 'FAMILY', `board:${post.familyId}`)
        .catch(() => {});
    }
    return saved;
  }

  async deleteComment(commentId: number, userId: number): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id: String(commentId) } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다');
    const post = await this.postRepo.findOne({ where: { id: comment.postId } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다');
    const member = await this.assertMember(post.familyId, userId);
    const isAuthor = comment.authorUserId === userId || post.authorUserId === userId;
    const isHead = member.role === MemberRole.HEAD;
    if (!isAuthor && !isHead) throw new ForbiddenException('삭제 권한이 없습니다');
    await this.commentRepo.delete({ id: comment.id });
  }
}
