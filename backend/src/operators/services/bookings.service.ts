import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramBooking, BookingStatus } from '../entities/program-booking.entity';
import { Operator } from '../entities/operator.entity';
import { OperatorProgram } from '../entities/operator-program.entity';
import { OperatorReview } from '../entities/operator-review.entity';
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
    private readonly operatorsService: OperatorsService,
  ) {}

  // 이용자 예약 신청 → REQUESTED
  async requestBooking(
    programId: number,
    userId: number,
    requesterName: string | undefined,
    headcount: number,
    message: string | undefined,
  ): Promise<ProgramBooking> {
    const program = await this.operatorsService.findProgram(programId);
    if (!program.isActive) throw new BadRequestException('신청이 마감된 프로그램입니다');
    if (new Date(program.eventDate) < new Date(new Date().toDateString())) {
      throw new BadRequestException('이미 지난 프로그램입니다');
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

    const remaining = program.capacity - program.bookedCount;
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

  private async assertOperator(booking: ProgramBooking, userId: number): Promise<Operator> {
    const op = await this.operatorsService.findOwned(Number(booking.operatorId), userId);
    return op;
  }

  // 공영자: 수락 (REQUESTED → ACCEPTED)
  async accept(id: number, userId: number): Promise<ProgramBooking> {
    const b = await this.findOne(id);
    await this.assertOperator(b, userId);
    if (b.status !== 'REQUESTED') throw new BadRequestException('수락 가능한 상태가 아닙니다');
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
