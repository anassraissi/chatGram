import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FollowRequestDocument = FollowRequest & Document;

@Schema({ timestamps: true })
export class FollowRequest {
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  requester: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  targetUser: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  })
  status: string;

  @Prop({ type: Date })
  respondedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const FollowRequestSchema = SchemaFactory.createForClass(FollowRequest);

// Compound index to ensure one pending request per user pair
FollowRequestSchema.index({ 
  requester: 1, 
  targetUser: 1, 
  status: 1 
}, { 
  unique: true,
  partialFilterExpression: { status: 'pending' }
});