import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, Header } from '@nestjs/common';
import { MedicationsService } from '../services/medications.service';
import { Medication } from '../entities/medication.entity';
import { ZodValidationPipe } from '../../common/validation/zod.validation.pipe';
import { medicationSchema, updateMedicationSchema, doseSchema } from '../dto/medication.dto';
import type { CreateMedicationDto, UpdateMedicationDto, DoseDto } from '../dto/medication.dto';

@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  findByUser(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('all') all?: string,
  ): Promise<Medication[]> {
    return this.medicationsService.findByUser(userId, all === 'true');
  }

  // 날짜별 복용 예정 + 완료 여부 — ':id' 라우트보다 먼저 선언해야 함
  @Get('doses')
  getDoses(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('date') date?: string,
  ) {
    return this.medicationsService.getDoses(userId, date);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Query('userId', ParseIntPipe) userId: number) {
    return this.medicationsService.findOne(id, userId);
  }

  @Post()
  create(@Body(new ZodValidationPipe(medicationSchema)) data: CreateMedicationDto): Promise<Medication> {
    return this.medicationsService.create(data);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
    @Body(new ZodValidationPipe(updateMedicationSchema)) data: UpdateMedicationDto,
  ): Promise<Medication> {
    return this.medicationsService.update(id, userId, data);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    return this.medicationsService.remove(id, userId);
  }

  /** 특정 복용 시간 완료 표시 */
  @Post(':id/doses')
  markDose(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
    @Body(new ZodValidationPipe(doseSchema)) data: DoseDto,
  ) {
    return this.medicationsService.setDoseTaken(userId, id, data.time, data.date, true);
  }

  /** 복용 완료 해제 */
  @Delete(':id/doses')
  unmarkDose(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
    @Query('time') time: string,
    @Query('date') date?: string,
  ) {
    return this.medicationsService.setDoseTaken(userId, id, time, date, false);
  }
}
