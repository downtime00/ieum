import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medication } from '../entities/medication.entity';
import { MedicationReminderLog } from '../entities/medication-reminder-log.entity';
import { NotificationService } from '../../notifications/services/notification.service';

const DOSE_LEAD_MINUTES = 30;
// 예약 알림 발송 시점(일)과 문구
const APPOINTMENT_STAGES = [
  { days: 7, label: '7일 전' },
  { days: 3, label: '3일 전' },
  { days: 1, label: '하루 전' },
  { days: 0, label: '오늘' },
];

@Injectable()
export class MedicationReminderScheduler {
  private readonly logger = new Logger(MedicationReminderScheduler.name);

  constructor(
    @InjectRepository(Medication)
    private readonly medicationRepo: Repository<Medication>,
    @InjectRepository(MedicationReminderLog)
    private readonly logRepo: Repository<MedicationReminderLog>,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleReminders() {
    try {
      const medications = await this.medicationRepo.find({ where: { isActive: true } });
      const now = new Date();
      for (const med of medications) {
        await this.checkDoseReminders(med, now).catch((e) =>
          this.logger.warn(`복용 알림 실패 (medication ${med.id}): ${e?.message || e}`),
        );
        await this.checkAppointmentReminders(med, now).catch((e) =>
          this.logger.warn(`예약 알림 실패 (medication ${med.id}): ${e?.message || e}`),
        );
      }
    } catch (e) {
      this.logger.error(`알림 스케줄러 오류: ${e?.message || e}`);
    }
  }

  /** 복용 시간 30분 전에 알림 (기간 내일 때만) */
  private async checkDoseReminders(med: Medication, now: Date) {
    if (!med.reminderTimes || !med.startDate || !med.endDate) return;
    const today = this.dateStr(now);
    if (today < med.startDate || today > med.endDate) return;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    for (const raw of med.reminderTimes.split(',')) {
      const time = raw.trim();
      if (!/^\d{2}:\d{2}$/.test(time)) continue;
      const [h, m] = time.split(':').map(Number);
      const fireAt = h * 60 + m - DOSE_LEAD_MINUTES;
      if (fireAt < 0 || fireAt >= 24 * 60) continue;
      // 매분 크론 — 발송 시각 분과 현재 분이 같을 때만
      if (nowMinutes !== fireAt) continue;

      const refKey = `${today}|${time}`;
      if (!(await this.markSent(med.id, 'dose', refKey))) continue;

      const label = this.subjectLabel(med);
      const body = `${label} — ${time} 복용 시간입니다. (${med.name}${med.dosage ? ` ${med.dosage}` : ''})`;
      await this.notify(med, '약 복용 알림', body);
    }
  }

  /** 병원 예약 D-7 / D-3 / D-1 / 당일 알림 (09시 이후에 1회) */
  private async checkAppointmentReminders(med: Medication, now: Date) {
    if (!med.appointmentDate) return;
    const diff = this.daysBetween(this.dateStr(now), med.appointmentDate);
    const stage = APPOINTMENT_STAGES.find((s) => s.days === diff);
    if (!stage) return;
    // 당일 포함 모든 단계는 오전 9시 이후에 발송 (자정 직후 알림 방지)
    if (now.getHours() < 9) return;

    const refKey = String(diff);
    if (!(await this.markSent(med.id, 'appt', refKey))) return;

    const label = this.subjectLabel(med);
    const body =
      diff === 0
        ? `${label} — 오늘 병원 예약일입니다. (${med.appointmentNote || med.name})`
        : `${label} — 병원 예약이 ${stage.label}입니다. (${med.appointmentDate})`;
    await this.notify(med, '병원 예약 알림', body);
  }

  /** 알림 수신자: 소유자 */
  private async notify(med: Medication, title: string, body: string) {
    await this.notificationService.create(
      Number(med.userId),
      title,
      body,
      'ALERT',
      JSON.stringify({ medicationId: Number(med.id) }),
    );
  }

  private subjectLabel(med: Medication): string {
    return med.subjectName
      ? `${med.subjectName}${med.subjectRelation ? `(${med.subjectRelation})` : ''}의 약`
      : '내 약';
  }

  /** 발송 기록 확인 후 insert — 이미 있으면 false (중복 방지) */
  private async markSent(medicationId: string | number, kind: 'dose' | 'appt', refKey: string): Promise<boolean> {
    const id = Number(medicationId);
    const exists = await this.logRepo.exists({ where: { medicationId: id, kind, refKey } });
    if (exists) return false;
    try {
      await this.logRepo.save(this.logRepo.create({ medicationId: id, kind, refKey }));
      return true;
    } catch {
      return false; // 동시 실행 충돌 시 unique 제약으로 실패 → 미발송 처리
    }
  }

  private dateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private daysBetween(from: string, to: string): number {
    const a = new Date(from + 'T00:00:00');
    const b = new Date(to + 'T00:00:00');
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }
}
