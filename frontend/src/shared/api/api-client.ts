import { z } from 'zod';

export interface ApiErrorDetail {
  path?: string | undefined;
  field?: string | undefined;
  message: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly details?: ApiErrorDetail[] | undefined;
  public readonly raw?: unknown;

  constructor(
    statusCode: number,
    error: string,
    message: string,
    details?: ApiErrorDetail[] | undefined,
    raw?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
    this.raw = raw;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Helper to get a field-specific error message if available
   */
  public getFieldError(field: string): string | undefined {
    return this.details?.find((d) => (d.field || d.path) === field)?.message;
  }
}

type GlobalErrorListener = (error: ApiError) => void;
const globalErrorListeners = new Set<GlobalErrorListener>();

export function subscribeToGlobalErrors(listener: GlobalErrorListener): () => void {
  globalErrorListeners.add(listener);
  return () => {
    globalErrorListeners.delete(listener);
  };
}

function notifyGlobalError(error: ApiError): void {
  // Only trigger global toasts/alerts for 5xx server errors or network disconnects
  if (error.statusCode >= 500 || error.statusCode === 0) {
    globalErrorListeners.forEach((fn) => fn(error));
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipGlobalError?: boolean;
}

async function request<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  options?: RequestOptions,
  schema?: z.ZodType<T>,
): Promise<T> {
  const { body, headers, skipGlobalError, ...customConfig } = options || {};

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...customConfig,
  };

  if (body !== undefined) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, config);
  } catch (networkError) {
    const err = new ApiError(
      0,
      'Network Error',
      'Не удалось подключиться к серверу. Проверьте соединение с интернетом.',
      undefined,
      networkError,
    );
    if (!skipGlobalError) {
      notifyGlobalError(err);
    }
    throw err;
  }

  if (!res.ok) {
    let errorData: {
      statusCode?: number;
      error?: string;
      message?: string | string[];
      details?: ApiErrorDetail[];
    } = {};

    try {
      errorData = await res.json();
    } catch {
      // Body is not JSON
    }

    let message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message || res.statusText || 'Произошла ошибка при выполнении запроса';

    const status = errorData.statusCode || res.status;
    if (status >= 500 || message.toLowerCase().includes('internal server error')) {
      message = 'Сервис временно недоступен. Пожалуйста, попробуйте позже.';
    } else if (status === 404 && (message.startsWith('Cannot') || message === 'Not Found')) {
      message = 'Запрашиваемый ресурс не найден.';
    } else if (status === 401) {
      message = 'Ошибка авторизации. Проверьте токен доступа.';
    } else if (status === 409 && message.toLowerCase().includes('transition')) {
      message = 'Недопустимый переход статуса заказа.';
    }

    const err = new ApiError(
      status,
      errorData.error || res.statusText || 'HttpError',
      message,
      errorData.details,
      errorData,
    );

    if (!skipGlobalError) {
      notifyGlobalError(err);
    }

    throw err;
  }

  if (res.status === 204) {
    return {} as T;
  }

  const data = await res.json();
  if (schema) {
    return schema.parse(data);
  }
  return data as T;
}

export const apiClient = {
  get: <T>(url: string, schema?: z.ZodType<T>, options?: RequestOptions) =>
    request<T>(url, 'GET', options, schema),

  post: <T>(url: string, body?: unknown, schema?: z.ZodType<T>, options?: RequestOptions) =>
    request<T>(url, 'POST', { ...options, body }, schema),

  put: <T>(url: string, body?: unknown, schema?: z.ZodType<T>, options?: RequestOptions) =>
    request<T>(url, 'PUT', { ...options, body }, schema),

  patch: <T>(url: string, body?: unknown, schema?: z.ZodType<T>, options?: RequestOptions) =>
    request<T>(url, 'PATCH', { ...options, body }, schema),

  delete: <T>(url: string, schema?: z.ZodType<T>, options?: RequestOptions) =>
    request<T>(url, 'DELETE', options, schema),
};
