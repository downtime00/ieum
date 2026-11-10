import { Controller, Get, Patch, Body, UseGuards, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/validation/zod.validation.pipe';
import { UsersService } from '../users.service';
import { updateUserSchema, updateInterestsSchema } from '../schemas/user.schema';
import type { UpdateUserDto, UpdateInterestsDto } from '../schemas/user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Body('userId') userId: number) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  @UsePipes(new ZodValidationPipe(updateUserSchema))
  async updateMe(@Body() updateUserDto: UpdateUserDto, @Body('userId') userId: number) {
    return this.usersService.updateMe(userId, updateUserDto);
  }

  @Patch('me/interests')
  @UsePipes(new ZodValidationPipe(updateInterestsSchema))
  async updateInterests(@Body() updateInterestsDto: UpdateInterestsDto, @Body('userId') userId: number) {
    return this.usersService.updateInterests(userId, updateInterestsDto);
  }

  @Get('me/organizations')
  async getMyOrganizations(@Body('userId') userId: number) {
    return this.usersService.getMyOrganizations(userId);
  }
}
