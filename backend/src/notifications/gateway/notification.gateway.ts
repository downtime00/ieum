import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService, NotificationType } from '../services/notification.service';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly notificationService: NotificationService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_all')
  async handleSubscribeAll(client: Socket, payload: { userId: string }): Promise<void> {
    const room = `user_${payload.userId}`;
    await client.join(room);
    console.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('unsubscribe_all')
  async handleUnsubscribeAll(client: Socket, payload: { userId: string }): Promise<void> {
    const room = `user_${payload.userId}`;
    await client.leave(room);
    console.log(`Client ${client.id} left room ${room}`);
  }

  /**
   * 특정 사용자에게 푸시 알림 전송
   */
  async sendNotificationToUser(userId: string, notification: any): Promise<void> {
    const room = `user_${userId}`;
    this.server.to(room).emit('notification', notification);
  }

  /**
   * 여러 사용자에게 푸시 알림 전송
   */
  async sendNotificationToMultipleUsers(userIds: string[], notification: any): Promise<void> {
    const rooms = userIds.map(userId => `user_${userId}`);
    this.server.to(rooms).emit('notification', notification);
  }

  /**
   * 전체 브로드캐스트
   */
  async broadcastNotification(notification: any): Promise<void> {
    this.server.emit('notification', notification);
  }
}
