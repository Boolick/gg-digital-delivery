import React, { useState, useCallback, useEffect } from 'react';
import { Toast, ToastItem, ToastType, ToastContext } from '../../shared/ui/toast';
import { subscribeToGlobalErrors, ApiError } from '../../shared/api';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type,
      title,
      message,
      duration = 5000,
    }: {
      type: ToastType;
      title?: string;
      message: string;
      duration?: number;
    }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast],
  );

  const showError = useCallback(
    (message: string, title: string = 'Ошибка') => showToast({ type: 'error', title, message }),
    [showToast],
  );

  const showSuccess = useCallback(
    (message: string, title: string = 'Успешно') => showToast({ type: 'success', title, message }),
    [showToast],
  );

  const showWarning = useCallback(
    (message: string, title: string = 'Внимание') => showToast({ type: 'warning', title, message }),
    [showToast],
  );

  const showInfo = useCallback(
    (message: string, title: string = 'Информация') => showToast({ type: 'info', title, message }),
    [showToast],
  );

  // Subscribe to global API errors (500s, offline/network errors)
  useEffect(() => {
    const unsubscribe = subscribeToGlobalErrors((error: ApiError) => {
      showError(error.message, `Ошибка сервера (${error.statusCode || 'Сеть'})`);
    });
    return unsubscribe;
  }, [showError]);

  return (
    <ToastContext.Provider
      value={{ showToast, showError, showSuccess, showWarning, showInfo, dismissToast }}
    >
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
