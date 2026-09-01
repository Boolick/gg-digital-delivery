import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import { Request } from 'express';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  private readonly logger = new Logger(AdminAuthGuard.name);

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Admin access rejected: Missing or invalid Authorization header');
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7).trim();
    const expectedSecret = process.env['ADMIN_SECRET'] || 'test-admin-secret-2026';

    const tokenBuf = Buffer.from(token, 'utf8');
    const secretBuf = Buffer.from(expectedSecret, 'utf8');

    if (tokenBuf.length !== secretBuf.length || !crypto.timingSafeEqual(tokenBuf, secretBuf)) {
      this.logger.warn('Admin access rejected: Invalid admin secret token');
      throw new UnauthorizedException('Unauthorized admin access');
    }

    return true;
  }
}
