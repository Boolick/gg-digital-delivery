import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { ProviderAService } from './provider-a.service.js';
import { ProviderBService } from './provider-b.service.js';
import { ProviderExecutionResult } from './providers.types.js';

@Injectable()
export class IssueEngineService {
  private readonly logger = new Logger(IssueEngineService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly providerA: ProviderAService,
    private readonly providerB: ProviderBService,
  ) {}

  public async issueKeyWithFallback(
    sku: string,
    orderId: string,
  ): Promise<ProviderExecutionResult | null> {
    const cachedReq = await this.db.query<{
      provider: 'A' | 'B';
      code: string;
      request_id: string;
    }>(
      'SELECT provider, code, request_id FROM provider_requests WHERE order_id = $1 AND status = $2',
      [orderId, 'ok'],
    );
    if (cachedReq.rows[0]) {
      const row = cachedReq.rows[0];
      return { code: row.code, provider: row.provider, requestId: row.request_id };
    }

    const reqIdA = `req_A_${orderId}`;
    const resA = await this.providerA.issueKey({ request_id: reqIdA, sku, order_id: orderId });
    if (resA.status === 'ok') {
      await this.saveRequest(reqIdA, orderId, sku, 'A', 'ok', resA.code);
      return { code: resA.code, provider: 'A', requestId: reqIdA };
    }

    this.logger.warn(
      `Provider A failed for order ${orderId} (${resA.reason}). Triggering fallback B...`,
    );
    await this.saveRequest(reqIdA, orderId, sku, 'A', 'error', undefined);

    const reqIdB = `req_B_${orderId}`;
    const resB = await this.providerB.issueKey({ request_id: reqIdB, sku, order_id: orderId });
    if (resB.status === 'ok') {
      await this.saveRequest(reqIdB, orderId, sku, 'B', 'ok', resB.code);
      return { code: resB.code, provider: 'B', requestId: reqIdB };
    }

    await this.saveRequest(reqIdB, orderId, sku, 'B', 'error', undefined);
    return null;
  }

  private async saveRequest(
    reqId: string,
    orderId: string,
    sku: string,
    provider: string,
    status: string,
    code?: string,
  ): Promise<void> {
    const query = `
      INSERT INTO provider_requests (request_id, order_id, sku, provider, status, code)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (request_id) DO UPDATE SET status = EXCLUDED.status, code = EXCLUDED.code;
    `;
    await this.db.query(query, [reqId, orderId, sku, provider, status, code ?? null]);
  }
}
