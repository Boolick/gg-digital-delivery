import { createContext, useContext } from 'react';
import { ToastType } from './toast';

export interface ToastContextValue {
  showToast: (options: {
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
  }) => string;
  showError: (message: string, title?: string) => string;
  showSuccess: (message: string, title?: string) => string;
  showWarning: (message: string, title?: string) => string;
  showInfo: (message: string, title?: string) => string;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const defaultToastContext: ToastContextValue = {
  showToast: () => '',
  showError: () => '',
  showSuccess: () => '',
  showWarning: () => '',
  showInfo: () => '',
  dismissToast: () => {},
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  return context || defaultToastContext;
}
