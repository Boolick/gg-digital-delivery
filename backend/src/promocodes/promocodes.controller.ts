import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes } from '@nestjs/common';
import {
  ValidatePromocodeRequest,
  ValidatePromocodeRequestSchema,
  ValidatePromocodeResponse,
} from '@gg/shared';
import { PromocodesService } from './promocodes.service.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@Controller('api/promocodes')
export class PromocodesController {
  constructor(private readonly promocodesService: PromocodesService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(ValidatePromocodeRequestSchema))
  public async validate(
    @Body() body: ValidatePromocodeRequest,
  ): Promise<ValidatePromocodeResponse> {
    return this.promocodesService.validatePromocode(body);
  }
}
