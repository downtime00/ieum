import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TtsController } from './controllers/tts.controller';
import { AudioStreamController } from './controllers/audio-stream.controller';
import { HearingImpairedSupportService } from './services/hearing-impaired-support.service';
import { AudioPlayerRepository } from './repositories/audio-player.repository';
import { AudioPlayerService } from './services/audio-player.service';
import { TtsService } from './services/tts.service';
import { SpeechRecognitionService } from './services/speech-recognition.service';
import { AudioPlayer } from './entities/audio-player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AudioPlayer])],
  controllers: [TtsController, AudioStreamController],
  providers: [
    HearingImpairedSupportService,
    AudioPlayerRepository,
    AudioPlayerService,
    TtsService,
    SpeechRecognitionService,
  ],
  exports: [
    HearingImpairedSupportService,
    AudioPlayerRepository,
    AudioPlayerService,
    TtsService,
    SpeechRecognitionService,
  ],
})
export class AudioStreamModule {}