import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ZodExceptionFilter } from './common/filters/zod-exception.filter.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = process.env['CORS_ORIGIN'] ? process.env['CORS_ORIGIN'].split(',') : true;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  app.useGlobalFilters(new HttpExceptionFilter(), new ZodExceptionFilter());

  const port = process.env['PORT'] || 3000;
  await app.listen(port);
  console.info(`Backend is running on port ${port}`);
}

if (process.env['NODE_ENV'] !== 'test') {
  bootstrap();
}

export { AppModule };
