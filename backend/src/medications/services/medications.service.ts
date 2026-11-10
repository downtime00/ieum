import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Medication } from '../entities/medication.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import type { CreateMedicationDto, UpdateMedicationDto } from '../dto/medication.dto';

const MED_NOTIFICATION_TITLES = ['약 복용 알림', '병원 예약 알림'];

@Injectable()
export class MedicationsService {
  constructor(
    @InjectRepository(Medication)
    private readonly medicationRepo: Repository<Medication>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  findByUser(userId: number, includeInactive = false): Promise<Medication[]> {
    return this.medicationRepo.find({
      where: includeInactive ? { userId } : { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Medication> {
    const med = await this.medicationRepo.findOne({
      where: { id: String(id) as any, userId },
    });
    if (!med) throw new NotFoundException('복약/메모를 찾을 수 없습니다.');
    return med;
  }

  create(data: CreateMedicationDto): Promise<Medication> {
    return this.medicationRepo.save(this.medicationRepo.create(data));
  }

  async update(id: number, userId: number, data: UpdateMedicationDto): Promise<Medication> {
    const med = await this.findOne(id, userId);
    Object.assign(med, data);
    const saved = await this.medicationRepo.save(med);
    if (data.isActive === false) await this.clearMedNotifications(saved);
    return saved;
  }

  async remove(id: number, userId: number): Promise<void> {
    const med = await this.findOne(id, userId);
    await this.medicationRepo.remove(med);
    await this.clearMedNotifications(med);
  }

  /** 약 삭제/비활성화 시 해당 약의 복용·예약 알림도 함께 삭제 */
  private async clearMedNotifications(med: Medication): Promise<void> {
    try {
      const candidates = await this.notificationRepo.find({
        where: {
          userId: Number(med.userId),
          title: In(MED_NOTIFICATION_TITLES),
        },
      });
      const medKey = `"medicationId":${Number(med.id)}`;
      const name = med.name?.trim() || '';
      const doomed = candidates.filter(
        (n) =>
          (n.payload || '').includes(medKey) ||
          (name.length >= 2 && (n.body || '').includes(name)),
      );
      if (doomed.length) await this.notificationRepo.remove(doomed);
    } catch {
      /* 알림 정리 실패해도 약 삭제는 유지 */
    }
  }
}
