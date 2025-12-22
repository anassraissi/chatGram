import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type UserDocument = User & Document;

@Schema({ 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    versionKey: false,
  }
})
export class User {
  @Prop({ 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  })
  email: string;

  @Prop({ 
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  })
  username: string;

  @Prop({ 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  })
  password: string;

  @Prop({
    type: {
      name: { 
        type: String, 
        default: '',
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
      },
      bio: { 
        type: String, 
        default: '',
        maxlength: [150, 'Bio cannot exceed 150 characters']
      },
      avatar: { 
        type: String, 
        default: ''
      },
      website: { 
        type: String, 
        default: '',
        match: [/^https?:\/\/.+\..+$/, 'Please enter a valid website URL']
      },
      gender: { 
        type: String, 
        enum: ['male', 'female', 'other', 'prefer-not-to-say'],
        default: 'prefer-not-to-say'
      },
      location: { 
        type: String, 
        default: '',
        maxlength: [50, 'Location cannot exceed 50 characters']
      },
      coverImage: { 
        type: String, 
        default: ''
      }
    },
    _id: false
  })
  profile: {
    name: string;
    bio: string;
    avatar: string;
    website: string;
    gender: string;
    location: string;
    coverImage: string;
  };

  @Prop({
    type: {
      postsCount: { type: Number, default: 0 },
      followersCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
      likesCount: { type: Number, default: 0 }
    },
    _id: false
  })
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    likesCount: number;
  };

  @Prop({
    type: {
      isEmailVerified: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true },
      lastLogin: { type: Date, default: null },
      role: { 
        type: String, 
        enum: ['user', 'admin', 'moderator'], 
        default: 'user' 
      }
    },
    _id: false
  })
  account: {
    isEmailVerified: boolean;
    isActive: boolean;
    lastLogin: Date | null;
    role: string;
  };

  @Prop([{ 
    type: Types.ObjectId, 
    ref: 'User'
  }])
  following: Types.ObjectId[];

  @Prop([{ 
    type: Types.ObjectId, 
    ref: 'User'
  }])
  followers: Types.ObjectId[];

  @Prop({ 
    default: false 
  })
  isPrivate: boolean;

  // These are automatically added by timestamps: true
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Remove duplicate indexes - the unique: true in @Prop already creates them
// UserSchema.index({ email: 1 }, { unique: true }); // REMOVE - duplicate
// UserSchema.index({ username: 1 }, { unique: true }); // REMOVE - duplicate

// Keep only non-duplicate indexes
UserSchema.index({ 'profile.name': 'text', username: 'text' });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Keep only ONE comparePassword method (schema method)
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};