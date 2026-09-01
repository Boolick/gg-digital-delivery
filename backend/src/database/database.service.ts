import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import pg, { PoolClient, QueryResult } from 'pg';
import * as fs from 'node:fs';
import * as path from 'node:path';

const { Pool } = pg;

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: pg.Pool;

  public async onModuleInit(): Promise<void> {
    const connectionString =
      process.env['DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:5432/gg_delivery';
    const isSsl = connectionString.includes('sslmode=require') || process.env['DB_SSL'] === 'true';

    this.pool = new Pool({
      connectionString,
      max: 20,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
    });

    try {
      const client = await this.pool.connect();
      try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf8');
          await client.query(sql);
          this.logger.log('Database schema successfully initialized');
        }
      } finally {
        client.release();
      }
    } catch (err) {
      this.logger.warn(
        `PostgreSQL connection not established (${(err as Error).message}). Working in test/fallback mode.`,
      );
    }
  }

  public async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }

  public async query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public getPool(): pg.Pool {
    return this.pool;
  }
}
