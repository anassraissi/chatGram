import { Document, Types } from 'mongoose';
export type UserDocument = User & Document;
export declare class User {
    email: string;
    username: string;
    password: string;
    profile: {
        name: string;
        bio: string;
        avatar: string;
        website: string;
        gender: string;
        location: string;
        coverImage: string;
    };
    stats: {
        postsCount: number;
        followersCount: number;
        followingCount: number;
        likesCount: number;
    };
    account: {
        isEmailVerified: boolean;
        isActive: boolean;
        lastLogin: Date | null;
        role: string;
    };
    following: Types.ObjectId[];
    followers: Types.ObjectId[];
    isPrivate: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<User> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
