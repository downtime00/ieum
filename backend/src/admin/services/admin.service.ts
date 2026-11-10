import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Notice } from '../notice.entity';
import { OrganizationsService } from '../../organizations/organizations.service';
import { CreateOrganizationDto } from '../../organizations/dto/create-organization.dto';
import { UpdateOrganizationDto } from '../../organizations/dto/update-organization.dto';
import { Content } from '../../contents/entities/content.entity';
import { EventParticipation } from '../../events/entities/event-participation.entity';
import { Event, EventStatus } from '../../events/entities/event.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/entities/user.entity';
import type { CreateAdminDto } from '../dto/create-admin.dto';
import { AppLogger } from '../../common/logger/logger.service';
import { AdminActivity, AdminAction } from '../entities/admin-activity.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import type { SendNotificationDto } from '../dto/send-notification.dto';
import { Family } from '../../family/entities/family.entity';
import { FamilyMember } from '../../family/entities/family-member.entity';
import type { CreateGroupDto } from '../dto/create-group.dto';

@Injectable()
export class AdminService {
  private readonly logger = new AppLogger('AdminService');
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    @InjectRepository(EventParticipation)
    private readonly participationRepository: Repository<EventParticipation>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AdminActivity)
    private readonly activityRepository: Repository<AdminActivity>,
    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,
    @InjectRepository(FamilyMember)
    private readonly familyMemberRepository: Repository<FamilyMember>,
    private readonly organizationsService: OrganizationsService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 관리자 활동 내역 기록
   */
  private async logActivity(
    adminId: number,
    adminName: string,
    adminEmail: string,
    action: AdminAction,
    details?: {
      targetType?: string;
      targetId?: number;
      targetName?: string;
      additionalInfo?: any;
    },
    ip?: string,
    userAgent?: string,
  ) {
    try {
      const activity = this.activityRepository.create({
        adminId,
        adminName,
        adminEmail,
        action,
        targetType: details?.targetType,
        targetId: details?.targetId,
        targetName: details?.targetName,
        details: details?.additionalInfo,
        ip,
        userAgent,
      });
      await this.activityRepository.save(activity);
    } catch (error) {
      this.logger.error('활동 내역 기록 실패', { error });
    }
  }

  /**
   * 공지사항 목록 조회 (페이징 포함)
   */
  async getNotices(page: number = 1, limit: number = 10) {
    const queryBuilder = this.noticeRepository.createQueryBuilder('notice');
    
    const [items, total] = await queryBuilder
      .orderBy('notice.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * 공지사항 상세 조회
   */
  async getNoticeById(id: string) {
    const notice = await this.noticeRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!notice) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }

    return notice;
  }

  /**
   * 공지사항 생성 (Admin 전용)
   */
  async createNotice(
    title: string,
    content: string,
    scope: 'public' | 'private' = 'public',
    organizationId?: string,
    isPinned?: boolean,
  ) {
    const notice = this.noticeRepository.create({
      title,
      content,
      scope,
      organizationId,
      isPinned,
    });

    return this.noticeRepository.save(notice);
  }

  /**
   * 공지사항 수정 (Admin 전용)
   */
  async updateNotice(id: string, data: Partial<Notice>) {
    const notice = await this.getNoticeById(id);
    
    Object.assign(notice, data);
    return this.noticeRepository.save(notice);
  }

  /**
   * 공지사항 삭제 (Admin 전용)
   */
  async deleteNotice(id: string) {
    const notice = await this.getNoticeById(id);
    return this.noticeRepository.remove(notice);
  }

  /**
   * 공지사항 고정/비고정 토글
   */
  async togglePin(id: string, pinned: boolean) {
    const notice = await this.getNoticeById(id);
    notice.isPinned = pinned;
    return this.noticeRepository.save(notice);
  }

  /**
   * 기관별 공지사항 조회 (관리자 전용)
   */
  async getOrganizationNotices(organizationId: string, page: number = 1, limit: number = 10) {
    const queryBuilder = this.noticeRepository.createQueryBuilder('notice')
      .where('notice.organizationId = :orgId', { orgId: organizationId })
      .orderBy('notice.createdAt', 'DESC');

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * 공개 그룹 등록 (Admin) — 아파트 관리 공지, 동네 모임 등
   */
  async createGroup(data: CreateGroupDto) {
    const group = this.familyRepository.create({
      name: data.name,
      description: data.description || null,
      address: data.address || '',
      isPublic: true,
    });
    const saved = await this.familyRepository.save(group);
    await this.logActivity(0, 'system', 'system', AdminAction.CREATE_GROUP, {
      targetType: 'group',
      targetName: data.name,
    }).catch(() => {});
    return { id: saved.id, name: saved.name, isPublic: true };
  }

  /** 공개 그룹 목록 (Admin) */
  async listGroups() {
    const groups = await this.familyRepository.find({
      where: { isPublic: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const memberCounts = await this.familyMemberRepository
      .createQueryBuilder('m')
      .select('m.familyId', 'familyId')
      .addSelect('COUNT(*)', 'count')
      .where('m.familyId IN (:...ids)', { ids: groups.map((g) => g.id) })
      .groupBy('m.familyId')
      .getRawMany();
    const countMap = new Map(memberCounts.map((c) => [Number(c.familyId), Number(c.count)]));
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description || null,
      address: g.address || null,
      memberCount: countMap.get(g.id) || 0,
      hasInviteCode: !!g.code && (!g.expiresAt || new Date(g.expiresAt) > new Date()),
      createdAt: g.createdAt,
    }));
  }

  /** 그룹 초대 코드 발급/재발급 (Admin) — 20분 유효 */
  async getOrCreateGroupInviteCode(groupId: number, regenerate = false) {
    const group = await this.familyRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('그룹을 찾을 수 없습니다');
    // 공개 그룹 초대코드는 무제한
    const unlimited = !!group.isPublic;
    const valid =
      !regenerate &&
      group.code &&
      (unlimited || !group.expiresAt || new Date(group.expiresAt) > new Date());
    if (valid) return { code: group.code, expiresAt: group.expiresAt };

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const expiresAt = unlimited ? null : new Date(Date.now() + 20 * 60 * 1000);
    await this.familyRepository.update({ id: groupId }, { code, expiresAt });
    await this.logActivity(0, 'system', 'system', AdminAction.CREATE_GROUP, {
      targetType: 'group-invite',
      targetName: `${group.name} 초대코드 발급`,
    }).catch(() => {});
    return { code, expiresAt };
  }

  /**
   * 기관 생성 (Admin)
   */
  async createOrganization(data: CreateOrganizationDto): Promise<any> {
    return this.organizationsService.create(data);
  }

  /**
   * 기관 수정 (Admin)
   */
  async updateOrganization(id: string, data: UpdateOrganizationDto): Promise<any> {
    return this.organizationsService.update(id, data);
  }

  /**
   * 기관 삭제 (Admin)
   */
  async deleteOrganization(id: string): Promise<void> {
    return this.organizationsService.remove(id);
  }

  /**
   * 대시보드 통계 조회
   */
  async getDashboardStats() {
    const [
      totalUsers,
      totalContents,
      totalParticipations,
      totalNotices,
      recentUsers,
      recentContents,
    ] = await Promise.all([
      this.userRepository.count(),
      this.contentRepository.count(),
      this.participationRepository.count(),
      this.noticeRepository.count(),
      this.userRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.contentRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    // 이벤트 참여 통계
    const participationStats = await this.participationRepository
      .createQueryBuilder('participation')
      .select('participation.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('participation.status')
      .getRawMany();

    const statusCounts = participationStats.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);

    // 콘텐츠 타입별 통계
    const contentStats = await this.contentRepository
      .createQueryBuilder('content')
      .select('content.contentType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('content.contentType')
      .getRawMany();

    const typeCounts = contentStats.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      overview: {
        totalUsers,
        totalContents,
        totalParticipations,
        totalNotices,
      },
      participation: {
        registered: statusCounts['REGISTERED'] || 0,
        attended: statusCounts['ATTENDED'] || 0,
        cancelled: statusCounts['CANCELLED'] || 0,
        completed: statusCounts['COMPLETED'] || 0,
      },
      contentByType: {
        general: typeCounts['GENERAL'] || 0,
        event: typeCounts['EVENT'] || 0,
        notice: typeCounts['NOTICE'] || 0,
        program: typeCounts['PROGRAM'] || 0,
      },
      recent: {
        users: recentUsers,
        contents: recentContents,
      },
    };
  }

  /**
   * 사용자 활동 통계
   */
  async getUserActivityStats(userId?: number) {
    const where = userId ? { userId } : {};

    const [
      totalParticipations,
      attendedEvents,
      cancelledParticipations,
    ] = await Promise.all([
      this.participationRepository.count({ where }),
      this.participationRepository.count({
        where: { ...where, status: 'ATTENDED' as any },
      }),
      this.participationRepository.count({
        where: { ...where, status: 'CANCELLED' as any },
      }),
    ]);

    return {
      totalParticipations,
      attendedEvents,
      cancelledParticipations,
      attendanceRate: totalParticipations > 0
        ? Math.round((attendedEvents / totalParticipations) * 100)
        : 0,
    };
  }

  /**
   * 콘텐츠 인기 순위
   */
  async getPopularContents(limit: number = 10) {
    return this.contentRepository
      .createQueryBuilder('content')
      .orderBy('content.views', 'DESC')
      .addOrderBy('content.currentParticipants', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 일별 통계 (최근 7일)
   */
  async getDailyStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      newUsers,
      newContents,
      newParticipations,
    ] = await Promise.all([
      this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :date', { date: sevenDaysAgo })
        .getCount(),
      this.contentRepository
        .createQueryBuilder('content')
        .where('content.createdAt >= :date', { date: sevenDaysAgo })
        .getCount(),
      this.participationRepository
        .createQueryBuilder('participation')
        .where('participation.registeredAt >= :date', { date: sevenDaysAgo })
        .getCount(),
    ]);

    return {
      period: 'last_7_days',
      newUsers,
      newContents,
      newParticipations,
    };
  }

  /**
   * 관리자 생성
   */
  async createAdmin(adminData: CreateAdminDto, ip?: string, userAgent?: string): Promise<User> {
    this.logger.log(`관리자 생성 시도: ${adminData.email}`, { adminData });

    // 이메일 중복 확인
    const existingUser = await this.userRepository.findOne({
      where: { email: adminData.email },
    });

    if (existingUser) {
      this.logger.warn(`이메일 중복 시도: ${adminData.email}`);
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const admin = this.userRepository.create({
      ...adminData,
      password: hashedPassword,
      birthDate: adminData.birthDate ? new Date(adminData.birthDate) : null,
    });

    const result = await this.userRepository.save(admin);
    this.logger.log(`관리자 생성 성공: ${adminData.email}`, { userId: result.id });

    // 활동 내역 기록 (임시 관리자 정보)
    await this.logActivity(
      0,
      'System',
      'system@ieum.com',
      AdminAction.CREATE_ADMIN,
      {
        targetType: 'User',
        targetId: result.id,
        targetName: result.name || result.email,
        additionalInfo: { email: result.email, role: result.role },
      },
      ip,
      userAgent,
    );

    return result;
  }

  /**
   * 관리자 목록 조회
   */
  async getAdminUsers() {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', { roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
      .select(['user.id', 'user.name', 'user.email', 'user.role', 'user.status', 'user.createdAt'])
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 관리자 역할 변경
   */
  async updateAdminRole(userId: number, role: UserRole): Promise<User> {
    const admin = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!admin) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    admin.role = role;
    return this.userRepository.save(admin);
  }

  /**
   * 관리자 삭제 (소프트 삭제)
   */
  async deleteAdmin(userId: number): Promise<void> {
    const admin = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!admin) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    await this.userRepository.update(userId, { status: 'DELETED' as any });
  }

  /**
   * 활동 내역 조회 (페이징)
   */
  async getActivityLogs(query?: { page?: number; limit?: number; action?: string }) {
    const { page = 1, limit = 10, action } = query || {};
    
    let whereClause: Record<string, any> = {};
    if (action) {
      whereClause.action = AdminAction[action];
    }

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('1=1', [])
      .andWhere('(:...conditions) OR (:conditions IS NULL)', {
        conditions: Object.keys(whereClause),
      })
      .select([
        'activity.id',
        'activity.adminId',
        'activity.adminName',
        'activity.adminEmail',
        'activity.action',
        'activity.targetType',
        'activity.targetId',
        'activity.targetName',
        'activity.details',
        'activity.ip',
        'activity.userAgent',
        'activity.createdAt',
      ]);

    const [items, total] = await queryBuilder
      .orderBy('activity.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * 특정 관리자의 활동 내역 조회
   */
  async getAdminActivityLogs(adminId: number, query?: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = query || {};

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.adminId = :adminId', { adminId })
      .select([
        'activity.id',
        'activity.adminId',
        'activity.adminName',
        'activity.adminEmail',
        'activity.action',
        'activity.targetType',
        'activity.targetId',
        'activity.targetName',
        'activity.details',
        'activity.ip',
        'activity.userAgent',
        'activity.createdAt',
      ]);

    const [items, total] = await queryBuilder
      .orderBy('activity.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * 특정 행동별 활동 내역 조회
   */
  async getActivityLogsByAction(action: string, query?: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = query || {};

    const activityEnumValue = AdminAction[action];
    if (!activityEnumValue) {
      throw new BadRequestException(`잘못된 행동 타입: ${action}`);
    }

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.action = :action', { action: activityEnumValue })
      .select([
        'activity.id',
        'activity.adminId',
        'activity.adminName',
        'activity.adminEmail',
        'activity.action',
        'activity.targetType',
        'activity.targetId',
        'activity.targetName',
        'activity.details',
        'activity.ip',
        'activity.userAgent',
        'activity.createdAt',
      ]);

    const [items, total] = await queryBuilder
      .orderBy('activity.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * 활동 내역 통계 (최신 N 개)
   */
  async getActivityStats(limit: number = 10) {
    const actionsCount = await this.activityRepository.createQueryBuilder('activity')
      .select('action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('action')
      .having('COUNT(*) > 0')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return actionsCount.map(({ action, count }) => ({
      action,
      count: parseInt(count),
    }));
  }

  /**
   * 검수 요청 생성 (REVIEWER 전용)
   */
  async createReviewRequest(
    targetType: string,
    targetId: number,
    reviewerName: string,
    reviewerEmail: string,
    comment: string,
    action: AdminAction = AdminAction.REVIEW_REQUEST_CREATE,
  ): Promise<AdminActivity> {
    const reviewRequest = this.activityRepository.create({
      adminId: 0, // Reviewer 는 별도 권한으로 처리
      adminName: reviewerName,
      adminEmail: reviewerEmail,
      action,
      targetType,
      targetId,
      targetName: await this.getTargetName(targetType, targetId),
      details: { comment },
    });

    return this.activityRepository.save(reviewRequest);
  }

  /**
   * 검수 승인 처리
   */
  async approveReview(
    targetType: string,
    targetId: number,
    reviewerName: string,
    reviewerEmail: string,
    comment: string,
  ): Promise<AdminActivity> {
    return this.createReviewRequest(
      targetType,
      targetId,
      reviewerName,
      reviewerEmail,
      comment,
      AdminAction.REVIEW_REQUEST_APPROVE,
    );
  }

  /**
   * 검수 거절 처리
   */
  async rejectReview(
    targetType: string,
    targetId: number,
    reviewerName: string,
    reviewerEmail: string,
    comment: string,
    action: AdminAction = AdminAction.REVIEW_REQUEST_REJECT,
  ): Promise<AdminActivity> {
    return this.createReviewRequest(
      targetType,
      targetId,
      reviewerName,
      reviewerEmail,
      comment,
      action,
    );
  }

  /**
   * 검수 내역 조회 (REVIEWER)
   */
  async getReviewRequests(query?: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 10, status } = query || {};

    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.action IN (:...actions)', {
        actions: [
          AdminAction.REVIEW_REQUEST_CREATE,
          AdminAction.REVIEW_REQUEST_APPROVE,
          AdminAction.REVIEW_REQUEST_REJECT,
        ],
      })
      .orderBy('activity.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      queryBuilder.andWhere(`activity.action = :action`, { action: AdminAction[status] });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, limit };
  }

  /**
   * 검수 대상 상세 조회
   */
  async getReviewTargetDetails(
    targetType: string,
    targetId: number,
  ): Promise<Record<string, any>> {
    switch (targetType) {
      case 'User':
        return this.userRepository.findOne({ where: { id: targetId } });
      case 'Content':
        return this.contentRepository.findOne({ where: { id: targetId } });
      default:
        return null;
    }
  }

  /**
   * 검수 대상 이름 조회 (도움)
   */
  private async getTargetName(targetType: string, targetId: number): Promise<string> {
    // 추후 실제 타겟 엔티티에서 이름 가져오기
    if (targetType === 'Content') {
      const content = await this.contentRepository.findOne({ where: { id: targetId } });
      return content?.title || 'Unknown';
    }
    return 'Unknown';
  }

  /**
   * 콘텐츠 승인 처리
   */
  async approveContent(contentId: number, reviewerName: string, reviewerEmail: string, comment?: string) {
    const content = await this.contentRepository.findOne({ where: { id: contentId } });
    if (!content) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    }

    content.isApproved = true;
    content.reviewedBy = parseInt(reviewerEmail); // 임시: 이메일을 ID로 사용
    content.updatedAt = new Date();

    await this.contentRepository.save(content);

    await this.logActivity(
      parseInt(reviewerEmail), // 임시
      reviewerName,
      reviewerEmail,
      AdminAction.APPROVE_CONTENT,
      {
        targetType: 'Content',
        targetId: content.id,
        targetName: content.title,
        additionalInfo: { comment },
      },
    );
  }

  /**
   * 콘텐츠 거절 처리
   */
  async rejectContent(contentId: number, reviewerName: string, reviewerEmail: string, comment?: string) {
    const content = await this.contentRepository.findOne({ where: { id: contentId } });
    if (!content) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    }

    content.isApproved = false;
    content.reviewedBy = parseInt(reviewerEmail); // 임시
    content.updatedAt = new Date();

    await this.contentRepository.save(content);

    await this.logActivity(
      parseInt(reviewerEmail), // 임시
      reviewerName,
      reviewerEmail,
      AdminAction.REJECT_CONTENT,
      {
        targetType: 'Content',
        targetId: content.id,
        targetName: content.title,
        additionalInfo: { comment },
      },
    );
  }

  /**
   * REVIEWER 로 권한 부여
   */
  async makeReviewer(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    user.role = UserRole.REVIEWER;
    return this.userRepository.save(user);
  }

  /**
   * 이벤트 생성 (Admin)
   */
  async createEvent(dto: any): Promise<Event> {
    const event = this.eventRepository.create({
      ...dto,
      status: EventStatus.OPEN,
    });
    const saved = await this.eventRepository.save(event);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  /**
   * 이벤트 업데이트 (Admin)
   */
  async updateEvent(id: number, dto: any): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    Object.assign(event, dto);
    return this.eventRepository.save(event);
  }

  /**
   * 이벤트 삭제 (Admin)
   */
  async deleteEvent(id: number): Promise<void> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('이벤트를 찾을 수 없습니다.');
    }

    await this.eventRepository.remove(event);
  }

  /**
   * 이벤트 목록 조회
   */
  async getEvents(page: number = 1, limit: number = 10) {
    const queryBuilder = this.eventRepository.createQueryBuilder('event');
    
    const [items, total] = await queryBuilder
      .orderBy('event.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * 이벤트 상세 조회
   */
  async getEventById(id: number): Promise<Event | null> {
    return this.eventRepository.findOne({ where: { id } });
  }

  /**
   * REVIEWER 로직 권한 해제
   */
  async revokeReviewer(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    user.role = UserRole.USER;
    return this.userRepository.save(user);
  }

  /**
   * 사용자 목록 조회 (알림 대상 선택용)
   */
  async getUsers(keyword?: string, page = 1, limit = 20) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.email', 'user.role', 'user.createdAt'])
      .where('user.status != :deleted', { deleted: 'DELETED' as any });

    if (keyword) {
      qb.andWhere('(user.name ILIKE :kw OR user.email ILIKE :kw)', { kw: `%${keyword}%` });
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  /**
   * 특정 사용자/그룹/전체에게 알림 발송 (웹 푸시 포함)
   */
  async sendNotification(data: SendNotificationDto) {
    let userIds = data.userIds ?? [];

    if (data.all) {
      const users = await this.userRepository.find({
        where: { status: 'ACTIVE' as any },
        select: ['id'],
      });
      userIds = users.map((u) => u.id);
    }

    if (userIds.length === 0) {
      throw new BadRequestException('발송 대상 사용자가 없습니다.');
    }

    const notifications = await this.notificationService.sendToMultipleUsers(
      userIds,
      data.title,
      data.body,
      data.type,
      data.payload,
    );

    return {
      success: true,
      sentCount: notifications.length,
      userCount: userIds.length,
    };
  }

}