import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UsePipes, Header, UseGuards, Req } from '@nestjs/common';
import { OperatorsService } from '../services/operators.service';
import { BookingsService } from '../services/bookings.service';
import { ZodValidationPipe } from '../../common/validation/zod.validation.pipe';
import {
  createOperatorSchema, updateOperatorSchema, operatorStatusSchema,
  createProgramSchema, updateProgramSchema, createBookingSchema, bookingActionSchema,
  createReviewSchema, sendBookingNoticeSchema,
} from '../dto/operator.dto';
import type {
  CreateOperatorDto, UpdateOperatorDto, OperatorStatusDto,
  CreateProgramDto, UpdateProgramDto, CreateBookingDto, BookingActionDto, CreateReviewDto,
  SendBookingNoticeDto,
} from '../dto/operator.dto';
import { UserAuthGuard, AdminAuthGuard } from '../guards/user-auth.guard';

@Controller()
export class OperatorsController {
  constructor(
    private readonly operatorsService: OperatorsService,
    private readonly bookingsService: BookingsService,
  ) {}

  // ── 공개: 기관 목록/상세 ──

  @Get('operators')
  @Header('Cache-Control', 'no-store')
  listOperators(@Query('keyword') keyword?: string, @Query('type') type?: string) {
    return this.operatorsService.findAll(keyword, type);
  }

  // 'me'는 ':id'보다 먼저 선언해야 함 (ParseIntPipe 충돌 방지)
  @Get('operators/me/:userId')
  @UseGuards(UserAuthGuard)
  getMyOperator(@Param('userId', ParseIntPipe) userId: number) {
    return this.operatorsService.findByOwner(userId);
  }

  @Get('operators/:id')
  getOperator(@Param('id', ParseIntPipe) id: number) {
    return this.operatorsService.findOne(id);
  }

  @Get('operators/:id/programs')
  @Header('Cache-Control', 'no-store')
  listPrograms(@Param('id', ParseIntPipe) id: number) {
    return this.operatorsService.listPrograms(id);
  }

  // 기관 후기 목록 + 평균 평점
  @Get('operators/:id/reviews')
  @Header('Cache-Control', 'no-store')
  operatorReviews(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.operatorReviews(id);
  }

  // ── 기관 등록/관리 ──

  @Post('operators')
  @UseGuards(UserAuthGuard)
  @UsePipes(new ZodValidationPipe(createOperatorSchema))
  createOperator(@Body() data: CreateOperatorDto) {
    return this.operatorsService.create(data);
  }

  @Put('operators/:id')
  @UseGuards(UserAuthGuard)
  @UsePipes(new ZodValidationPipe(updateOperatorSchema))
  updateOperator(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateOperatorDto & { userId: number },
  ) {
    return this.operatorsService.update(id, data.userId, data);
  }

  // 기관 승인/반려 (관리자 전용)
  @Post('operators/:id/status')
  @UseGuards(AdminAuthGuard)
  @UsePipes(new ZodValidationPipe(operatorStatusSchema))
  setOperatorStatus(@Param('id', ParseIntPipe) id: number, @Body() data: OperatorStatusDto) {
    return this.operatorsService.setStatus(id, data.status);
  }

  // ── 프로그램 관리 (기관 소유자) ──

  @Post('operators/:id/programs')
  @UseGuards(UserAuthGuard)
  @UsePipes(new ZodValidationPipe(createProgramSchema))
  createProgram(@Param('id', ParseIntPipe) id: number, @Body() data: CreateProgramDto) {
    return this.operatorsService.findOwned(id, data.userId)
      .then(() => this.operatorsService.createProgram(id, data));
  }

  @Get('operators/:id/programs/manage')
  @UseGuards(UserAuthGuard)
  @Header('Cache-Control', 'no-store')
  listProgramsManage(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.operatorsService.findOwned(id, userId)
      .then(() => this.operatorsService.listPrograms(id, true));
  }

  @Get('programs/:id')
  getProgram(@Param('id', ParseIntPipe) id: number) {
    return this.operatorsService.findProgram(id);
  }

  @Put('programs/:id')
  @UseGuards(UserAuthGuard)
  @UsePipes(new ZodValidationPipe(updateProgramSchema))
  updateProgram(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateProgramDto & { userId: number },
  ) {
    return this.operatorsService.updateProgram(id, data.userId, data);
  }

  @Delete('programs/:id')
  @UseGuards(UserAuthGuard)
  deleteProgram(@Param('id', ParseIntPipe) id: number, @Query('userId', ParseIntPipe) userId: number) {
    return this.operatorsService.deleteProgram(id, userId);
  }

  // ── 예약 ──

