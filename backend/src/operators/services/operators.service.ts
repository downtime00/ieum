import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operator } from '../entities/operator.entity';
import { OperatorProgram } from '../entities/operator-program.entity';
import { OperatorReview } from '../entities/operator-review.entity';
import { OperatorOrgType } from '../entities/operator-org-type.entity';
import { RedisService } from '../../common/redis/redis.service';
import type { CreateOperatorDto, UpdateOperatorDto, CreateProgramDto, UpdateProgramDto } from '../dto/operator.dto';

const ORG_TYPES_CACHE_KEY = 'operators:org_types';
const ORG_TYPES_CACHE_TTL = 3600; // 1시간

// 테이블이 비어 있을 때(마이그레이션 미적용 환경) 사용하는 기본 시드
const DEFAULT_ORG_TYPES: Array<{ name: string; group: 'institution' | 'individual'; sortOrder: number }> = [
  { name: '행복복지센터', group: 'institution', sortOrder: 1 },
  { name: '실버타운', group: 'institution', sortOrder: 2 },
  { name: '노인회관', group: 'institution', sortOrder: 3 },
  { name: '복지관', group: 'institution', sortOrder: 4 },
  { name: '요양보호사', group: 'individual', sortOrder: 1 },
  { name: '간병인', group: 'individual', sortOrder: 2 },
  { name: '강사', group: 'individual', sortOrder: 3 },
  { name: '기타', group: 'individual', sortOrder: 4 },
];

@Injectable()
export class OperatorsService {
  constructor(
    @InjectRepository(Operator)
    private readonly operatorRepo: Repository<Operator>,
    @InjectRepository(OperatorProgram)
    private readonly programRepo: Repository<OperatorProgram>,
    @InjectRepository(OperatorReview)
    private readonly reviewRepo: Repository<OperatorReview>,
    @InjectRepository(OperatorOrgType)
    private readonly orgTypeRepo: Repository<OperatorOrgType>,
    private readonly redis: RedisService,
  ) {}

  // ── 기관 유형 (DB + Redis 캐시) ─────────────────────────

  /** 활성 기관 유형 목록 — Redis 캐시 우선, 미스 시 DB 조회 후 캐시 */
  async getOrgTypes(): Promise<OperatorOrgType[]> {
    const cached = await this.redis.get(ORG_TYPES_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached) as OperatorOrgType[];
      } catch {
        // 캐시 파손 시 DB로 폴백
      }
    }
    const sortTypes = (list: OperatorOrgType[]) =>
      [...list].sort(
        (a, b) =>
          (a.group === b.group ? a.sortOrder - b.sortOrder : a.group === 'institution' ? -1 : 1),
      );
    const fallback = sortTypes(
      DEFAULT_ORG_TYPES.map((t, i) =>
        this.orgTypeRepo.create({ ...t, id: String(i + 1) }),
      ),
    );
    let types: OperatorOrgType[];
    try {
      types = sortTypes(await this.orgTypeRepo.find({ where: { isActive: true } }));
      if (types.length === 0) {
        // 테이블은 있지만 비어 있는 경우(마이그레이션 시드 누락 등) 자동 시드
        await this.orgTypeRepo.save(
          DEFAULT_ORG_TYPES.map((t) => this.orgTypeRepo.create(t)),
        );
        types = sortTypes(await this.orgTypeRepo.find({ where: { isActive: true } }));
      }
    } catch {
      // 테이블 자체가 없는 환경(마이그레이션 미적용) — 기본값으로 폴백
      types = fallback;
    }
    await this.redis.set(ORG_TYPES_CACHE_KEY, JSON.stringify(types), ORG_TYPES_CACHE_TTL);
    return types;
  }

  /** 기관 유형 유효성 검증 — 등록/수정 시 DB(캐시) 기준 */
  private async assertValidOrgType(orgType: string): Promise<void> {
    const types = await this.getOrgTypes();
    if (!types.some((t) => t.name === orgType)) {
      throw new BadRequestException('등록되지 않은 기관 유형입니다');
    }
  }

  /** 기관 유형 캐시 무효화 (유형 변경 시 호출) */
  async invalidateOrgTypeCache(): Promise<void> {
    await this.redis.del(ORG_TYPES_CACHE_KEY);
  }

  // ── 기관 ──────────────────────────────────────────────

  async create(data: CreateOperatorDto): Promise<Operator> {
    const existing = await this.operatorRepo.findOne({ where: { ownerUserId: data.userId } });
    if (existing) throw new BadRequestException('이미 등록된 기관이 있습니다');
    await this.assertValidOrgType(data.orgType);
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
    const ops = await qb.getMany();
    if (ops.length === 0) return ops;
    const stats = await this.reviewRepo
      .createQueryBuilder('r')
      .select('r.operator_id', 'operatorId')
      .addSelect('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.operator_id IN (:...ids)', { ids: ops.map((o) => Number(o.id)) })
      .groupBy('r.operator_id')
      .getRawMany();
    const statMap = new Map(stats.map((s: any) => [Number(s.operatorId), s]));
    return ops.map((o) => {
      const s = statMap.get(Number(o.id));
      return {
        ...o,
        avgRating: s ? Math.round(Number(s.avg) * 10) / 10 : null,
        reviewCount: s ? Number(s.cnt) : 0,
      };
    });
  }

  /** 관리자용 전체 기관 목록 — status 필터 optional (PENDING/APPROVED/REJECTED) */
  async findAllForAdmin(status?: string): Promise<Operator[]> {
    const qb = this.operatorRepo
      .createQueryBuilder('o')
      .orderBy('o.created_at', 'DESC')
      .take(300);
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      qb.where('o.status = :status', { status });
    }
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
    if (data.orgType !== undefined) await this.assertValidOrgType(data.orgType);
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
      ...(data.isActive !== undefined && { isActive: data.isActive }),
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
