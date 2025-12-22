import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
@UsePipes(new ValidationPipe({ 
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true 
}))
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Health check endpoint
  @Post('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    return {
      success: true,
      message: 'Authentication service is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}