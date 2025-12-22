"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
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
            const userId = user._id?.toString();
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
        }
        catch (error) {
            console.error('❌ Registration error:', error);
            throw error;
        }
    }
    async login(loginDto) {
        const { emailOrUsername, password } = loginDto;
        console.log('🔄 Login attempt for:', emailOrUsername);
        if (!emailOrUsername || !password) {
            throw new common_1.BadRequestException('Email/username and password are required');
        }
        try {
            let user;
            try {
                user = await this.usersService.findByEmailOrUsername(emailOrUsername);
            }
            catch (dbError) {
                console.error('❌ Database error during login:', dbError);
                if (dbError.message && dbError.message.includes('connection')) {
                    throw new common_1.InternalServerErrorException('Database connection failed. Please check if MongoDB is running.');
                }
                throw dbError;
            }
            if (!user) {
                console.log('❌ Login failed: User not found');
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            console.log('🔍 User found:', {
                username: user.username,
                email: user.email,
                hasPassword: !!user.password,
                passwordLength: user.password ? user.password.length : 0,
                passwordPrefix: user.password ? user.password.substring(0, 10) : 'N/A'
            });
            const isPasswordValid = await this.usersService.validatePassword(user, password);
            console.log('🔍 Password validation result:', isPasswordValid);
            if (!isPasswordValid) {
                console.log('❌ Login failed: Invalid password');
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const userId = user._id?.toString();
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
        }
        catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    }
    generateToken(user) {
        const payload = {
            username: user.username,
            sub: user._id?.toString() || user.id,
            email: user.email,
        };
        return this.jwtService.sign(payload);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map