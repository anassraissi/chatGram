import { Document, Types } from 'mongoose';
export type PostDocument = Post & Document;
export declare class Post {
    author: Types.ObjectId;
    content: string;
    media: {
        url: string;
        type: 'image' | 'video';
        thumbnail?: string;
        duration?: number;
        width?: number;
        height?: number;
        fileSize?: number;
    }[];
    visibility: string;
    likes: Types.ObjectId[];
    comments: {
        user: Types.ObjectId;
        content: string;
        likes: Types.ObjectId[];
        createdAt: Date;
    }[];
    stats: {
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        viewsCount: number;
        saveCount: number;
    };
    hashtags: string[];
    mentions: Types.ObjectId[];
    status: string;
    scheduledFor: Date;
    location: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PostSchema: import("mongoose").Schema<Post, import("mongoose").Model<Post, any, any, any, Document<unknown, any, Post, any, {}> & Post & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Post, Document<unknown, {}, import("mongoose").FlatRecord<Post>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Post> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
