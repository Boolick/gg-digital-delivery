import { Injectable, Logger } from '@nestjs/common';
import { IProviderService, IssueRequest, IssueResponse } from './providers.types.js';

@Injectable()
export class ProviderBService implements IProviderService {
  public readonly name = 'B' as const;
  private readonly logger = new Logger(ProviderBService.name);

  public async issueKey(req: IssueRequest): Promise<IssueResponse> {
    const code = `KEY_PROV_B_${req.sku}_${req.request_id}`;
    this.logger.log(`Provider B (Fallback) issued key '${code}' for request '${req.request_id}'`);
    return {
      status: 'ok',
      request_id: req.request_id,
      code,
    };
  }
}