  @Post('programs/:id/bookings')
  @UseGuards(UserAuthGuard)
  @UsePipes(new ZodValidationPipe(createBookingSchema))
  requestBooking(@Param('id', ParseIntPipe) id: number, @Body() data: CreateBookingDto) {
    return this.bookingsService.requestBooking(
      id, data.userId, data.requesterName, data.headcount, data.message,
      data.familyId, data.desiredAddress, data.desiredLat, data.desiredLng,
    );
  }

  @Get('bookings/my')
  @UseGuards(UserAuthGuard)
  @Header('Cache-Control', 'no-store')
  myBookings(@Query('userId', ParseIntPipe) userId: number) {
    return this.bookingsService.myBookings(userId);
  }

  // 후기 작성 완료된 예약 ID 목록
  @Get('bookings/reviewed')
  @UseGuards(UserAuthGuard)
  reviewedBookings(@Query('userId', ParseIntPipe) userId: number) {
    return this.bookingsService.myReviewStatus(userId).then((map) => ({
      bookingIds: Object.keys(map).filter((k) => map[k]).map(Number),
    }));
  }

  @Get('bookings/:id')
  @UseGuards(UserAuthGuard)
  async getBooking(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = Number(req.userId);
    return this.bookingsService.findOneForUser(id, userId);
  }

  // 공영자: 지난 프로그램별 예약/정산/후기 이력
  @Get('operators/:id/history')
  @UseGuards(UserAuthGuard)
  @Header('Cache-Control', 'no-store')
  operatorHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.operatorsService.findOwned(id, userId)
      .then(() => this.bookingsService.operatorHistory(id));
  }

  @Get('operators/:id/bookings')
  @UseGuards(UserAuthGuard)
  @Header('Cache-Control', 'no-store')
  operatorBookings(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
    @Query('status') status?: string,
  ) {
    return this.operatorsService.findOwned(id, userId)
      .then(() => this.bookingsService.operatorBookings(id, status));
  }

  @Post('bookings/:id/accept')
  @UseGuards(UserAuthGuard)
  @UsePipes(new ZodValidationPipe(bookingActionSchema))
  acceptBooking(@Param('id', ParseIntPipe) id: number, @Body() data: BookingActionDto) {
    return this.bookingsService.accept(id, data.userId);
  }

  @Post('bookings/:id/reject')
  @UseGuards(UserAuthGuard)
  @UsePipes(new ZodValidationPipe(bookingActionSchema))
  rejectBooking(@Param('id', ParseIntPipe) id: number, @Body() data: BookingActionDto) {
    return this.bookingsService.reject(id, data.userId, data.reason);
  }

  @Post('bookings/:id/payment')
  @UseGuards(UserAuthGuard)
  @UsePipes(new ZodValidationPipe(bookingActionSchema))
  submitPayment(@Param('id', ParseIntPipe) id: number, @Body() data: BookingActionDto) {
    return this.bookingsService.submitPayment(id, data.userId, data.payerName);
  }

  @Post('bookings/:id/complete')
  @UseGuards(UserAuthGuard)
  @UsePipes(new ZodValidationPipe(bookingActionSchema))
  completeBooking(@Param('id', ParseIntPipe) id: number, @Body() data: BookingActionDto) {
    return this.bookingsService.complete(id, data.userId);
  }

  @Post('bookings/:id/confirm')
  @UseGuards(UserAuthGuard)
  @UsePipes(new ZodValidationPipe(bookingActionSchema))
  confirmBooking(@Param('id', ParseIntPipe) id: number, @Body() data: BookingActionDto) {
    return this.bookingsService.confirm(id, data.userId);
  }

  // 이용자: 수락된 예약의 프로그램 안내를 가족/그룹 멤버에게 공지 (전체 또는 일부)
  @Post('bookings/:id/notice')
  @UseGuards(UserAuthGuard)
  @UsePipes(new ZodValidationPipe(sendBookingNoticeSchema))
  sendBookingNotice(@Param('id', ParseIntPipe) id: number, @Body() data: SendBookingNoticeDto) {
    return this.bookingsService.sendBookingNotice(
      id,
      data.userId,
      data.familyId,
      data.memberIds,
      data.message,
    );
  }

  // 이용자: 정산 완료 예약에 후기 작성
  @Post('bookings/:id/review')
  @UseGuards(UserAuthGuard)
  @UsePipes(new ZodValidationPipe(createReviewSchema))
  createReview(@Param('id', ParseIntPipe) id: number, @Body() data: CreateReviewDto) {
    return this.bookingsService.createReview(id, data.userId, data.rating, data.comment);
  }

  @Post('bookings/:id/cancel')
  @UseGuards(UserAuthGuard)
  @UsePipes(new ZodValidationPipe(bookingActionSchema))
  cancelBooking(@Param('id', ParseIntPipe) id: number, @Body() data: BookingActionDto) {
    return this.bookingsService.cancel(id, data.userId, data.reason);
  }
}
