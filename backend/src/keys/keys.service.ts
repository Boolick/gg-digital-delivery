import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { KeysRepository, KeyRecord } from './keys.repository.js';

@Injectable()
export class KeysService {
  constructor(private readonly keysRepo: KeysRepository) {}

  public async allocateKey(
    client: PoolClient,
    sku: string,
    orderId: string,
  ): Promise<KeyRecord | null> {
    return this.keysRepo.allocateKeyForOrder(client, sku, orderId);
  }

  public async restock(sku: string, keys: string[]): Promise<number> {
    return this.keysRepo.restockKeys(sku, keys);
  }

  public async getAvailableCount(sku: string): Promise<number> {
    return this.keysRepo.getAvailableKeysCount(sku);
  }
}
