import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateUserProfileDto {
  @IsNotEmpty()
  profileUrl?: string | null;

  @IsOptional()
  @IsString()
  bio?: string | null;

  @IsOptional()
  additionalInfo?: Record<string, any> | null;
}