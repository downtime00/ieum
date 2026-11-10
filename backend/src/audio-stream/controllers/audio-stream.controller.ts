import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AudioPlayerRepository } from '../repositories/audio-player.repository';
import { AudioPlayer } from '../entities/audio-player.entity';
import { SpeechRecognitionService } from '../services/speech-recognition.service';
import { HearingImpairedSupportService } from '../services/hearing-impaired-support.service';

/**
 * 오디오 스트리밍 컨트롤러 (오디오 처리용)
 */
@Controller('audio-stream')
export class AudioStreamController {
  constructor(
    private readonly audioPlayerRepository: AudioPlayerRepository,
    private readonly speechRecognitionService: SpeechRecognitionService,
    private readonly hearingImpairedSupportService: HearingImpairedSupportService,
  ) {}

  @Get(':id/stream')
  @ApiOperation({ summary: '오디오 스트리밍 제공' })
  async streamAudio(@Param('id') id: string): Promise<{ message: string }> {
    const audioPlayer = await this.audioPlayerRepository.findById(id);
    if (!audioPlayer || !audioPlayer.isPlaying) {
      throw new Error('파일을 찾을 수 없습니다.');
    }

    return { message: '스트리밍 연결됨' };
  }

  @Post('/upload')
  @ApiOperation({ summary: '오디오 파일 업로드 및 생성' })
  async uploadAudio(@Body() dto: { name: string; size: number }): Promise<AudioPlayer> {
    return this.audioPlayerRepository.create({
      name: dto.name,
      size: dto.size,
    });
  }

  @Get('/play/:id')
  @ApiOperation({ summary: '플레이어 재생 제어' })
  async playAudio(@Param('id') id: string) {
    const audioPlayer = await this.audioPlayerRepository.togglePlay(id);
    return audioPlayer;
  }

  /**
   * 텍스트 음성 변환 (TTS) - 청각장애인 지원용
   */
  @Get('/tts')
  @ApiOperation({ summary: '텍스트 → 자막 변환 (TTS)' })
  async convertToSpeech(@Body('text') text: string): Promise<{ status: string }> {
    try {
      return await this.hearingImpairedSupportService.streamCaptions(text);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      throw new Error(errorMessage || '자막 생성에 실패했습니다.');
    }
  }

  /**
   * 음성 인식 (ASR) - 음성 파일 → 텍스트
   */
  @Post('/recognize')
  @ApiOperation({ summary: '음성 인식 (텍스트 변환)' })
  async recognizeSpeech(@Body('audioUrl') audioUrl: string): Promise<{ text: string; confidence: number }> {
    try {
      const result = await this.speechRecognitionService.recognizeSpeech(audioUrl);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      throw new Error(errorMessage || '음성 인식이 실패했습니다.');
    }
  }

  /**
   * 음성 스트리밍 인식
   */
  @Post('/recognize-stream')
  @ApiOperation({ summary: '실시간 음성 스트리밍 인식' })
  async streamRecognize(@Body('audioStreamUrl') audioStreamUrl: string): Promise<string> {
    try {
      const result = await this.speechRecognitionService.streamRecognition(audioStreamUrl);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      throw new Error(errorMessage || '실시간 인식이 실패했습니다.');
    }
  }
}