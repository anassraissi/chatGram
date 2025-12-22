import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    
    console.log('🔐 JWT Strategy initialized');
  }

  async validate(payload: any) {
    console.log('🔐 JWT Validation - Payload received:', {
      userId: payload.sub,
      username: payload.username,
      email: payload.email
    });
    
    if (!payload.sub) {
      console.log('❌ JWT Validation Failed - Missing user ID');
      throw new UnauthorizedException('Invalid token: missing user ID');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      console.log('❌ JWT Validation Failed - User not found in database');
      throw new UnauthorizedException('User not found');
    }

    console.log('✅ JWT Validation Successful - User:', user.username);
    
    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
    };
  }
}