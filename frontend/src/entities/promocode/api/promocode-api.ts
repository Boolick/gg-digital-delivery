import {
  ValidatePromocodeRequest,
  ValidatePromocodeResponse,
  ValidatePromocodeResponseSchema,
} from '@gg/shared';
import { apiClient, ApiError } from '../../../shared/api';

export async function validatePromocode(
  req: ValidatePromocodeRequest,
): Promise<ValidatePromocodeResponse> {
  try {
    return await apiClient.post('/api/promocodes/validate', req, ValidatePromocodeResponseSchema, {
      skipGlobalError: true,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        valid: false,
        code: req.code,
        discount_amount: 0,
        final_amount: req.amount,
        reason: error.message || 'Не удалось применить промокод',
      };
    }
    throw error;
  }
}
