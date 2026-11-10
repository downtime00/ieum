import { Controller, Get, Post, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryOrganizationsDto } from './dto/query-organizations.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async findAll(@Query() query: QueryOrganizationsDto) {
    return this.organizationsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(+id);
  }

  @Post(':id/connect')
  @UseGuards(JwtAuthGuard)
  async connect(@Req() req, @Param('id') id: string) {
    return this.organizationsService.connect(req.user.id, +id);
  }

  @Delete(':id/connect')
  @UseGuards(JwtAuthGuard)
  async disconnect(@Req() req, @Param('id') id: string) {
    return this.organizationsService.disconnect(req.user.id, +id);
  }
}
