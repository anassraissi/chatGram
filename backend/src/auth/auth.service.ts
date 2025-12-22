import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException,
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password, name, bio, website, gender, location } = registerDto;

    console.log('🔄 Registering user:', { email, username });

    try {
      const user = await this.usersService.create({
        email,
        username,
        password,
        profile: {
          name: name || '',
          bio: bio || '',
          avatar: '',
          website: website || '',
          gender: gender || 'prefer-not-to-say',
          location: location || '',
          coverImage: ''
        }
      });

      // Fix: Use the returned user object directly
      const userId = (user as any)._id?.toString();
      if (userId) {
        await this.usersService.updateLastLogin(userId);
      }

      const token = this.generateToken(user);
      const userData = this.usersService.toJSON(user);

      console.log('✅ User registered successfully:', user.username);

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: userData,
          token
        }
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { emailOrUsername, password } = loginDto;

    console.log('🔄 Login attempt for:', emailOrUsername);

    if (!emailOrUsername || !password) {
      throw new BadRequestException('Email/username and password are required');
    }

    try {
      let user;
      try {
        user = await this.usersService.findByEmailOrUsername(emailOrUsername);
      } catch (dbError) {
        console.error('❌ Database error during login:', dbError);
        if (dbError.message && dbError.message.includes('connection')) {
          throw new InternalServerErrorException('Database connection failed. Please check if MongoDB is running.');
        }
        throw dbError;
      }
      
      if (!user) {
        console.log('❌ Login failed: User not found');
        throw new UnauthorizedException('Invalid credentials');
      }

      // Debug: Check if password field is present
      console.log('🔍 User found:', {
        username: user.username,
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        passwordPrefix: user.password ? user.password.substring(0, 10) : 'N/A'
      });

      // FIX: Use the service method for password validation instead of instance method
      const isPasswordValid = await this.usersService.validatePassword(user, password);
      console.log('🔍 Password validation result:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('❌ Login failed: Invalid password');
        throw new UnauthorizedException('Invalid credentials');
      }

      // Fix: Use the returned user object directly
      const userId = (user as any)._id?.toString();
      if (userId) {
        await this.usersService.updateLastLogin(userId);
      }

      const token = this.generateToken(user);
      const userData = this.usersService.toJSON(user);

      console.log('✅ Login successful:', user.username);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          token
        }
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  private generateToken(user: any): string {
    const payload = {
      username: user.username,
      sub: (user as any)._id?.toString() || user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }
}