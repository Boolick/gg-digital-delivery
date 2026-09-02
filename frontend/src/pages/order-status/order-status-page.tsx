import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GetOrderStatusResponse } from '@gg/shared';
import { getOrderStatus, OrderStatusBadge } from '../../entities/order';
import { Card } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { Copy, Check, ArrowLeft, KeyRound, Loader2, AlertCircle } from 'lucide-react';

export const OrderStatusPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<GetOrderStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      const data = await getOrderStatus(id);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить заказ');
    }
  }, [id]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      setOrder((currentOrder) => {
        if (
          currentOrder &&
          (currentOrder.status === 'delivered' || currentOrder.status === 'payment_failed')
        ) {
          return currentOrder;
        }
        fetchStatus();
        return currentOrder;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleCopyKey = () => {
    if (order?.key_code) {
      navigator.clipboard.writeText(order.key_code).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 py-10 px-4 flex justify-center items-start">
      <div className="max-w-xl w-full space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> В каталог
        </Button>

        <Card className="p-6 bg-white shadow-sm border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Заказ #{id?.slice(0, 8)}</h2>
              <p className="text-xs text-gray-500">{order?.created_at || 'Загрузка...'}</p>
            </div>
            {order ? (
              <OrderStatusBadge status={order.status} />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {order && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm py-1 border-b border-gray-50">
                <span className="text-gray-500">Товар:</span>
                <span className="font-semibold text-gray-900">
                  {order.product_name || order.sku}
                </span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-gray-50">
                <span className="text-gray-500">Сумма оплаты:</span>
                <span className="font-bold text-emerald-600">{order.final_amount} ₽</span>
              </div>

              {order.status === 'delivered' && order.key_code && (
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <KeyRound className="w-4 h-4 text-emerald-600" /> Ваш ключ активации:
                  </div>
                  <div className="p-3 bg-white border border-emerald-300 rounded-xl font-mono text-center text-lg font-extrabold tracking-wider text-emerald-950 select-all">
                    {order.key_code}
                  </div>
                  <Button
                    variant="primary"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleCopyKey}
                    data-testid="copy-key-button"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" /> Скопировано!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" /> Копировать ключ
                      </>
                    )}
                  </Button>
                </div>
              )}

              {(order.status === 'out_of_stock' || order.status === 'delivery_failed') && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
                  <div className="font-bold mb-1">Товар временно ожидает пополнения</div>
                  Пул ключей для этого товара пополняется. Выдача произойдет автоматически, либо
                  обратитесь в поддержку.
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
