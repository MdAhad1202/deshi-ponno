
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly adminUsername: string;
  private readonly passwordHash: string;

  constructor(private readonly jwtService: JwtService) {
    const secret = process.env.JWT_SECRET;
    const username = process.env.ADMIN_USERNAME;
    const hash = process.env.ADMIN_PASSWORD_HASH;

    if (!secret || secret.length < 32 || !username || !hash) {
      throw new Error(
        'Missing JWT_SECRET, ADMIN_USERNAME or ADMIN_PASSWORD_HASH',
      );
    }

    this.jwtSecret = secret;
    this.adminUsername = username;
    this.passwordHash = hash;
  }

  async login(username: string, password: string) {
    const passwordMatches = await bcrypt.compare(
      password,
      this.passwordHash,
    );

    if (
      username !== this.adminUsername ||
      !passwordMatches
    ) {
      throw new UnauthorizedException(
        'Invalid username or password',
      );
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: this.adminUsername,
        role: 'admin',
      },
      {
        secret: this.jwtSecret,
        algorithm: 'HS256',
        expiresIn: '2h',
      },
    );

    return accessToken;
  }
}
