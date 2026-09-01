import { PipeTransform, Injectable } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  public transform(value: unknown): unknown {
    return this.schema.parse(value);
  }
}
