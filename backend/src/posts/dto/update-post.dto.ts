import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(2200)
  content?: string;

  @IsOptional()
  @IsEnum(['public', 'followers', 'private'])
  visibility?: 'public' | 'followers' | 'private';

  @IsOptional()
  @IsString()
  location?: string;
}

