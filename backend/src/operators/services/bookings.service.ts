import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramBooking, BookingStatus } from '../entities/program-booking.entity';
import { Operator } from '../entities/operator.entity';
import { OperatorProgram } from '../entities/operator-program.entity';
import { OperatorReview } from '../entities/operator-review.entity';
import { FamilyMember, MemberRole } from '../../family/entities/family-member.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import { OperatorsService } from './operators.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(ProgramBooking)
    private readonly bookingRepo: Repository<ProgramBooking>,
    @InjectRepository(Operator)
    private readonly operatorRepo: Repository<Operator>,
    @InjectRepository(OperatorProgram)
    private readonly programRepo: Repository<OperatorProgram>,
    @InjectRepository(OperatorReview)
    private readonly reviewRepo: Repository<OperatorReview>,
    @InjectRepository(FamilyMember)
    private readonly familyMemberRepo: Repository<FamilyMember>,
    private readonly notificationService: NotificationService,
    private readonly operatorsService: OperatorsService,
  ) {}

  // 그룹(가족)을 위한 예약은 그룹장(HEAD)만 가능 — 요양·간병/방문서비스는 가족 지정 필수
  private static readonly CARE_CATEGORIES = ['요양·간병', '방문서비스'];

  // 이용자 예약 신청 → REQUESTED
  async requestBooking(
    programId: number,
    userId: number,
    requesterName: string | undefined,
    headcount: number,
    message: string | undefined,
    familyId?: number,
    desiredAddress?: string,
    desiredLat?: number,
    desiredLng?: number,
  ): Promise<ProgramBooking> {
    const program = await this.operatorsService.findProgram(programId);
    if (!program.isActive) throw new BadRequestException('신청이 마감된 프로그램입니다');
    if (new Date(program.eventDate) < new Date(new Date().toDateString())) {
      throw new BadRequestException('이미 지난 프로그램입니다');
    }

    const isCareService = BookingsService.CARE_CATEGORIES.includes(program.category);
    if (isCareService && !familyId) {
      throw new BadRequestException('요양·간병/방문서비스는 가족(그룹)을 지정해 예약해야 합니다');
    }
    if (isCareService && !desiredAddress && desiredLat === undefined) {
      throw new BadRequestException('요양·간병/방문서비스는 서비스 받을 희망 장소를 지도에서 선택해주세요');
    }
    if (familyId) {
      const membership = await this.familyMemberRepo.findOne({
        where: { familyId, userId },
      });
      if (!membership) {
        throw new ForbiddenException('해당 가족/그룹의 멤버가 아닙니다');
      }
      if (membership.role !== MemberRole.HEAD) {
        throw new ForbiddenException('그룹을 위한 예약은 그룹장(가족장)만 신청할 수 있습니다');
      }
    }

    const operator = await this.operatorsService.findOne(Number(program.operatorId));
    if (operator.status !== 'APPROVED') {
      throw new BadRequestException('아직 승인되지 않은 기관의 프로그램입니다');
    }

    // 동일 프로그램 중복 신청 방지 (진행 중 상태만)
    const dup = await this.bookingRepo.findOne({
      where: {
        programId,
        requesterUserId: userId,
        status: 'REQUESTED' as BookingStatus,
      },
    });
    if (dup) throw new BadRequestException('이미 신청한 프로그램입니다');

    // 진행 중 예약(REQUESTED/ACCEPTED/PAID)의 인원도 좌석을 홀드 — 정원 초과 방지
    const held = await this.heldHeadcount(programId);
    const remaining = program.capacity - program.bookedCount - held;
    if (headcount > remaining) {
      throw new BadRequestException(`잔여 좌석이 부족합니다 (잔여 ${remaining}석)`);
    }

    const totalAmount = program.price * headcount;
    const feeRate = Number(operator.feeRate ?? 10);
    const platformFee = Math.round((totalAmount * feeRate) / 100);
    const operatorAmount = totalAmount - platformFee;

    const booking = this.bookingRepo.create({
      programId,
      operatorId: Number(program.operatorId),
      requesterUserId: userId,
      requesterName: requesterName ?? null,
      familyId: familyId ?? null,
      desiredAddress: desiredAddress ?? null,
      desiredLat: desiredLat ?? null,
      desiredLng: desiredLng ?? null,
      headcount,
      message: message ?? null,
      status: 'REQUESTED',
      unitPrice: program.price,
      totalAmount,
      feeRate,
      platformFee,
      operatorAmount,
    });
    return this.bookingRepo.save(booking);
  }

  // 확정 전 진행 중 상태의 예약 인원 합계 (좌석 홀드)
  private async heldHeadcount(programId: number): Promise<number> {
    const row = await this.bookingRepo
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.headcount), 0)', 'held')
      .where('b.program_id = :programId', { programId })
      .andWhere('b.status IN (:...statuses)', {
        statuses: ['REQUESTED', 'ACCEPTED', 'PAID'],
      })
      .getRawOne();
    return Number(row?.held ?? 0);
  }

  async myBookings(userId: number): Promise<ProgramBooking[]> {
    return this.bookingRepo.find({
      where: { requesterUserId: userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async operatorBookings(operatorId: number, status?: string): Promise<ProgramBooking[]> {
    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .where('b.operator_id = :operatorId', { operatorId })
      .orderBy('b.created_at', 'DESC')
      .take(200);
    if (status) qb.andWhere('b.status = :status', { status });
    return qb.getMany();
  }

  async findOne(id: number): Promise<ProgramBooking> {
    const b = await this.bookingRepo.findOne({ where: { id: String(id) } });
    if (!b) throw new NotFoundException('예약을 찾을 수 없습니다');
    return b;
  }

  // 예약자 본인 또는 해당 공영자만 조회 가능
  async findOneForUser(id: number, userId: number): Promise<ProgramBooking> {
    const b = await this.findOne(id);
    if (Number(b.requesterUserId) === userId) return b;
    const op = await this.operatorRepo.findOne({ where: { id: String(b.operatorId) } });
    if (op && Number(op.ownerUserId) === userId) return b;
    throw new ForbiddenException('본인 예약만 조회할 수 있습니다');
  }

  private async assertOperator(booking: ProgramBooking, userId: number): Promise<Operator> {
    const op = await this.operatorsService.findOwned(Number(booking.operatorId), userId);
    return op;
  }

  // 공영자: 수락 (REQUESTED → ACCEPTED)
  async accept(id: number, userId: number): Promise<ProgramBooking> {
    const b = await this.findOne(id);
    await this.assertOperator(b, userId);
    if (b.status !== 'REQUESTED') throw new BadRequestException('수락 가능한 상태가 아닙니다');
    // 프로그램 정원이 줄어든 경우 수락 차단 (홀드 포함 점유 좌석 기준)
    const program = await this.programRepo.findOne({ where: { id: String(b.programId) } });
    if (program) {
      const held = await this.heldHeadcount(Number(b.programId));
      if (Number(program.bookedCount) + held > Number(program.capacity)) {
        throw new BadRequestException('잔여 좌석이 부족하여 수락할 수 없습니다');
      }
    }
    b.status = 'ACCEPTED';
    return this.bookingRepo.save(b);
  }

  // 공영자: 거절 (REQUESTED → REJECTED)
  async reject(id: number, userId: number, reason?: string): Promise<ProgramBooking> {
    const b = await this.findOne(id);
    await this.assertOperator(b, userId);
    if (b.status !== 'REQUESTED') throw new BadRequestException('거절 가능한 상태가 아닙니다');
    b.status = 'REJECTED';
    b.cancelReason = reason ?? null;
    return this.bookingRepo.save(b);
  }

  // 이용자: 입금 완료 신고 (ACCEPTED → PAID, 플랫폼 에스크로 보관)
  async submitPayment(id: number, userId: number, payerName?: string): Promise<ProgramBooking> {
    const b = await this.findOne(id);
    if (Number(b.requesterUserId) !== userId) {
      throw new BadRequestException('본인 예약만 입금 신고할 수 있습니다');
    }
    if (b.status !== 'ACCEPTED') throw new BadRequestException('입금 가능한 상태가 아닙니다');
    b.status = 'PAID';
    b.paymentMethod = 'MANUAL';
    b.payerName = payerName ?? null;
    b.paidAt = new Date();
    return this.bookingRepo.save(b);
  }

  // 공영자: 운영 완료 처리 (PAID → COMPLETED, 이용자 확인 대기)
  async complete(id: number, userId: number): Promise<ProgramBooking> {
    const b = await this.findOne(id);
    await this.assertOperator(b, userId);
    if (b.status !== 'PAID') throw new BadRequestException('입금 완료된 예약만 운영 완료 처리할 수 있습니다');
    b.status = 'COMPLETED';
    b.completedAt = new Date();
    const saved = await this.bookingRepo.save(b);
    await this.operatorsService.adjustBookedCount(Number(b.programId), Number(b.headcount));
    return saved;
  }

  // 이용자: 운영 확인 → 정산 (COMPLETED → SETTLED)
  async confirm(id: number, userId: number): Promise<ProgramBooking> {
    const b = await this.findOne(id);
    if (Number(b.requesterUserId) !== userId) {
      throw new BadRequestException('본인 예약만 확인할 수 있습니다');
    }
    if (b.status !== 'COMPLETED') throw new BadRequestException('확인 가능한 상태가 아닙니다');
    b.status = 'SETTLED';
    b.settledAt = new Date();
    return this.bookingRepo.save(b);
  }

  // 이용자: 정산 완료 예약에 후기 작성 (SETTLED, 예약당 1회)
  async createReview(
    bookingId: number,
    userId: number,
    rating: number,
    comment?: string,
  ): Promise<OperatorReview> {
    const b = await this.findOne(bookingId);
    if (Number(b.requesterUserId) !== userId) {
      throw new BadRequestException('본인 예약에만 후기를 작성할 수 있습니다');
    }
    if (b.status !== 'SETTLED') {
      throw new BadRequestException('정산 완료된 예약에만 후기를 작성할 수 있습니다');
    }
    const dup = await this.reviewRepo.findOne({ where: { bookingId } });
    if (dup) throw new ConflictException('이미 후기를 작성한 예약입니다');

    const review = this.reviewRepo.create({
      bookingId,
      operatorId: Number(b.operatorId),
      programId: Number(b.programId),
      reviewerUserId: userId,
      reviewerName: b.requesterName ?? null,
      rating,
      comment: comment ?? null,
    });
    return this.reviewRepo.save(review);
  }

  async operatorReviews(operatorId: number): Promise<{ items: OperatorReview[]; avgRating: number | null; count: number }> {
    const items = await this.reviewRepo.find({
      where: { operatorId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const count = items.length;
    const avgRating = count ? items.reduce((s, r) => s + r.rating, 0) / count : null;
    return { items, avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null, count };
  }

  async myReviewStatus(userId: number): Promise<Record<string, boolean>> {
    const reviews = await this.reviewRepo.find({ where: { reviewerUserId: userId } });
    const map: Record<string, boolean> = {};
    for (const r of reviews) map[String(r.bookingId)] = true;
    return map;
  }

  // 공영자: 지난 프로그램별 예약/정산 이력
  async operatorHistory(operatorId: number): Promise<any[]> {
    const programs = await this.programRepo
      .createQueryBuilder('p')
      .where('p.operator_id = :operatorId', { operatorId })
      .andWhere('p.event_date < CURRENT_DATE')
      .orderBy('p.event_date', 'DESC')
      .take(100)
      .getMany();
    if (programs.length === 0) return [];

    const stats = await this.bookingRepo
      .createQueryBuilder('b')
      .select('b.program_id', 'programId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN b.status = 'SETTLED' THEN 1 ELSE 0 END)`,
        'settledCount',
      )
      .addSelect(
        `SUM(CASE WHEN b.status = 'SETTLED' THEN b.operator_amount ELSE 0 END)`,
        'settledAmount',
      )
      .where('b.operator_id = :operatorId', { operatorId })
      .groupBy('b.program_id')
      .getRawMany();
    const statMap = new Map(stats.map((s: any) => [Number(s.programId), s]));

    const reviews = await this.reviewRepo
      .createQueryBuilder('r')
      .select('r.program_id', 'programId')
      .addSelect('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.operator_id = :operatorId', { operatorId })
      .groupBy('r.program_id')
      .getRawMany();
    const reviewMap = new Map(reviews.map((r: any) => [Number(r.programId), r]));

    return programs.map((p) => {
      const s = statMap.get(Number(p.id));
      const rv = reviewMap.get(Number(p.id));
      return {
        ...p,
        bookingCount: s ? Number(s.total) : 0,
        settledCount: s ? Number(s.settledCount) : 0,
        settledAmount: s ? Number(s.settledAmount) : 0,
        avgRating: rv ? Math.round(Number(rv.avg) * 10) / 10 : null,
        reviewCount: rv ? Number(rv.cnt) : 0,
      };
    });
  }

  // 이용자: 수락된 예약의 프로그램 안내를 가족/그룹 멤버에게 공지
  async sendBookingNotice(
    bookingId: number,
    userId: number,
    familyId: number,
    memberIds?: number[],
    message?: string,
  ): Promise<{ sent: number }> {
    const b = await this.findOne(bookingId);
    if (Number(b.requesterUserId) !== userId) {
      throw new BadRequestException('본인 예약만 공지할 수 있습니다');
    }
    if (!['ACCEPTED', 'PAID', 'COMPLETED'].includes(b.status)) {
      throw new BadRequestException('기관 수락 이후에만 공지할 수 있습니다');
    }
    const myMembership = await this.familyMemberRepo.findOne({
      where: { familyId, userId },
    });
    if (!myMembership) {
      throw new ForbiddenException('해당 가족/그룹의 멤버만 공지할 수 있습니다');
    }

    const members = await this.familyMemberRepo.find({ where: { familyId } });
    let targets = members.filter((m) => !!m.userId);
    if (memberIds?.length) {
      const idSet = new Set(memberIds);
      targets = targets.filter((m) => idSet.has(Number(m.id)));
    }
    const userIds = [
      ...new Set(
        targets
          .map((m) => (m.userId ? Number(m.userId) : null))
          .filter((id): id is number => !!id && id !== userId),
      ),
    ];
    if (userIds.length === 0) {
      throw new BadRequestException('알림을 받을 멤버가 없습니다 (계정이 있는 멤버만 수신 가능)');
    }

    const program = await this.programRepo.findOne({ where: { id: String(b.programId) } });
    const operator = await this.operatorRepo.findOne({ where: { id: String(b.operatorId) } });
    const when = program?.eventDate
      ? new Date(program.eventDate).toLocaleDateString('ko-KR', {
          year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
        })
      : '';
    const title = '📢 프로그램 안내';
    const body =
      message?.trim() ||
      `${b.requesterName || '예약자'}님이 "${operator?.name || '공영자'}"의 "${program?.title || '프로그램'}"(${when}) 예약이 확정되었습니다. 함께 참여해 주세요.`;

    await this.notificationService.sendToMultipleUsers(
      userIds,
      title,
      body,
      'ANNOUNCEMENT',
      `booking:${bookingId}`,
    );
    return { sent: userIds.length };
  }

  // 취소: REQUESTED/ACCEPTED → CANCELLED, PAID → REFUNDED
  async cancel(id: number, userId: number, reason?: string): Promise<ProgramBooking> {
    const b = await this.findOne(id);
    const isRequester = Number(b.requesterUserId) === userId;
    if (!isRequester) await this.assertOperator(b, userId);
    if (!['REQUESTED', 'ACCEPTED', 'PAID'].includes(b.status)) {
      throw new BadRequestException('취소 가능한 상태가 아닙니다');
    }
    b.status = b.status === 'PAID' ? 'REFUNDED' : 'CANCELLED';
    b.cancelReason = reason ?? null;
    return this.bookingRepo.save(b);
  }
}
