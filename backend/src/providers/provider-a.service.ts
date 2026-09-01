import { Injectable, Logger } from '@nestjs/common';
import { IProviderService, IssueRequest, IssueResponse } from './providers.types.js';

@Injectable()
export class ProviderAService implements IProviderService {
  public readonly name = 'A' as const;
  private readonly logger = new Logger(ProviderAService.name);
  public simulateFailure = false;

  public async issueKey(req: IssueRequest): Promise<IssueResponse> {
    if (this.simulateFailure || process.env['SIMULATE_PROVIDER_A_FAIL'] === 'true') {
      this.logger.warn(`Provider A simulated 500 failure for request '${req.request_id}'`);
      return {
        status: 'error',
        reason: 'timeout',
        message: 'Provider A gateway timeout / 500 Internal Error',
      };
    }

    const code = `KEY_PROV_A_${req.sku}_${req.request_id}`;
    this.logger.log(`Provider A issued key '${code}' for request '${req.request_id}'`);
    return {
      status: 'ok',
      request_id: req.request_id,
      code,
    };
  }
}
