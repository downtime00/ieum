import { IsIn, IsInt, IsOptional, Min, IsString } from 'class-validator';

export class QueryOrganizationsDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsIn(['name', 'type'])
  field?: 'name' | 'type';

  @IsOptional()
  @IsInt({ message: '정수 값이어야 합니다.' })
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsInt({ message: '정수 값이어야 합니다.' })
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt({ message: '정수 값이어야 합니다.' })
  @Min(1)
  limit?: number;
}
