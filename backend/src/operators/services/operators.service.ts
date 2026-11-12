import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operator } from '../entities/operator.entity';
import { OperatorProgram } from '../entities/operator-program.entity';
import type { CreateOperatorDto, UpdateOperatorDto, CreateProgramDto, UpdateProgramDto } from '../dto/operator.dto';

@Injectable()
export class OperatorsService {
  constructor(
    @InjectRepository(Operator)
    private readonly operatorRepo: Repository<Operator>,
    @InjectRepository(OperatorProgram)
    private readonly programRepo: Repository<OperatorProgram>,
  ) {}

  // ── 기관 ──────────────────────────────────────────────

  async create(data: CreateOperatorDto): Promise<Operator> {
    const existing = await this.operatorRepo.findOne({ where: { ownerUserId: data.userId } });
    if (existing) throw new BadRequestException('이미 등록된 기관이 있습니다');
    const op = this.operatorRepo.create({
      ownerUserId: data.userId,
      name: data.name,
      orgType: data.orgType,
      businessNumber: data.businessNumber ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      description: data.description ?? null,
      bankName: data.bankName ?? null,
      bankAccount: data.bankAccount ?? null,
      accountHolder: data.accountHolder ?? null,
      status: 'PENDING',
    });
    return this.operatorRepo.save(op);
  }

  async findAll(keyword?: string, orgType?: string): Promise<Operator[]> {
    const qb = this.operatorRepo
      .createQueryBuilder('o')
      .where('o.status = :status', { status: 'APPROVED' });
    if (keyword?.trim()) {
      qb.andWhere('(o.name ILIKE :kw OR o.address ILIKE :kw OR o.description ILIKE :kw)', {
        kw: `%${keyword.trim()}%`,
      });
    }
    if (orgType?.trim()) {
      qb.andWhere('o.org_type = :orgType', { orgType: orgType.trim() });
    }
    qb.orderBy('o.created_at', 'DESC').take(100);
    return qb.getMany();
  }

  async findOne(id: number): Promise<Operator> {
    const op = await this.operatorRepo.findOne({ where: { id: String(id) } });
    if (!op) throw new NotFoundException('기관을 찾을 수 없습니다');
    return op;
  }

  async findByOwner(userId: number): Promise<Operator | null> {
    return this.operatorRepo.findOne({ where: { ownerUserId: userId } });
  }

  async update(id: number, ownerUserId: number, data: UpdateOperatorDto): Promise<Operator> {
    const op = await this.findOne(id);
    if (Number(op.ownerUserId) !== ownerUserId) {
      throw new BadRequestException('본인 기관만 수정할 수 있습니다');
    }
    Object.assign(op, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.orgType !== undefined && { orgType: data.orgType }),
      ...(data.businessNumber !== undefined && { businessNumber: data.businessNumber ?? null }),
      ...(data.phone !== undefined && { phone: data.phone ?? null }),
      ...(data.address !== undefined && { address: data.address ?? null }),
      ...(data.description !== undefined && { description: data.description ?? null }),
      ...(data.bankName !== undefined && { bankName: data.bankName ?? null }),
      ...(data.bankAccount !== undefined && { bankAccount: data.bankAccount ?? null }),
      ...(data.accountHolder !== undefined && { accountHolder: data.accountHolder ?? null }),
    });
    return this.operatorRepo.save(op);
  }

  async setStatus(id: number, status: 'APPROVED' | 'REJECTED'): Promise<Operator> {
    const op = await this.findOne(id);
    op.status = status;
    return this.operatorRepo.save(op);
  }

  // 소유자 확인 후 반환 (프로그램/예약 관리용)
  async findOwned(id: number, userId: number): Promise<Operator> {
    const op = await this.findOne(id);
    if (Number(op.ownerUserId) !== userId) {
      throw new BadRequestException('본인 기관만 관리할 수 있습니다');
    }
    return op;
  }

  // ── 프로그램 ──────────────────────────────────────────

  async createProgram(operatorId: number, data: CreateProgramDto): Promise<OperatorProgram> {
    const op = await this.findOne(operatorId);
    if (op.status !== 'APPROVED') {
      throw new BadRequestException('승인된 기관만 프로그램을 등록할 수 있습니다');
    }
    const program = this.programRepo.create({
      operatorId,
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      eventDate: data.eventDate,
      startTime: data.startTime ?? null,
      durationMin: data.durationMin ?? null,
      price: data.price,
      capacity: data.capacity,
      address: data.address ?? op.address ?? null,
      contactPhone: data.contactPhone ?? op.phone ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      isActive: true,
      bookedCount: 0,
    });
    return this.programRepo.save(program);
  }

  async listPrograms(operatorId: number, includeInactive = false): Promise<OperatorProgram[]> {
    const qb = this.programRepo
      .createQueryBuilder('p')
      .where('p.operator_id = :operatorId', { operatorId })
      .orderBy('p.event_date', 'ASC');
    if (!includeInactive) qb.andWhere('p.is_active = true');
    return qb.getMany();
  }

  async findProgram(programId: number): Promise<OperatorProgram> {
    const p = await this.programRepo.findOne({ where: { id: String(programId) } });
    if (!p) throw new NotFoundException('프로그램을 찾을 수 없습니다');
    return p;
  }

  async updateProgram(programId: number, ownerUserId: number, data: UpdateProgramDto): Promise<OperatorProgram> {
    const p = await this.findProgram(programId);
    await this.findOwned(Number(p.operatorId), ownerUserId);
    Object.assign(p, {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description ?? null }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.eventDate !== undefined && { eventDate: data.eventDate }),
      ...(data.startTime !== undefined && { startTime: data.startTime ?? null }),
      ...(data.durationMin !== undefined && { durationMin: data.durationMin ?? null }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.address !== undefined && { address: data.address ?? null }),
      ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone ?? null }),
      ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl ?? null }),
    });
    return this.programRepo.save(p);
  }

  async deleteProgram(programId: number, ownerUserId: number): Promise<void> {
    const p = await this.findProgram(programId);
    await this.findOwned(Number(p.operatorId), ownerUserId);
    await this.programRepo.remove(p);
  }

  async adjustBookedCount(programId: number, delta: number): Promise<void> {
    await this.programRepo.increment({ id: String(programId) }, 'bookedCount', delta);
  }
}
