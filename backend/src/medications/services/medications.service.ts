import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Medication } from '../entities/medication.entity';
import { MedicationReminderLog } from '../entities/medication-reminder-log.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import type { CreateMedicationDto, UpdateMedicationDto } from '../dto/medication.dto';

const MED_NOTIFICATION_TITLES = ['약 복용 알림', '병원 예약 알림'];
const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 서버 TZ(Koyeb=UTC)와 무관하게 한국 시간 기준 날짜 문자열
const kstToday = (): string => {
  const kst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  const d = String(kst.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseTimes = (reminderTimes: string | null): string[] =>
  (reminderTimes || '')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => TIME_RE.test(t));

@Injectable()
export class MedicationsService {
  constructor(
    @InjectRepository(Medication)
    private readonly medicationRepo: Repository<Medication>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(MedicationReminderLog)
    private readonly logRepo: Repository<MedicationReminderLog>,
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

  /**
   * 특정 날짜의 복용 예정 목록 + 복용 완료 여부.
   * date 미지정 시 한국 시간 기준 오늘.
   */
  async getDoses(userId: number, date?: string) {
    const day = date && DATE_RE.test(date) ? date : kstToday();
    const meds = await this.medicationRepo.find({
      where: { userId, isActive: true },
      order: { createdAt: 'ASC' },
    });

    const candidates = meds.filter((m) => {
      if (!parseTimes(m.reminderTimes).length) return false;
      if (m.startDate && day < m.startDate) return false;
      if (m.endDate && day > m.endDate) return false;
      return true;
    });
    if (!candidates.length) return { date: day, items: [] };

    const logs = await this.logRepo.find({
      where: {
        medicationId: In(candidates.map((m) => Number(m.id))),
        kind: 'taken',
      },
    });
    const takenMap = new Map<string, Set<string>>();
    for (const log of logs) {
      const [d, t] = log.refKey.split('|');
      if (d !== day) continue;
      const key = String(log.medicationId);
      if (!takenMap.has(key)) takenMap.set(key, new Set());
      takenMap.get(key)!.add(t);
    }

    return {
      date: day,
      items: candidates.map((m) => {
        const taken = takenMap.get(String(m.id)) || new Set<string>();
        return {
          id: Number(m.id),
          name: m.name,
          subjectName: m.subjectName,
          subjectRelation: m.subjectRelation,
          times: parseTimes(m.reminderTimes).map((time) => ({
            time,
            taken: taken.has(time),
          })),
        };
      }),
    };
  }

  /** 복용 완료/해제 토글. time은 해당 약의 reminderTimes에 등록된 값이어야 함 */
  async setDoseTaken(
    userId: number,
    id: number,
    time: string,
    date: string | undefined,
    taken: boolean,
  ): Promise<{ ok: boolean; time: string; taken: boolean }> {
    const med = await this.findOne(id, userId);
    if (!TIME_RE.test(time) || !parseTimes(med.reminderTimes).includes(time)) {
      throw new BadRequestException('등록되지 않은 복용 시간입니다.');
    }
    const day = date && DATE_RE.test(date) ? date : kstToday();
    const refKey = `${day}|${time}`;
    const medicationId = Number(med.id);

    if (taken) {
      const exists = await this.logRepo.exists({
        where: { medicationId, kind: 'taken', refKey },
      });
      if (!exists) {
        try {
          await this.logRepo.save(
            this.logRepo.create({ medicationId, kind: 'taken', refKey }),
          );
        } catch {
          // unique 충돌(동시 탭) — 이미 기록된 것으로 간주
        }
      }
    } else {
      await this.logRepo.delete({ medicationId, kind: 'taken', refKey });
    }
    return { ok: true, time, taken };
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
