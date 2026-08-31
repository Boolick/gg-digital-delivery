import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';

@Module({})
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env['PORT'] || 3000;
  await app.listen(port);
  console.info(`Backend is running on port ${port}`);
}

if (process.env['NODE_ENV'] !== 'test') {
  bootstrap();
}
