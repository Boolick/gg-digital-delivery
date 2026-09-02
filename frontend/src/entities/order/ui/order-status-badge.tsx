import React from 'react';
import { OrderStatus } from '@gg/shared';
import { Badge } from '../../../shared/ui/badge/badge';
import { CheckCircle2, Clock, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className }) => {
  switch (status) {
    case 'created':
      return (
        <Badge variant="warning" className={className}>
          <Clock className="w-3.5 h-3.5 mr-1" />
          Ожидает оплаты
        </Badge>
      );
    case 'paid':
      return (
        <Badge variant="info" className={className}>
          <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
          Оплачен
        </Badge>
      );
    case 'delivering':
      return (
        <Badge variant="info" className={className}>
          <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
          Выдача товара
        </Badge>
      );
    case 'delivered':
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Выдан
        </Badge>
      );
    case 'out_of_stock':
      return (
        <Badge variant="warning" className={className}>
          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
          Ожидание ключей
        </Badge>
      );
    case 'delivery_failed':
      return (
        <Badge variant="danger" className={className}>
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Ошибка выдачи
        </Badge>
      );
    case 'payment_failed':
      return (
        <Badge variant="danger" className={className}>
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Отказ оплаты
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" className={className}>
          {status}
        </Badge>
      );
  }
};
