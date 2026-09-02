import React from 'react';
import { AdminOrderListItem } from '@gg/shared';
import { Button } from '../../../shared/ui/button/button';
import { OrderStatusBadge } from '../../../entities/order';
import { RefreshCw } from 'lucide-react';

export interface AdminOrdersTableProps {
  orders: AdminOrderListItem[];
  retryingId: string | null;
  onRetry: (orderId: string) => void;
}

export const AdminOrdersTable: React.FC<AdminOrdersTableProps> = ({
  orders,
  retryingId,
  onRetry,
}) => {
  if (orders.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
        Нет проблемных заказов. Все заказы успешно обработаны!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase font-semibold">
          <tr>
            <th className="p-3">ID Заказа</th>
            <th className="p-3">SKU</th>
            <th className="p-3">Статус</th>
            <th className="p-3">Попытки</th>
            <th className="p-3">Причина</th>
            <th className="p-3 text-right">Действие</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((ord) => (
            <tr key={ord.order_id} className="hover:bg-gray-50/50">
              <td className="p-3 font-mono font-medium">{ord.order_id.slice(0, 12)}</td>
              <td className="p-3 font-medium">{ord.sku}</td>
              <td className="p-3">
                <OrderStatusBadge status={ord.status} />
              </td>
              <td className="p-3">{ord.attempts}</td>
              <td className="p-3 text-rose-600 truncate max-w-xs">{ord.error_message || '—'}</td>
              <td className="p-3 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={retryingId === ord.order_id}
                  onClick={() => onRetry(ord.order_id)}
                  data-testid={`retry-btn-${ord.order_id}`}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 mr-1 ${retryingId === ord.order_id ? 'animate-spin' : ''}`}
                  />
                  Повторить
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
