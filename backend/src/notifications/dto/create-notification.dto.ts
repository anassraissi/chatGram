import { IsEnum, IsString, IsOptional, IsMongoId } from 'class-validator';
import { NotificationType } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @IsMongoId()
  recipient: string;

  @IsMongoId()
  actor: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsMongoId()
  post?: string;

  @IsOptional()
  @IsMongoId()
  targetUser?: string;

  @IsOptional()
  @IsMongoId()
  commentId?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  metadata?: {
    title: string;
    body: string;
    image?: string;
    link?: string;
  };
}


