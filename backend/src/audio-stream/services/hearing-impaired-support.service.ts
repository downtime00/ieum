import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

/**
 * 청각장애인 지원 서비스 - 실시간 자막, 명확한 발음 TTS
 */
@Injectable()
export class HearingImpairedSupportService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HearingImpairedSupportService.name);
  private isRunning: boolean = false;
  private subscribers: Set<Function> = new Set();

  onModuleInit() {
    this.logger.log('청각장애인 지원 모듈이 시작되었습니다.');
  }

  onModuleDestroy() {
    this.isRunning = false;
    this.logger.log('청각장애인 지원 모듈이 종료되었습니다.');
  }

  /**
   * 실시간 자막 스트리밍 - TTS 결과 즉시 전달
   */
  async streamCaptions(text: string): Promise<{ status: string }> {
    try {
      await this.generateCaption(text);
      return { status: '자막 스트리밍 완료' };
    } catch (error) {
      this.logger.error(`자막 생성 실패: ${error.message}`);
      throw new Error('자막 스트리밍에 실패했습니다.');
    }
  }

  /**
   * 캡션 생성 및 전달
   */
  private async generateCaption(text: string): Promise<void> {
    const captionData = JSON.stringify({
      text: this.formatTextForCaptions(text),
      timestamp: Date.now(),
      type: 'standard',
      isEmergency: false,
    });

    // 구독자들에게 전달
    this.subscribers.forEach((subscriber) => {
      try {
        subscriber(captionData);
      } catch (error) {
        this.logger.error('구독자 에러:', error);
      }
    });
  }

  /**
   * 텍스트를 읽기 쉬운 자막 형식으로 변환 (한글 표기, 발음 명료화)
   */
  private formatTextForCaptions(text: string): string {
    // 1. 특수문자 제거 (클린한 자막)
    const cleanText = text.replace(/[^\uAC00-\uD7A3\s]/g, '');

    // 2. 한글 단어 구분 (발음 명료화를 위한 공백 추가)
    const words = cleanText
      .replace(/([ㄱ-ㅎ])([ㅂ-힣])/g, ' $2') // 모음 앞 받침에 공백
      .replace(/([ㄴㄷ][ㄹ])/g, '$1 $2') // '나를', '들어가' 등 합성어 분리
      .replace(/\s+/g, ' ') // 중복 공백 제거
      .trim();

    return words;
  }

  /**
   * 구독자에게 이벤트 전달
   */
  subscribe(callback: Function): void {
    this.subscribers.add(callback);
    this.logger.log(`구독자 등록됨 (총 ${this.subscribers.size} 개)`);
  }

  unsubscribe(callback: Function): void {
    this.subscribers.delete(callback);
  }

  /**
   * 긴급 메시지 발송 (비상 상황 알림)
   */
  async sendEmergencyAlert(text: string): Promise<void> {
    const emergencyCaption = JSON.stringify({
      text: this.formatTextForCaptions(text),
      timestamp: Date.now(),
      type: 'emergency', // 비상 알림
      isEmergency: true,
      priority: 'high',
    });

    this.subscribers.forEach((subscriber) => {
      try {
        subscriber(emergencyCaption);
      } catch (error) {
        this.logger.error('긴급 알림 전송 실패:', error);
      }
    });
  }

  /**
   * 커뮤니티 메시지 지원 (다른 이용자로부터의 도움 요청/제공)
   */
  async broadcastCommunityMessage(message: string): Promise<void> {
    const communityCaption = JSON.stringify({
      text: this.formatTextForCaptions(message),
      timestamp: Date.now(),
      type: 'community', // 커뮤니티 메시지
    });

    this.subscribers.forEach((subscriber) => {
      try {
        subscriber(communityCaption);
      } catch (error) {
        this.logger.error('커뮤니티 메시지 전송 실패:', error);
      }
    });
  }

  /**
   * 현재 자막 상태 확인
   */
  getCurrentStatus(): { isRunning: boolean; subscriberCount: number } {
    return {
      isRunning: this.isRunning,
      subscriberCount: this.subscribers.size,
    };
  }
}