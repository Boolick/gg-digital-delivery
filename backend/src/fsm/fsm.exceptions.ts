import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@gg/shared';

export class InvalidStateTransitionException extends BadRequestException {
  public readonly orderId: string | undefined;
  public readonly fromStatus: OrderStatus;
  public readonly toStatus: OrderStatus;

  constructor(fromStatus: OrderStatus, toStatus: OrderStatus, orderId?: string) {
    const msg = orderId
      ? `Invalid FSM transition for order '${orderId}': '${fromStatus}' -> '${toStatus}'`
      : `Invalid FSM transition: '${fromStatus}' -> '${toStatus}'`;
    super(msg);
    this.orderId = orderId;
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
  }
}
