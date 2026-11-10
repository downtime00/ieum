import { Controller, Get, Post, Put, Delete, Query, Body, Param, ParseIntPipe, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { createNoticeSchema, type CreateNoticeDto } from '../dtos/create-notice.dto';
import { createOrganizationSchema, updateOrganizationSchema, type CreateOrganizationDto, type UpdateOrganizationDto } from '../../organizations/dto/create-organization.dto';
import { QueryOrganizationsDto } from '../../organizations/dto/query-organizations.dto';
import { ZodValidationPipe } from '../../common/validation/zod.validation.pipe';
import { createAdminSchema, type CreateAdminDto } from '../dto/create-admin.dto';
import { sendNotificationSchema, type SendNotificationDto } from '../dto/send-notification.dto';
import { UserRole } from '../../users/entities/user.entity';
import { createGroupSchema, type CreateGroupDto } from '../dto/create-group.dto';

interface Notice {
  id?: string;
  title: string;
  content: string;
  scope: 'public' | 'private';
  organizationId?: string;
  isPinned?: boolean;
}

interface Organization {
  id?: number;
  name: string;
  type?: string;
  domain?: string;
}

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * 공지사항 목록 조회
   */
  @Get('notices')
  @ApiOperation({ summary: '공지사항 목록 조회 (페이징 포함)' })
  @ApiResponse({ status: 200, description: '공지사항 목록' })
  async getNotices() {
    return this.adminService.getNotices();
  }

  /**
   * 공지사항 상세 조회
   */
  @Get('notices/:id')
  @ApiOperation({ summary: '공지사항 상세 조회' })
  @ApiResponse({ status: 200, description: '공지사항 상세 정보' })
  async getNoticeById(@Param('id') id: string) {
    return this.adminService.getNoticeById(id);
  }

  /**
   * 공지사항 생성
   */
  @Post('notices')
  @UsePipes(new ZodValidationPipe(createNoticeSchema))
  @ApiOperation({ summary: '공지사항 생성 (Admin)' })
  @ApiResponse({ status: 201, description: '공지사항이 성공적으로 생성됨' })
  async createNotice(@Body() data: CreateNoticeDto): Promise<Notice> {
    return this.adminService.createNotice(
      data.title,
      data.content,
      data.scope ?? 'public',
      data.organizationId,
      data.isPinned,
    );
  }

  /**
   * 공지사항 수정
   */
  @Put('notices/:id')
  @ApiOperation({ summary: '공지사항 수정 (Admin)' })
  @ApiResponse({ status: 200, description: '공지사항이 성공적으로 업데이트됨' })
  async updateNotice(@Param('id') id: string, @Body() data: Partial<Notice>) {
    return this.adminService.updateNotice(id, data);
  }

  /**
   * 공지사항 삭제
   */
  @Delete('notices/:id')
  @ApiOperation({ summary: '공지사항 삭제 (Admin)' })
  @ApiResponse({ status: 200, description: '공지사항이 성공적으로 삭제됨' })
  async deleteNotice(@Param('id') id: string) {
    return this.adminService.deleteNotice(id);
  }

  /**
   * 공지사항 고정/비고정 토글
   */
  @Put('notices/:id/pin')
  @ApiOperation({ summary: '공지사항 고정/비고정 토글' })
  @ApiResponse({ status: 200, description: '고정이 성공적으로 적용됨' })
  async togglePin(@Param('id') id: string, @Body() data: { pinned?: boolean }) {
    return this.adminService.togglePin(id, data.pinned ?? !true);
  }

  /**
   * 기관별 공지사항 조회
   */
  @Get('organizations/:organizationId/notices')
  @ApiOperation({ summary: '기관별 공지사항 조회' })
  @ApiResponse({ status: 200, description: '기관별 공지사항 목록' })
  async getOrganizationNotices(
    @Param('organizationId') organizationId: string,
    @Query() query: QueryOrganizationsDto = {},
  ) {
    return this.adminService.getOrganizationNotices(
      organizationId,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  /**
   * 공개 그룹 등록 (Admin) — 아파트 관리 공지, 동네 모임 등
   */
  @Post('groups')
  @UsePipes(new ZodValidationPipe(createGroupSchema))
  @ApiOperation({ summary: '공개 그룹 등록 (Admin)' })
  @ApiResponse({ status: 201, description: '그룹이 생성됨' })
  async createGroup(@Body() data: CreateGroupDto) {
    return this.adminService.createGroup(data);
  }

  /**
   * 공개 그룹 목록 (Admin)
   */
  @Get('groups')
  @ApiOperation({ summary: '공개 그룹 목록 (Admin)' })
  async listGroups() {
    return this.adminService.listGroups();
  }

  /**
   * 그룹 초대 코드 발급/재발급 (Admin) — QR 코드 공유용
   */
  @Post('groups/:id/invite-code')
  @ApiOperation({ summary: '그룹 초대 코드 발급 (Admin)' })
  async getGroupInviteCode(@Param('id', ParseIntPipe) id: number, @Body('regenerate') regenerate?: boolean) {
    return this.adminService.getOrCreateGroupInviteCode(id, !!regenerate);
  }

  /**
   * 기관 등록 (Admin)
   */
  @Post('organizations')
  @UsePipes(new ZodValidationPipe(createOrganizationSchema))
  @ApiOperation({ summary: '기관 등록 (Admin)' })
  @ApiResponse({ status: 201, description: '기관이 성공적으로 생성됨' })
  async createOrganization(@Body() data: CreateOrganizationDto): Promise<Organization> {
    return this.adminService.createOrganization(data);
  }

  /**
   * 기관 수정 (Admin)
   */
  @Put('organizations/:id')
  @UsePipes(new ZodValidationPipe(updateOrganizationSchema))
  @ApiOperation({ summary: '기관 수정 (Admin)' })
  @ApiResponse({ status: 200, description: '기관 정보가 업데이트됨' })
  async updateOrganization(@Param('id') id: string, @Body() data: UpdateOrganizationDto): Promise<Organization> {
    return this.adminService.updateOrganization(id, data);
  }

  /**
   * 기관 삭제 (Admin)
   */
  @Delete('organizations/:id')
  @ApiOperation({ summary: '기관 삭제 (Admin)' })
  @ApiResponse({ status: 200, description: '기관이 삭제됨' })
  async deleteOrganization(@Param('id') id: string) {
    return this.adminService.deleteOrganization(id);
  }

  /**
   * 대시보드 통계 조회
   */
  @Get('dashboard/stats')
  @ApiOperation({ summary: '대시보드 통계 조회 (Admin)' })
  @ApiResponse({ status: 200, description: '대시보드 통계' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  /**
   * 사용자 활동 통계
   */
  @Get('dashboard/user-activity')
  @ApiOperation({ summary: '사용자 활동 통계 (Admin)' })
  @ApiResponse({ status: 200, description: '사용자 활동 통계' })
  async getUserActivityStats(@Query('userId') userId?: number) {
    return this.adminService.getUserActivityStats(userId);
  }

  /**
   * 인기 콘텐츠 조회
   */
  @Get('dashboard/popular-contents')
  @ApiOperation({ summary: '인기 콘텐츠 조회 (Admin)' })
  @ApiResponse({ status: 200, description: '인기 콘텐츠 목록' })
  async getPopularContents(@Query('limit') limit: number = 10) {
    return this.adminService.getPopularContents(limit);
  }

  /**
   * 일별 통계 조회
   */
  @Get('dashboard/daily-stats')
  @ApiOperation({ summary: '일별 통계 조회 (Admin)' })
  @ApiResponse({ status: 200, description: '일별 통계' })
  async getDailyStats() {
    return this.adminService.getDailyStats();
  }

  /**
   * 사용자 목록 조회 (알림 대상 선택용)
   */
  @Get('users')
  @ApiOperation({ summary: '사용자 목록 조회 (Admin)' })
  @ApiResponse({ status: 200, description: '사용자 목록' })
  async getUsers(
    @Query('keyword') keyword?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getUsers(keyword, page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  /**
   * 알림 발송 (특정 사용자/그룹/전체)
   */
  @Post('notifications')
  @UsePipes(new ZodValidationPipe(sendNotificationSchema))
  @ApiOperation({ summary: '알림 발송 - 특정인/그룹/전체 (Admin)' })
  @ApiResponse({ status: 201, description: '알림 발송 완료' })
  async sendNotification(@Body() data: SendNotificationDto) {
    return this.adminService.sendNotification(data);
  }

  /**
   * 관리자 생성
   */
  @Post('admins')
  @UsePipes(new ZodValidationPipe(createAdminSchema))
  @ApiOperation({ summary: '관리자 생성 (Super Admin 전용)' })
  @ApiResponse({ status: 201, description: '관리자 생성 성공' })
  @ApiResponse({ status: 409, description: '이메일 중복' })
  async createAdmin(@Body() adminData: CreateAdminDto) {
    return this.adminService.createAdmin(adminData);
  }

  /**
   * 관리자 목록 조회
   */
  @Get('admins')
  @ApiOperation({ summary: '관리자 목록 조회 (Admin)' })
  @ApiResponse({ status: 200, description: '관리자 목록' })
  async getAdmins() {
    return this.adminService.getAdminUsers();
  }

  /**
   * 관리자 역할 변경
   */
  @Put('admins/:id/role')
  @ApiOperation({ summary: '관리자 역할 변경 (Super Admin 전용)' })
  @ApiResponse({ status: 200, description: '역할 변경 성공' })
  async updateAdminRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    return this.adminService.updateAdminRole(parseInt(id), role);
  }

  /**
   * 관리자 삭제
   */
  @Delete('admins/:id')
  @ApiOperation({ summary: '관리자 삭제 (Super Admin 전용)' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  async deleteAdmin(@Param('id') id: string) {
    return this.adminService.deleteAdmin(parseInt(id));
  }

  /**
   * 활동 내역 조회 (페이징)
   */
  @Get('activity-logs')
  @ApiOperation({ summary: '관리자 활동 내역 조회' })
  @ApiResponse({ status: 200, description: '활동 내역 목록' })
  async getActivityLogs(
    @Query() query?: { page?: number; limit?: number; action?: string },
  ) {
    return this.adminService.getActivityLogs(query);
  }

  /**
   * 특정 관리자 활동 내역 조회
   */
  @Get('admins/:id/activity-logs')
  @ApiOperation({ summary: '특정 관리자 활동 내역 조회' })
  @ApiResponse({ status: 200, description: '활동 내역 목록' })
  async getAdminActivityLogs(
    @Param('id') adminId: string,
    @Query() query?: { page?: number; limit?: number },
  ) {
    return this.adminService.getAdminActivityLogs(parseInt(adminId), query);
  }

  /**
   * 특정 행동별 활동 내역 조회
   */
  @Get('activity-logs/:action')
  @ApiOperation({ summary: '특정 행동별 활동 내역 조회' })
  @ApiResponse({ status: 200, description: '활동 내역 목록' })
  async getActivityLogsByAction(
    @Param('action') action: string,
    @Query() query?: { page?: number; limit?: number },
  ) {
    return this.adminService.getActivityLogsByAction(action, query);
  }

  /**
   * 활동 내역 통계 (최신 N 개)
   */
  @Get('activity-stats')
  @ApiOperation({ summary: '활동 내역 통계를 조회' })
  @ApiResponse({ status: 200, description: '활동 내역 통계' })
  async getActivityStats(@Query() query?: { limit?: number }) {
    return this.adminService.getActivityStats(query?.limit ?? 10);
  }

  /**
   * 검수 요청 조회 (REVIEWER)
   */
  @Get('reviews')
  @ApiOperation({ summary: '검수 요청 목록 조회' })
  @ApiResponse({ status: 200, description: '검수 요청 목록' })
  async getReviewRequests(@Query() query?: { page?: number; limit?: number; status?: string }) {
    return this.adminService.getReviewRequests(query);
  }

  /**
   * 검수 요청 상세 조회
   */
  @Get('reviews/:targetType/:targetId')
  @ApiOperation({ summary: '검수 요청 대상 상세 조회' })
  @ApiResponse({ status: 200, description: '검수 대상 상세 정보' })
  async getReviewTargetDetails(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.adminService.getReviewTargetDetails(targetType, parseInt(targetId));
  }

  /**
   * 검수 승인 처리
   */
  @Post('reviews/:targetType/:targetId/approve')
  @ApiOperation({ summary: '검수 요청 승인' })
  @ApiResponse({ status: 201, description: '승인 완료' })
  async approveReview(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Body() body: { reviewerName: string; reviewerEmail: string; comment: string },
  ) {
    return this.adminService.approveReview(targetType, parseInt(targetId), body.reviewerName, body.reviewerEmail, body.comment);
  }

  /**
   * 검수 거절 처리
   */
  @Post('reviews/:targetType/:targetId/reject')
  @ApiOperation({ summary: '검수 요청 거절' })
  @ApiResponse({ status: 201, description: '거절 완료' })
  async rejectReview(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Body() body: { reviewerName: string; reviewerEmail: string; comment: string },
  ) {
    return this.adminService.rejectReview(targetType, parseInt(targetId), body.reviewerName, body.reviewerEmail, body.comment);
  }

  /**
   * REVIEWER 권한 부여
   */
  @Post('users/:userId/reviewer')
  @ApiOperation({ summary: '사용자에게 REVIEWER 권한 부여' })
  @ApiResponse({ status: 200, description: '권한 부여 완료' })
  async makeReviewer(@Param('userId') userId: string) {
    return this.adminService.makeReviewer(parseInt(userId));
  }

  /**
   * REVIEWER 권한 해제
   */
  @Delete('users/:userId/reviewer')
  @ApiOperation({ summary: 'REVIEWER 권한 해제' })
  @ApiResponse({ status: 200, description: '권한 해제 완료' })
  async revokeReviewer(@Param('userId') userId: string) {
    return this.adminService.revokeReviewer(parseInt(userId));
  }

  /**
   * 콘텐츠 승인 처리
   */
  @Post('content/:id/approve')
  @ApiOperation({ summary: '콘텐츠 승인' })
  @ApiResponse({ status: 200, description: '승인 완료' })
  async approveContent(
    @Param('id') contentId: string,
    @Body() body: { reviewerName: string; reviewerEmail: string; comment?: string },
  ) {
    return this.adminService.approveContent(parseInt(contentId), body.reviewerName, body.reviewerEmail, body.comment);
  }

  /**
   * 콘텐츠 거절 처리
   */
  @Post('content/:id/reject')
  @ApiOperation({ summary: '콘텐츠 거절' })
  @ApiResponse({ status: 200, description: '거절 완료' })
  async rejectContent(
    @Param('id') contentId: string,
    @Body() body: { reviewerName: string; reviewerEmail: string; comment?: string },
  ) {
    return this.adminService.rejectContent(parseInt(contentId), body.reviewerName, body.reviewerEmail, body.comment);
  }

}

interface Notice {
  id?: string;
  title: string;
  content: string;
  scope: 'public' | 'private';
  organizationId?: string;
  isPinned?: boolean;
}