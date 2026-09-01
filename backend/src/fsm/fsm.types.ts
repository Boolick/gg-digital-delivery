import { OrderStatus, FSM_TRANSITIONS, isValidFsmTransition } from '@gg/shared';

export type { OrderStatus };
export { FSM_TRANSITIONS, isValidFsmTransition };

export interface FsmTransitionRequest {
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  reason?: string;
}

export interface FsmTransitionResult {
  orderId: string;
  previousStatus: OrderStatus;
  currentStatus: OrderStatus;
  transitionedAt: string;
}
