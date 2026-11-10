import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, Header } from '@nestjs/common';
import { MedicationsService } from '../services/medications.service';
import { Medication } from '../entities/medication.entity';
import { ZodValidationPipe } from '../../common/validation/zod.validation.pipe';
import { medicationSchema, updateMedicationSchema } from '../dto/medication.dto';
import type { CreateMedicationDto, UpdateMedicationDto } from '../dto/medication.dto';

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
}
