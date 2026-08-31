import { OrderStatus } from './contracts.js';

/**
 * Strict transition matrix for Order State Machine (FSM).
 * Any transition not explicitly listed is forbidden and must throw an error.
 */
export const ORDER_TRANSITION_MATRIX: Record<OrderStatus, readonly OrderStatus[]> = {
  created: ['paid', 'payment_failed'],
  paid: ['delivering'],
  delivering: ['delivered', 'out_of_stock', 'delivery_failed'],
  delivered: [], // Final terminal state
  payment_failed: [], // Final terminal state
  out_of_stock: ['delivering'], // Recoverable state -> retry delivery
  delivery_failed: ['delivering'], // Recoverable state -> retry delivery
} as const;

/**
 * Helper to check whether a transition between states is permitted.
 */
export function isValidOrderTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  const allowed = ORDER_TRANSITION_MATRIX[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}

export const PROVIDERS = {
  PROVIDER_A: 'PROVIDER_A',
  PROVIDER_B: 'PROVIDER_B_FALLBACK',
} as const;

export const DEFAULT_CURRENCY = 'RUB' as const;
