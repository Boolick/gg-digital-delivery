import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string | undefined;
  message: string;
  duration?: number | undefined;
}

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const { id, type, title, message } = toast;

  const bgStyles: Record<ToastType, string> = {
    error: 'bg-rose-50 border-rose-200 text-rose-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const iconStyles: Record<ToastType, React.ReactNode> = {
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-md w-full transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${bgStyles[type]}`}
    >
      {iconStyles[type]}
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-semibold text-sm mb-0.5">{title}</h5>}
        <p className="text-xs leading-relaxed opacity-90">{message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Закрыть уведомление"
        className="p-1 rounded-lg hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
