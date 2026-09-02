import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    let errorName = 'Internal Server Error';
    let message: string = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      errorName = exception.name || 'HttpException';
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, unknown>;
        message = (resObj['message'] as string) || exception.message;
        errorName = (resObj['error'] as string) || errorName;
        details = resObj['details'];
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }
    }

    const logMessage =
      exception instanceof Error ? exception.stack || exception.message : JSON.stringify(exception);
    this.logger.error(`HTTP Error ${status} on ${request.method} ${request.url}: ${logMessage}`);

    response.status(status).json({
      statusCode: status,
      error: errorName,
      message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
