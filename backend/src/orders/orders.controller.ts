import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, UsePipes } from '@nestjs/common';
import {
  CreateOrderRequest,
  CreateOrderRequestSchema,
  CreateOrderResponse,
  GetOrderStatusResponse,
} from '@gg/shared';
import { OrdersService } from './orders.service.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateOrderRequestSchema))
  public async createOrder(@Body() body: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.ordersService.createOrder(body);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  public async getOrder(@Param('id') id: string): Promise<GetOrderStatusResponse> {
    return this.ordersService.getOrderStatus(id);
  }
}
