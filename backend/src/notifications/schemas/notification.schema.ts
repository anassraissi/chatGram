import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  COMMENT_LIKE = 'comment_like',
  FOLLOW = 'follow',
  FOLLOW_REQUEST = 'follow_request',
  FOLLOW_REQUEST_ACCEPTED = 'follow_request_accepted',
  MENTION = 'mention',
  MESSAGE = 'message',
  POST_SHARE = 'post_share',
  POST_SAVE = 'post_save',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  })
  recipient: Types.ObjectId; // User who receives the notification

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  actor: Types.ObjectId; // User who performed the action

  @Prop({ 
    type: String, 
    enum: NotificationType, 
    required: true,
    index: true 
  })
  type: NotificationType;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Post',
    required: false 
  })
  post?: Types.ObjectId; // Related post (for likes, comments, etc.)

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User',
    required: false 
  })
  targetUser?: Types.ObjectId; // For follow notifications

  @Prop({ 
    type: Types.ObjectId,
    required: false 
  })
  commentId?: Types.ObjectId; // For comment-related notifications

  @Prop({ 
    type: String,
    required: false 
  })
  message?: string; // Custom message

  @Prop({ 
    type: Boolean, 
    default: false,
    index: true 
  })
  read: boolean;

  @Prop({ 
    type: Date 
  })
  readAt?: Date;

  @Prop({
    type: {
      title: { type: String, required: true },
      body: { type: String, required: true },
      image: { type: String },
      link: { type: String }
    },
    _id: false,
    required: false
  })
  metadata?: {
    title: string;
    body: string;
    image?: string;
    link?: string;
  };

  // Automatically added by timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for performance
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ actor: 1, type: 1, recipient: 1 }); // Prevent duplicate notifications


