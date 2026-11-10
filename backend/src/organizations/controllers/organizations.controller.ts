import { Controller, Get, Post, Put, Delete, Query, Body, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrganizationsService } from '../organizations.service';
import { QueryOrganizationsDto } from '../dto/query-organizations.dto';
import { createOrganizationSchema, updateOrganizationSchema, type CreateOrganizationDto, type UpdateOrganizationDto } from '../dto/create-organization.dto';
import { ZodValidationPipe } from '../../common/validation/zod.validation.pipe';

@ApiTags('Organizations')
@Controller('admin/organizations')  // Admin 전용 엔드포인트 변경
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  /**
   * 기관 목록 조회 (GET)
   */
  @Get()
  @ApiOperation({ summary: '기관 목록 조회' })
  @ApiResponse({ status: 200, description: '기관 목록 성공' })
  async findAll(@Query() query: QueryOrganizationsDto) {
    return this.organizationsService.findAll(query);
  }

  /**
   * 기관 단건 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '기관 상세 조회' })
  @ApiResponse({ status: 200, description: '기관 상세 정보 성공' })
  async findOne(@Query('id') id: string) {  // number → string
    return this.organizationsService.findOne(id);  // parseInt 제거
  }

  /**
   * 기관 생성 (Admin 전용 - POST /admin/organizations)
   */
  @Post()
  @UsePipes(new ZodValidationPipe(createOrganizationSchema))
  @ApiOperation({ summary: '기관 등록 (Admin)' })
  @ApiResponse({ status: 201, description: '기관이 성공적으로 생성됨' })
  @ApiResponse({ status: 409, description: '기관 이름 중복' })
  async create(@Body() organizationData: CreateOrganizationDto): Promise<CreateOrganizationDto> {
    return this.organizationsService.create(organizationData);
  }

  /**
   * 기관 수정 (Admin 전용 - PUT /admin/organizations/:id)
   */
  @Put(':id')
  @UsePipes(new ZodValidationPipe(updateOrganizationSchema))
  @ApiOperation({ summary: '기관 정보 수정 (Admin)' })
  @ApiResponse({ status: 200, description: '기관 정보가 성공적으로 업데이트됨' })
  @ApiResponse({ status: 409, description: '기관 이름 중복' })
  async update(@Query('id') id: string, @Body() organizationData: UpdateOrganizationDto): Promise<UpdateOrganizationDto> {
    return this.organizationsService.update(id, organizationData);
  }

  /**
   * 기관 삭제 (Admin 전용 - DELETE /admin/organizations/:id)
   */
  @Delete(':id')
  @ApiOperation({ summary: '기관 삭제 (Admin)' })
  @ApiResponse({ status: 200, description: '기관이 성공적으로 삭제됨' })
  async remove(@Query('id') id: string) {  // number → string
    return this.organizationsService.remove(id);  // parseInt 제거
  }
}