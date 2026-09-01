import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus, isValidFsmTransition, FSM_TRANSITIONS } from '@gg/shared';
import { InvalidStateTransitionException } from './fsm.exceptions.js';
import { FsmTransitionResult } from './fsm.types.js';

@Injectable()
export class OrderFsmService {
  private readonly logger = new Logger(OrderFsmService.name);

  public canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return isValidFsmTransition(from, to);
  }

  public getAllowedTransitions(from: OrderStatus): readonly OrderStatus[] {
    return FSM_TRANSITIONS[from] ?? [];
  }

  public transition(from: OrderStatus, to: OrderStatus, orderId?: string): FsmTransitionResult {
    if (!this.canTransition(from, to)) {
      this.logger.warn(`Rejected invalid FSM jump: ${from} -> ${to} (orderId=${orderId})`);
      throw new InvalidStateTransitionException(from, to, orderId);
    }

    const now = new Date().toISOString();
    this.logger.log(`FSM transition: ${from} -> ${to} for order ${orderId || 'unknown'}`);
    return {
      orderId: orderId || 'unknown',
      previousStatus: from,
      currentStatus: to,
      transitionedAt: now,
    };
  }
}
