import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ZodExceptionFilter.name);

  public catch(exception: ZodError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const details = exception.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));

    this.logger.warn(`Validation failed: ${JSON.stringify(details)}`);

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: 'Validation failed',
      details,
    });
  }
}
