import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventParticipation, ParticipationStatus } from '../entities/event-participation.entity';
import { Content } from '../../contents/entities/content.entity';
import type { CreateEventParticipationDto } from '../dto/create-event-participation.dto';
import type { UpdateEventParticipationDto } from '../dto/update-event-participation.dto';

@Injectable()
export class EventParticipationService {
  constructor(
    @InjectRepository(EventParticipation)
    private readonly participationRepository: Repository<EventParticipation>,
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  async create(dto: CreateEventParticipationDto): Promise<EventParticipation> {
    // 콘텐츠 존재 확인
    const content = await this.contentRepository.findOne({
      where: { id: dto.contentId },
    });

    if (!content) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    }

    // 이미 참여한 이벤트인지 확인
    const existing = await this.participationRepository.findOne({
      where: {
        userId: dto.userId,
        contentId: dto.contentId,
        status: ParticipationStatus.REGISTERED,
      },
    });

    if (existing) {
      throw new BadRequestException('이미 이 이벤트에 참여 신청했습니다.');
    }

    const participation = this.participationRepository.create(dto);
    return this.participationRepository.save(participation);
  }

  async findAll(userId?: number, contentId?: number): Promise<EventParticipation[]> {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (contentId) {
      where.contentId = contentId;
    }

    return this.participationRepository.find({
      where,
      relations: ['user', 'content'],
      order: { registeredAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<EventParticipation> {
    const participation = await this.participationRepository.findOne({
      where: { id },
      relations: ['user', 'content'],
    });

    if (!participation) {
      throw new NotFoundException('참여 정보를 찾을 수 없습니다.');
    }

    return participation;
  }

  async update(id: number, dto: UpdateEventParticipationDto): Promise<EventParticipation> {
    const participation = await this.findOne(id);

    Object.assign(participation, dto);
    return this.participationRepository.save(participation);
  }

  async cancel(id: number): Promise<EventParticipation> {
    const participation = await this.findOne(id);

    participation.status = ParticipationStatus.CANCELLED;
    return this.participationRepository.save(participation);
  }

  async getParticipationCount(contentId: number): Promise<number> {
    return this.participationRepository.count({
      where: {
        contentId,
        status: ParticipationStatus.REGISTERED,
      },
    });
  }

  async getUserParticipations(userId: number): Promise<EventParticipation[]> {
    return this.findAll(userId);
  }

  async getContentParticipations(contentId: number): Promise<EventParticipation[]> {
    return this.findAll(undefined, contentId);
  }

  async remove(id: number): Promise<void> {
    const participation = await this.findOne(id);
    await this.participationRepository.remove(participation);
  }
}
