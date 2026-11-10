import { Controller, Get, Query, Param, UsePipes } from '@nestjs/common';
import { ContentService } from '../services/content.service';
import { ZodValidationPipe } from '../../common/validation/zod.validation.pipe';
import { searchQueryParamsSchema } from '../schemas/content.schema';
import type { SearchQueryParams } from '../schemas/content.schema';

@Controller('contents')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(searchQueryParamsSchema))
  async findAll(@Query() params: SearchQueryParams) {
    return this.contentService.findAll(params);
  }

  @Get('hot')
  async getHotContents(@Query('limit') limit?: string) {
    const count = parseInt(limit) || 10;
    return this.contentService.getHotContents(count);
  }

  @Get('new')
  async getNewContents(@Query('limit') limit?: string) {
    const count = parseInt(limit) || 10;
    return this.contentService.getNewContents(count);
  }

  @Get('organization/:orgId')
  async findByOrganization(@Param('orgId') orgId: string) {
    return this.contentService.findByOrganization(+orgId);
  }

  @Get('keyword/:keyword')
  async searchByKeyword(@Param('keyword') keyword: string) {
    return this.contentService.searchByKeyword(keyword);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.contentService.findOne(+id);
  }
}