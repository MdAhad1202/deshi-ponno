
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminJwtGuard } from './admin-jwt.guard';

@Global()
@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    AuthService,
    AdminJwtGuard,
  ],
  exports: [
    AdminJwtGuard,
    JwtModule,
  ],
})
export class AuthModule {}
