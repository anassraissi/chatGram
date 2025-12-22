import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(20, { message: 'Username cannot exceed 20 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: 'Username can only contain letters, numbers and underscores' 
  })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Name cannot exceed 50 characters' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150, { message: 'Bio cannot exceed 150 characters' })
  bio?: string;

  @IsString()
  @IsOptional()
  @Matches(/^https?:\/\/.+\..+$/, { 
    message: 'Please provide a valid website URL' 
  })
  website?: string;

  @IsEnum(['male', 'female', 'other', 'prefer-not-to-say'], {
    message: 'Gender must be one of: male, female, other, prefer-not-to-say'
  })
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Location cannot exceed 50 characters' })
  location?: string;
}