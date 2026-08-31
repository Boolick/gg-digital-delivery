import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { InMemoryTestDb } from './test-db.js';
import { TestAppModule, setTestControllerDb } from './test-controller.js';

export { InMemoryTestDb } from './test-db.js';
export { TestApiController, TestAppModule } from './test-controller.js';
export type { KeyRecord, PaymentEventRecord } from './test-db.js';

export interface TestHarness {
  app: INestApplication;
  agent: ReturnType<typeof request>;
  db: InMemoryTestDb;
  cleanup: () => Promise<void>;
  resetData: () => void;
}

export async function createTestHarness(): Promise<TestHarness> {
  const db = new InMemoryTestDb();
  setTestControllerDb(db);

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.enableCors();
  await app.init();

  const agent = request(app.getHttpServer());

  const cleanup = async () => {
    await app.close();
  };

  const resetData = () => {
    db.reset();
  };

  return {
    app,
    agent,
    db,
    cleanup,
    resetData,
  };
}
