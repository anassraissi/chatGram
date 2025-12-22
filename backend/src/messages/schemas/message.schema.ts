import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiver!: Types.ObjectId;

  @Prop({ type: String, default: '' })
  content!: string;

  @Prop({ type: Array, default: [] })
  attachments?: any[];

  @Prop({ type: Boolean, default: false })
  read?: boolean;

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ type: String, default: 'active' })
  status!: string;
}

export type MessageDocument = Message & Document;

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for efficient queries
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
