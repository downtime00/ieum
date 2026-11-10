import { Injectable, Logger } from '@nestjs/common';

/**
 * 음성 인식 (ASR) 서비스 - Naver Speech SDK 를 통한 음성 파일 → 텍스트 변환
 */
@Injectable()
export class SpeechRecognitionService {
  private readonly logger = new Logger(SpeechRecognitionService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor() {
    this.apiKey = process.env.NOW_API_KEY || '';
    this.apiUrl = process.env.NOW_API_URL || 'https://api.naver.com';
  }

  /**
   * 음성 파일을 텍스트로 변환 (ASR API)
   */
  async recognizeSpeech(
    audioUrl: string,
  ): Promise<{ text: string; confidence: number }> {
    try {
      // NAVER ASR API 호출 (실제 구현 시 Naver Cloud API 사용)
      const response = await this.callNaverASRAPI(audioUrl);
      const data = await response.json();

      if (!data || !data.text) {
        throw new Error('음성 인식 API 응답 형식 오류');
      }

      return {
        text: data.text,
        confidence: data.confidence || 1.0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`음성 인식 실패: ${errorMessage}`, errorStack);
      throw new Error('음성 인식이 실패했습니다.');
    }
  }

  /**
   * 실시간 음성 스트리밍 인식
   */
  async streamRecognition(audioStreamUrl: string): Promise<string> {
    try {
      const response = await this.callNaverASRAPI(audioStreamUrl, 'stream');
      const data = await response.json();

      if (!data || !data.text) {
        throw new Error('실시간 음성 인식 API 응답 형식 오류');
      }

      return data.text;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`실시간 음성 인식 실패: ${errorMessage}`, errorStack);
      throw new Error('실시간 음성 인식이 실패했습니다.');
    }
  }

  /**
   * NAVER ASR API 호출 (구체적인 구현은 Naver Cloud API SDK 사용 권장)
   */
  private async callNaverASRAPI(
    url: string,
    mode: 'file' | 'stream' = 'file',
  ) {
    return this.apiKey
      ? fetch(`${this.apiUrl}/speech/api/asr`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, result_format: 'RESULT_TEXT' }),
        })
      : Promise.reject(new Error('API 키 없음'));
  }
}