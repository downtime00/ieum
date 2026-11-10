import { Controller, Get, Post, Put, Delete, Body, Param, Query, UsePipes, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventParticipationService } from '../services/event-participation.service';
import { EventParticipation } from '../entities/event-participation.entity';
import { ZodValidationPipe } from '../../common/validation/zod.validation.pipe';
import { createEventParticipationSchema, type CreateEventParticipationDto } from '../dto/create-event-participation.dto';
import { updateEventParticipationSchema, type UpdateEventParticipationDto } from '../dto/update-event-participation.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Events')
@Controller('events/participation')
@UseGuards(JwtAuthGuard)
export class EventParticipationController {
  constructor(private readonly participationService: EventParticipationService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createEventParticipationSchema))
  @ApiOperation({ summary: '이벤트 참여 신청' })
  @ApiResponse({ status: 201, description: '이벤트 참여 신청 성공' })
  @ApiResponse({ status: 400, description: '이미 참여한 이벤트' })
  async create(@Body() dto: CreateEventParticipationDto): Promise<EventParticipation> {
    return this.participationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '이벤트 참여 목록 조회' })
  @ApiResponse({ status: 200, description: '참여 목록' })
  async findAll(
    @Query('userId') userId?: number,
    @Query('contentId') contentId?: number,
  ): Promise<EventParticipation[]> {
    return this.participationService.findAll(userId, contentId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '사용자별 이벤트 참여 목록' })
  @ApiResponse({ status: 200, description: '사용자 참여 목록' })
  async getUserParticipations(@Param('userId') userId: number): Promise<EventParticipation[]> {
    return this.participationService.getUserParticipations(userId);
  }

  @Get('content/:contentId')
  @ApiOperation({ summary: '콘텐츠별 이벤트 참여 목록' })
  @ApiResponse({ status: 200, description: '콘텐츠 참여 목록' })
  async getContentParticipations(@Param('contentId') contentId: number): Promise<EventParticipation[]> {
    return this.participationService.getContentParticipations(contentId);
  }

  @Get('content/:contentId/count')
  @ApiOperation({ summary: '콘텐츠별 참여자 수' })
  @ApiResponse({ status: 200, description: '참여자 수' })
  async getParticipationCount(@Param('contentId') contentId: number): Promise<{ count: number }> {
    const count = await this.participationService.getParticipationCount(contentId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: '이벤트 참여 상세 조회' })
  @ApiResponse({ status: 200, description: '참여 상세 정보' })
  @ApiResponse({ status: 404, description: '참여 정보 없음' })
  async findOne(@Param('id') id: number): Promise<EventParticipation> {
    return this.participationService.findOne(id);
  }

  @Put(':id')
  @UsePipes(new ZodValidationPipe(updateEventParticipationSchema))
  @ApiOperation({ summary: '이벤트 참여 정보 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateEventParticipationDto,
  ): Promise<EventParticipation> {
    return this.participationService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '이벤트 참여 취소' })
  @ApiResponse({ status: 200, description: '취소 성공' })
  async cancel(@Param('id') id: number): Promise<EventParticipation> {
    return this.participationService.cancel(id);
  }
}
