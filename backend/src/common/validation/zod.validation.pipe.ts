import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    // 메서드 레벨 @UsePipes는 모든 파라미터(@Param/@Query/@Body)에 적용되므로
    // body가 아닌 파라미터는 그대로 통과시킨다
    if (metadata.type !== 'body') return value;
    try {
      const result = this.schema.parse(value);
      return result;
    } catch (error) {
      // zod v4는 issues, v3는 errors 사용
      const issues = (error as any).issues ?? (error as any).errors;
      if (issues) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: issues,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
