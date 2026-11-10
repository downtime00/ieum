import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, Like, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Content } from '../entities/content.entity';

interface SearchQueryParams {
  region?: string | null;           // 지역 (시/군/구)
  category?: string | null;         // 카테고리
  orgId?: number | null;            // 기관 ID
  keyword?: string | null;          // 검색어
  startDate?: Date | null;          // 시작일
  endDate?: Date | null;            // 종료일
  targetAge?: string | null;        // 대상 연령
  page?: number;                    // 페이지 번호 (1 기반)
  limit?: number;                   // 페이지 당 항목 수
  sortBy?: 'createdAt' | 'publishedAt' | 'title'; // 정렬 필드
  sortOrder?: 'DESC' | 'ASC';       // 정렬 방향
}

export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  async findAll(params: SearchQueryParams): Promise<{ items: Content[], total: number }> {
    const queryBuilder = this.contentRepository.createQueryBuilder('content')
      .leftJoinAndSelect('content.organization', 'org')
      .where('content.publishedAt <= :now', { now: new Date() });

    // 지역별 필터링 (시/군/구)
    if (params.region) {
      queryBuilder.andWhere('(org.address LIKE :region OR org.name ILIKE :region)', {
        region: `%${params.region}%`,
      });
    }

    // 카테고리 필터링
    if (params.category) {
      const categoryConditions: string[] = [];
      let i = 0;

      for (const cat of params.category.split(',')) {
        if (cat.trim()) {
          categoryConditions.push(`content.attributes->>'${cat.trim().toLowerCase()}' IS NOT NULL`);
          i++;
        }
      }

      if (categoryConditions.length > 0) {
        queryBuilder.andWhere(new Brackets((qb) => {
          qb.where(categoryConditions.join(' OR '));
        }));
      }
    }

    // 기관별 필터링
    if (params.orgId) {
      queryBuilder.andWhere('content.organizationId = :orgId', { orgId: params.orgId });
    }

    // 키워드 검색
    if (params.keyword) {
      const likePattern = `%${params.keyword}%`;
      queryBuilder.andWhere(new Brackets((qb) => {
        qb.where(`content.title ILIKE :keyword`)
          .orWhere(`content.description ILIKE :keyword`);
      }));
    }

    // 기간 필터링
    if (params.startDate && params.endDate) {
      queryBuilder.andWhere('(content.publishedAt >= :startDate AND content.publishedAt <= :endDate)', {
        startDate: params.startDate,
        endDate: params.endDate,
      });
    } else if (params.startDate) {
      queryBuilder.andWhere('content.publishedAt >= :startDate', { startDate: params.startDate });
    } else if (params.endDate) {
      queryBuilder.andWhere('content.publishedAt <= :endDate', { endDate: params.endDate });
    }

    // 대상 연령 필터링
    if (params.targetAge) {
      const ageConditions: string[] = [];
      let i = 0;

      for (const target of params.targetAge.split(',')) {
        if (target.trim()) {
          ageConditions.push(`content.attributes->>'${target.trim().toLowerCase()}' IS NOT NULL`);
          i++;
        }
      }

      if (ageConditions.length > 0) {
        queryBuilder.andWhere(new Brackets((qb) => {
          qb.where(ageConditions.join(' OR '));
        }));
      }
    }

    // 페이징 및 정렬
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100); // 최대 100 개 제한

    queryBuilder.skip((page - 1) * limit).take(limit);

    if (params.sortBy) {
      queryBuilder.orderBy(params.sortBy, params.sortOrder || 'DESC');
    } else {
      queryBuilder.orderBy('content.publishedAt', 'DESC');
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
    };
  }

  async findOne(id: number): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!content) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다');
    }

    return content;
  }

  async findByOrganization(orgId: number): Promise<Content[]> {
    return this.contentRepository.find({
      where: { organizationId: orgId },
      order: { publishedAt: 'DESC' },
    });
  }

  async searchByKeyword(keyword: string): Promise<Content[]> {
    const likePattern = `%${keyword}%`;
    
    return this.contentRepository.find({
      where: [
        { title: Like(likePattern) },
        { description: Like(likePattern) },
      ],
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async getHotContents(limit: number = 10): Promise<Content[]> {
    return this.contentRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getNewContents(limit: number = 10): Promise<Content[]> {
    return this.contentRepository.find({
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }
}