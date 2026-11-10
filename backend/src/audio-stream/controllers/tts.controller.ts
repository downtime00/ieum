import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { HearingImpairedSupportService } from '../services/hearing-impaired-support.service';

/**
 * TTS 컨트롤러 (청각장애인 지원)
 */
@Controller('tts')
export class TtsController {
  constructor(private readonly supportService: HearingImpairedSupportService) {}

  @Get()
  async convertTextToSpeech(@Body('text') text: string): Promise<{ status: string }> {
    return await this.supportService.streamCaptions(text);
  }

  @Post('/emergency/:message')
  async sendEmergencyAlert(
    @Param('message') message: string,
  ): Promise<{ status: string }> {
    await this.supportService.sendEmergencyAlert(message);
    return { status: '긴급 알림 발송됨' };
  }

  @Post('/community/:message')
  async broadcastCommunityMessage(
    @Param('message') message: string,
  ): Promise<{ status: string }> {
    await this.supportService.broadcastCommunityMessage(message);
    return { status: '커뮤니티 메시지 발송됨' };
  }

  @Get('/status')
  async getStatus() {
    const status = this.supportService.getCurrentStatus();
    return status;
  }
}