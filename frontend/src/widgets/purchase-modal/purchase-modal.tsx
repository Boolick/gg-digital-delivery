import React, { useState } from 'react';
import { Product } from '../../entities/product';
import { useValidatePromocode } from '../../features/validate-promo';
import { createOrder, triggerMockPayment } from '../../entities/order';
import { Modal } from '../../shared/ui/modal/modal';
import { Button } from '../../shared/ui/button/button';
import { Input } from '../../shared/ui/input/input';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

export interface PurchaseModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  product,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('user@example.com');
  const [promoInput, setPromoInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const { isValidating, isValid, discountAmount, finalAmount, errorMessage, applyPromo } =
    useValidatePromocode({
      sku: product?.sku || '',
      baseAmount: product?.price || 0,
    });

  if (!product) {
    return null;
  }

  const handleCheckout = async () => {
    try {
      setIsSubmitting(true);
      setCheckoutError(null);
      const order = await createOrder({
        sku: product.sku,
        email: email || undefined,
        promo_code: isValid ? promoInput.trim().toUpperCase() : undefined,
      });
      await triggerMockPayment(order.order_id, order.final_amount);
      onSuccess(order.order_id);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Ошибка создания заказа');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Оформление заказа" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <img
            src={product.image || 'assets/steam.png'}
            alt={product.name}
            className="w-12 h-12 rounded-lg object-cover bg-gray-900"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 truncate">{product.name}</h4>
            <div className="text-xs text-gray-500">SKU: {product.sku}</div>
          </div>
          <div className="text-right font-extrabold text-sm text-gray-900">{product.price} ₽</div>
        </div>

        <Input
          label="Email для получения чека и ключа"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-700">Промокод</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Введите промокод (напр. WELCOME10)"
              className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm uppercase focus:outline-none focus:border-black"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isValidating || !promoInput.trim()}
              onClick={() => applyPromo(promoInput)}
            >
              {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Применить'}
            </Button>
          </div>
          {isValid === true && (
            <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium mt-1">
              <Check className="w-3.5 h-3.5" /> Скидка {discountAmount} ₽ применена!
            </p>
          )}
          {isValid === false && (
            <p className="text-xs text-rose-500 flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errorMessage}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">Итого к оплате:</span>
          <span className="text-xl font-extrabold text-emerald-600" data-testid="modal-final-price">
            {finalAmount} ₽
          </span>
        </div>
        {checkoutError && <p className="text-xs text-rose-500 font-medium">{checkoutError}</p>}

        <Button
          className="w-full"
          size="lg"
          disabled={isSubmitting}
          onClick={handleCheckout}
          data-testid="checkout-submit-btn"
        >
          {isSubmitting ? 'Обработка оплаты...' : `Оплатить ${finalAmount} ₽ (эмуляция)`}
        </Button>
      </div>
    </Modal>
  );
};
