import { Document, Types } from 'mongoose';
export type NotificationDocument = Notification & Document;
export declare enum NotificationType {
    LIKE = "like",
    COMMENT = "comment",
    COMMENT_LIKE = "comment_like",
    FOLLOW = "follow",
    FOLLOW_REQUEST = "follow_request",
    FOLLOW_REQUEST_ACCEPTED = "follow_request_accepted",
    MENTION = "mention",
    MESSAGE = "message",
    POST_SHARE = "post_share",
    POST_SAVE = "post_save"
}
export declare class Notification {
    recipient: Types.ObjectId;
    actor: Types.ObjectId;
    type: NotificationType;
    post?: Types.ObjectId;
    targetUser?: Types.ObjectId;
    commentId?: Types.ObjectId;
    message?: string;
    read: boolean;
    readAt?: Date;
    metadata?: {
        title: string;
        body: string;
        image?: string;
        link?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const NotificationSchema: import("mongoose").Schema<Notification, import("mongoose").Model<Notification, any, any, any, Document<unknown, any, Notification, any, {}> & Notification & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Notification, Document<unknown, {}, import("mongoose").FlatRecord<Notification>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Notification> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
