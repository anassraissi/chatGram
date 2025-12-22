import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    console.log('🛡️ JWT Guard - Checking authentication');
    
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('🛡️ JWT Guard - Handle Request');
    console.log('Error:', err);
    console.log('User:', user ? 'Authenticated' : 'Not authenticated');
    console.log('Info:', info?.message);
    
    if (err || !user) {
      console.log('❌ JWT Guard - Authentication failed');
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    
    console.log('✅ JWT Guard - Authentication successful');
    return user;
  }
}