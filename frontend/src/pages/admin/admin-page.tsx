import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminOrderListItem } from '@gg/shared';
import { fetchAdminOrders, retryOrderDelivery, restockProductKeys } from '../../entities/admin';
import { AdminOrdersTable } from './ui/admin-orders-table';
import { AdminRestockForm } from './ui/admin-restock-form';
import { Button } from '../../shared/ui/button/button';
import { Input } from '../../shared/ui/input/input';
import { ShieldCheck, RefreshCw, Key, ArrowLeft } from 'lucide-react';

import { useToast } from '../../shared/ui/toast';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(
    () => sessionStorage.getItem('admin_token') || 'test-admin-secret-2026',
  );
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { showSuccess, showError } = useToast();

  const loadOrders = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAdminOrders(token);
      setOrders(data);
      sessionStorage.setItem('admin_token', token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки заказов';
      setFeedback(msg);
      showError(msg, 'Админ-панель');
    } finally {
      setLoading(false);
    }
  }, [token, showError]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRetry = async (orderId: string) => {
    setRetryingId(orderId);
    try {
      const res = await retryOrderDelivery(token, orderId);
      const msg = `Заказ ${orderId} повторно отправлен (статус: ${res.new_status})`;
      setFeedback(msg);
      showSuccess(msg, 'Повторная выдача');
      await loadOrders();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка повтора выдачи';
      setFeedback(msg);
      showError(msg, 'Ошибка выдачи');
    } finally {
      setRetryingId(null);
    }
  };

  const handleRestock = async (sku: string, keys: string[]) => {
    setLoading(true);
    try {
      const res = await restockProductKeys(token, sku, keys);
      const msg = `Добавлено ${res.added_count} ключей для ${sku} (всего: ${res.total_available})`;
      setFeedback(msg);
      showSuccess(msg, 'Пополнение пула');
      await loadOrders();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка пополнения ключей';
      setFeedback(msg);
      showError(msg, 'Ошибка пополнения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> В магазин
        </Button>

        {/* Header & Token Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h1 className="text-lg font-bold">Панель администратора</h1>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="password"
              placeholder="Admin Bearer Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-48 sm:w-64"
            />
            <Button size="sm" onClick={loadOrders} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>
        </div>

        {feedback && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium">
            {feedback}
          </div>
        )}

        <AdminRestockForm onRestock={handleRestock} isLoading={loading} />

        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-gray-600" /> Проблемные заказы (Out of Stock / Failed)
          </h2>
          <AdminOrdersTable orders={orders} retryingId={retryingId} onRetry={handleRetry} />
        </div>
      </div>
    </div>
  );
};
