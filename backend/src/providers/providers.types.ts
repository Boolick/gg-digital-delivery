import { IssueRequest, IssueResponse } from '@gg/shared';

export type { IssueRequest, IssueResponse };

export interface ProviderExecutionResult {
  code: string;
  provider: 'A' | 'B';
  requestId: string;
}

export interface IProviderService {
  readonly name: 'A' | 'B';
  issueKey(req: IssueRequest): Promise<IssueResponse>;
}
