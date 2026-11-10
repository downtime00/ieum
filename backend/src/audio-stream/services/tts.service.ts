import { Injectable, Logger } from '@nestjs/common';

/**
 * 텍스트 음성 변환 (TTS) 서비스 - 명료한 발음 최적화
 */
@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.NOW_API_KEY || '';
    this.apiUrl = process.env.NOW_API_URL || 'https://api.naver.com';
  }

  /**
   * 텍스트 음성 변환 - 청각장애인 최적화 (명료한 발음)
   */
  async convertTextToSpeech(
    text: string,
    options?: {
      volume?: number; // 볼륨 (0-1)
      pitch?: number; // 음높이 (-1~1)
      speed?: number; // 속도 (0.5~2)
      speaker?: string; // 목소리 ID
    },
  ): Promise<{ message: string; audioUrl?: string }> {
    try {
      const formattedText = this.preprocessForClearPronunciation(text);

      // 실제 구현: NAVER TTS API 또는 Azure Speech Service 호출
      const response = await fetch(`${this.apiUrl}/tts/voice`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: formattedText, speaker: options?.speaker || 'SSG001.5' }),
      });

      const data = await response.json();

      if (!response.ok || !data.audio_url) {
        throw new Error('TTS API 응답 형식 오류');
      }

      return {
        message: '음성 변환 완료',
        audioUrl: data.audio_url,
      };
    } catch (error) {
      this.logger.error(`음성 변환 실패: ${error.message}`, error.stack);
      throw new Error('음성 변환에 실패했습니다.');
    }
  }

  /**
   * 텍스트를 명료한 발음을 위해 전처리
   */
  private preprocessForClearPronunciation(text: string): string {
    // 1. 띄어쓰기 최적화 (명료한 단어 구분)
    const spaced = text.replace(/\s+/g, ' ').trim();

    // 2. 숫자와 한글 혼용 시 명확한 표기
    let processed = spaced;

    return processed;
  }

  /**
   * 청각장애인 맞춤형 음성 설정 (명료한 발음)
   */
  getClearPronunciationSettings(): {
    volume: number;
    pitch: number;
    speed: number;
  } {
    return {
      volume: 0.9, // 높은 볼륨
      pitch: -0.1, // 약간 낮은 음높이 (명료한 발음)
      speed: 1.0, // 중간 속도
    };
  }

  /**
   * 대본 기반 반복 재생 (연습용)
   */
  async repeatAudio(script: string, repeats: number = 3): Promise<void> {
    for (let i = 0; i < repeats; i++) {
      await this.convertTextToSpeech(script);
    }
  }
}