import { Controller, Get, Param, Delete, Put, Body } from '@nestjs/common';
import { EventParticipationService } from '../services/event-participation.service';

/**
 * 이벤트 등록 및 관리 컨트롤러
 */
@Controller('admin/events')
export class AdminEventController {
  constructor(private readonly participationService: EventParticipationService) {}

  @Get()
  async getEvents() {
    return this.participationService.findAll();
  }

  @Get(':id')
  async getEventById(@Param('id') id: number) {
    return this.participationService.findOne(id);
  }

  @Delete(':id')
  async deleteEvent(@Param('id') id: number) {
    await this.participationService.remove(id);
    return { message: '이벤트가 삭제되었습니다.' };
  }

  @Put(':id/participants/:participantId')
  async registerParticipant(
    @Param('id') eventId: number,
    @Param('participantId') participantId: number,
    @Body() dto: any,
  ) {
    return this.participationService.create({
      userId: participantId,
      contentId: eventId,
      ...dto,
    });
  }

  @Delete(':id/participants/:participantId')
  async unregisterParticipant(
    @Param('id') eventId: number,
    @Param('participantId') participantId: number,
  ) {
    return this.participationService.remove(eventId);
  }

  // 실제 이벤트 CRUD 는 admin.service.ts 를 통해 처리됩니다.
}