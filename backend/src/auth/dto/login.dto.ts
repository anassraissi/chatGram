import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Email or username is required' })
  emailOrUsername: string;

  @IsString({ message: 'Password is required' })
  @MinLength(1, { message: 'Password is required' })
  password: string;
}