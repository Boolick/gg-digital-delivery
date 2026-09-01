import { Injectable } from '@nestjs/common';
import { ValidatePromocodeRequest, ValidatePromocodeResponse } from '@gg/shared';
import { PromocodesRepository } from './promocodes.repository.js';

@Injectable()
export class PromocodesService {
  constructor(private readonly promocodesRepo: PromocodesRepository) {}

  public async validatePromocode(
    dto: ValidatePromocodeRequest,
  ): Promise<ValidatePromocodeResponse> {
    const promo = await this.promocodesRepo.findPromocode(dto.code);
    if (!promo) {
      return {
        valid: false,
        code: dto.code,
        discount_amount: 0,
        final_amount: dto.amount,
        reason: `Promocode '${dto.code}' not found`,
      };
    }

    if (promo.used_count >= promo.max_uses) {
      return {
        valid: false,
        code: promo.code,
        type: promo.type,
        value: Number(promo.value),
        discount_amount: 0,
        final_amount: dto.amount,
        reason: 'Promocode usage limit reached',
      };
    }

    const discountAmount =
      promo.type === 'percent'
        ? Math.round((dto.amount * Number(promo.value)) / 100)
        : Math.min(dto.amount, Number(promo.value));
    const finalAmount = Math.max(0, dto.amount - discountAmount);

    return {
      valid: true,
      code: promo.code,
      type: promo.type,
      value: Number(promo.value),
      discount_amount: discountAmount,
      final_amount: finalAmount,
    };
  }
}
