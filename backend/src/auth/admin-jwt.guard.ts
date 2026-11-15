
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

interface AdminPayload {
  sub: string;
  role: string;
}

@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Protect state-changing requests against cross-origin requests.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const allowedOrigin =
        process.env.ADMIN_ALLOWED_ORIGIN ||
        'https://deshi.moududibd.cloud';

      if (request.headers.origin !== allowedOrigin) {
        throw new ForbiddenException(
          'Invalid request origin',
        );
      }
    }

    const token = request.cookies?.deshi_admin_token;

    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException(
        'Admin login required',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AdminPayload>(
          token,
          {
            secret: process.env.JWT_SECRET,
            algorithms: ['HS256'],
          },
        );

      if (
        payload.role !== 'admin' ||
        payload.sub !== process.env.ADMIN_USERNAME
      ) {
        throw new UnauthorizedException();
      }

      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired admin session',
      );
    }
  }
}
