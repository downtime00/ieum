import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { OrganizationService } from '../services/organization.service';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  async create(@Body() createOrganizationDto: any) {
    return this.organizationService.create(createOrganizationDto);
  }

  @Get()
  async findAll() {
    return this.organizationService.findAll();
  }

  @Get('type/:type')
  async findByType(@Param('type') type: string) {
    return this.organizationService.findByType(type);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.organizationService.findOne(+id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: any,
  ) {
    return this.organizationService.update(+id, updateOrganizationDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.organizationService.remove(+id);
  }

  @Get('search')
  async search(@Query('query') query: string) {
    return this.organizationService.search(query);
  }
}