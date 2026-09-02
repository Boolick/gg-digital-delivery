import { useState, useCallback } from 'react';
import { validatePromocode } from '../../entities/promocode';

export interface UseValidatePromocodeProps {
  sku: string;
  baseAmount: number;
}

export function useValidatePromocode({ sku, baseAmount }: UseValidatePromocodeProps) {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const applyPromo = useCallback(
    async (code: string) => {
      const trimmed = code.trim().toUpperCase();
      setPromoCode(trimmed);

      if (!trimmed) {
        setIsValid(null);
        setDiscountAmount(0);
        setErrorMessage(null);
        return;
      }

      setIsValidating(true);
      setErrorMessage(null);

      try {
        const result = await validatePromocode({
          code: trimmed,
          sku,
          amount: baseAmount,
        });

        if (result.valid) {
          setIsValid(true);
          setDiscountAmount(result.discount_amount);
          setErrorMessage(null);
        } else {
          setIsValid(false);
          setDiscountAmount(0);
          setErrorMessage(result.reason || 'Недействительный промокод');
        }
      } catch (err) {
        setIsValid(false);
        setDiscountAmount(0);
        setErrorMessage(err instanceof Error ? err.message : 'Ошибка проверки промокода');
      } finally {
        setIsValidating(false);
      }
    },
    [sku, baseAmount],
  );

  const resetPromo = useCallback(() => {
    setPromoCode('');
    setIsValid(null);
    setDiscountAmount(0);
    setErrorMessage(null);
  }, []);

  const finalAmount = Math.max(0, baseAmount - discountAmount);

  return {
    promoCode,
    setPromoCode,
    isValidating,
    isValid,
    discountAmount,
    finalAmount,
    errorMessage,
    applyPromo,
    resetPromo,
  };
}
