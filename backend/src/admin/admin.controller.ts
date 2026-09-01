import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import {
  AdminRestockKeysRequest,
  AdminRestockKeysRequestSchema,
  AdminRestockKeysResponse,
  AdminRetryDeliveryResponse,
  AdminOrderListItem,
} from '@gg/shared';
import { AdminService } from './admin.service.js';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@Controller('api/admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('keys/restock')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(AdminRestockKeysRequestSchema))
  public async restockKeys(
    @Body() body: AdminRestockKeysRequest,
  ): Promise<AdminRestockKeysResponse> {
    return this.adminService.restockKeys(body);
  }

  @Post('orders/:id/retry-delivery')
  @HttpCode(HttpStatus.OK)
  public async retryDelivery(@Param('id') id: string): Promise<AdminRetryDeliveryResponse> {
    return this.adminService.retryDelivery(id);
  }

  @Get('orders')
  @HttpCode(HttpStatus.OK)
  public async listOrders(): Promise<AdminOrderListItem[]> {
    return this.adminService.listProblematicOrders();
  }
}
