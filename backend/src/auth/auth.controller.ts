
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AdminJwtGuard } from './admin-jwt.guard';

@Controller('auth')
export class AuthController {
  private readonly attempts = new Map<
    string,
    { count: number; expiresAt: number }
  >();

  constructor(private readonly authService: AuthService) {}

  private checkOrigin(request: Request) {
    const allowed =
      process.env.ADMIN_ALLOWED_ORIGIN ||
      'https://deshi.moududibd.cloud';

    if (request.headers.origin !== allowed) {
      throw new ForbiddenException('Invalid request origin');
    }
  }

  private clientIp(request: Request): string {
    const realIp = request.headers['x-real-ip'];

    return typeof realIp === 'string'
      ? realIp
      : request.ip || 'unknown';
  }

  @Post('login')
  async login(
    @Body() body: { username?: unknown; password?: unknown },
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.checkOrigin(request);

    const ip = this.clientIp(request);
    const now = Date.now();
    const existing = this.attempts.get(ip);

    if (existing && existing.expiresAt <= now) {
      this.attempts.delete(ip);
    }

    const attempt = this.attempts.get(ip);

    if (attempt && attempt.count >= 5) {
      throw new HttpException(
        'Too many login attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const username = body?.username;
    const password = body?.password;

    try {
      if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        !username ||
        !password ||
        username.length > 100 ||
        password.length > 128
      ) {
        throw new UnauthorizedException(
          'Invalid username or password',
        );
      }

      const token = await this.authService.login(
        username,
        password,
      );

      this.attempts.delete(ip);

      response.cookie('deshi_admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api',
        maxAge: 2 * 60 * 60 * 1000,
      });

      return {
        success: true,
        username,
        expiresIn: 7200,
      };
    } catch (error) {
      this.attempts.set(ip, {
        count: (attempt?.count || 0) + 1,
        expiresAt: attempt?.expiresAt || now + 15 * 60 * 1000,
      });

      throw error;
    }
  }

  @UseGuards(AdminJwtGuard)
  @Get('me')
  me() {
    return {
      authenticated: true,
      username: process.env.ADMIN_USERNAME,
      role: 'admin',
    };
  }

  @UseGuards(AdminJwtGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('deshi_admin_token', {
      path: '/api',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
