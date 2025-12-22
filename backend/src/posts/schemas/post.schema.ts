import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  })
  author: Types.ObjectId;

  @Prop({ 
    type: String,
    required: false,
    maxlength: 2200,
    trim: true
  })
  content: string;

  @Prop([{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    thumbnail: { type: String }, // For video thumbnails
    duration: { type: Number }, // Video duration in seconds
    width: { type: Number },
    height: { type: Number },
    fileSize: { type: Number } // in bytes
  }])
  media: {
    url: string;
    type: 'image' | 'video';
    thumbnail?: string;
    duration?: number;
    width?: number;
    height?: number;
    fileSize?: number;
  }[];

  @Prop({ 
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  })
  visibility: string;

  @Prop([{ 
    type: Types.ObjectId, 
    ref: 'User' 
  }])
  likes: Types.ObjectId[];

  @Prop([{
    user: { type: Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 500 },
    likes: [{ type: Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
  }])
  comments: {
    user: Types.ObjectId;
    content: string;
    likes: Types.ObjectId[];
    createdAt: Date;
  }[];

  @Prop({
    type: {
      likesCount: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
      sharesCount: { type: Number, default: 0 },
      viewsCount: { type: Number, default: 0 },
      saveCount: { type: Number, default: 0 }
    },
    _id: false
  })
  stats: {
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    viewsCount: number;
    saveCount: number;
  };

  @Prop([{ 
    type: String,
    trim: true,
    lowercase: true
  }])
  hashtags: string[];

  @Prop([{ 
    type: Types.ObjectId, 
    ref: 'User' 
  }])
  mentions: Types.ObjectId[];

  @Prop({ 
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  })
  status: string;

  @Prop({ type: Date })
  scheduledFor: Date; // For scheduled posts

  @Prop({ type: String })
  location: string;

  // Automatically added by timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Indexes for performance
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ hashtags: 1 });
PostSchema.index({ 'stats.likesCount': -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ status: 1 });
PostSchema.index({ visibility: 1, status: 1 });

