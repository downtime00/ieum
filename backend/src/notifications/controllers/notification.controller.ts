import { Controller, Get, Post, Body, Param, Delete, Query, UsePipes, Header } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { Notification } from '../entities/notification.entity';
import { ZodValidationPipe } from '../../common/validation/zod.validation.pipe';
import { createNotificationSchema } from '../schemas/notification.schema';
import { bulkNotificationSchema } from '../dto/bulk-notification.dto';
import type { CreateNotificationDto } from '../schemas/notification.schema';
import type { BulkNotificationDto } from '../dto/bulk-notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createNotificationSchema))
  async create(@Body() notificationData: CreateNotificationDto): Promise<Notification> {
    return this.notificationService.create(
      notificationData.userId,
      notificationData.title,
      notificationData.body,
      notificationData.type,
      notificationData.payload,
    );
  }

  @Post('bulk')
  @UsePipes(new ZodValidationPipe(bulkNotificationSchema))
  async sendToMultipleUsers(@Body() data: BulkNotificationDto): Promise<Notification[]> {
    return this.notificationService.sendToMultipleUsers(
      data.userIds,
      data.title,
      data.body,
      data.type,
      data.payload,
    );
  }

  @Get('user/:userId')
  @Header('Cache-Control', 'no-store')
  async findByUser(
    @Param('userId') userId: number,
    @Query('limit') limit?: string,
  ): Promise<Notification[]> {
    const parsed = limit ? parseInt(limit, 10) : undefined;
    return this.notificationService.getUserNotifications(
      userId,
      parsed && parsed > 0 ? Math.min(parsed, 50) : undefined,
    );
  }

  @Get('user/:userId/unread')
  @Header('Cache-Control', 'no-store')
  async getUnread(@Param('userId') userId: number): Promise<Notification[]> {
    return this.notificationService.getUnreadNotifications(userId);
  }

  @Get('user/:userId/count')
  @Header('Cache-Control', 'no-store')
  async getCount(@Param('userId') userId: number): Promise<{ count: number }> {
    const count = await this.notificationService.getUserNotificationCount(userId);
    return { count };
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: number): Promise<void> {
    await this.notificationService.markNotificationAsRead(id);
  }

  @Delete('user/:userId')
  async clearAll(@Param('userId') userId: number): Promise<void> {
    await this.notificationService.clearAll(userId);
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: number, @Query('userId') userId: number): Promise<void> {
    await this.notificationService.deleteNotification(id, userId);
  }
}
