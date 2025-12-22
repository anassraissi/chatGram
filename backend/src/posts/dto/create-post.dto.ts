import { IsString, IsOptional, IsArray, IsEnum, IsDateString, MaxLength, ValidateNested, IsUrl, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MediaDto {
  @IsUrl()
  url: string;

  @IsEnum(['image', 'video'])
  type: 'image' | 'video';

  @IsOptional()
  @IsUrl()
  thumbnail?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSize?: number;
}

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(2200)
  content?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  media?: MediaDto[];

  @IsOptional()
  @IsEnum(['public', 'followers', 'private'])
  visibility?: 'public' | 'followers' | 'private';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}

