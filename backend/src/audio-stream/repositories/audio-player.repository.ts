import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AudioPlayer } from '../entities/audio-player.entity';
import { CreateAudioPlayerDto } from '../dto/create-audio-player.dto';
import { UpdateAudioPlayerDto } from '../dto/update-audio-player.dto';

/**
 * 오디오 플레이어 Repository (TypeORM)
 */
@Injectable()
export class AudioPlayerRepository {
  constructor(
    @InjectRepository(AudioPlayer)
    private readonly audioPlayerRepository: Repository<AudioPlayer>,
  ) {}

  /**
   * Audio Player 정보 생성
   */
  async create(audioDto: CreateAudioPlayerDto): Promise<AudioPlayer> {
    return this.audioPlayerRepository.save(audioDto);
  }

  /**
   * Audio Player 정보 업데이트
   */
  async update(id: string, audioDto: UpdateAudioPlayerDto): Promise<AudioPlayer> {
    const existing = await this.audioPlayerRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Audio Player #${id} 을 (를) 찾을 수 없습니다.`);
    }

    Object.assign(existing, audioDto);
    return this.audioPlayerRepository.save(existing);
  }

  /**
   * Audio Player 상세 조회
   */
  async findById(id: string): Promise<AudioPlayer | null> {
    return this.audioPlayerRepository.findOne({ where: { id } });
  }

  /**
   * Audio Player 목록 조회
   */
  async findAll(limit = 50, offset = 0) {
    const [items, total] = await this.audioPlayerRepository.findAndCount({
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { items, total };
  }

  /**
   * Audio Player 삭제
   */
  async delete(id: string): Promise<void> {
    const existing = await this.audioPlayerRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Audio Player #${id} 을 (를) 찾을 수 없습니다.`);
    }

    await this.audioPlayerRepository.remove(existing);
  }

  /**
   * 플레이어 재생 상태 업데이트
   */
  async togglePlay(id: string): Promise<AudioPlayer> {
    const existing = await this.audioPlayerRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Audio Player #${id} 을 (를) 찾을 수 없습니다.`);
    }

    existing.isPlaying = !existing.isPlaying;
    return this.audioPlayerRepository.save(existing);
  }
}