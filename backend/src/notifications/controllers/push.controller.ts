import { Controller, Get, Post, Delete, Body, UsePipes } from '@nestjs/common';
import { z } from 'zod';
import { PushService, BrowserPushSubscription } from '../services/push.service';
import { ZodValidationPipe } from '../../common/validation/zod.validation.pipe';

const subscribePushSchema = z.object({
  userId: z.number().int().positive().optional(),
  deviceUuid: z.string().max(255).optional(),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});

const unsubscribePushSchema = z.object({
  endpoint: z.string().url(),
});

type SubscribePushDto = z.infer<typeof subscribePushSchema>;
type UnsubscribePushDto = z.infer<typeof unsubscribePushSchema>;

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('vapid-key')
  getVapidKey(): { publicKey: string | null } {
    return { publicKey: this.pushService.getPublicKey() };
  }

  @Post('subscribe')
  @UsePipes(new ZodValidationPipe(subscribePushSchema))
  async subscribe(@Body() body: SubscribePushDto) {
    const sub = body.subscription as BrowserPushSubscription;
    await this.pushService.subscribe(body.userId ?? null, sub, body.deviceUuid);
    return { success: true };
  }

  @Delete('subscribe')
  @UsePipes(new ZodValidationPipe(unsubscribePushSchema))
  async unsubscribe(@Body() body: UnsubscribePushDto) {
    await this.pushService.unsubscribe(body.endpoint);
    return { success: true };
  }
}
