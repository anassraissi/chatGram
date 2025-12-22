import { Document, Types } from 'mongoose';
export declare class Message {
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    content: string;
    attachments?: any[];
    read?: boolean;
    readAt?: Date;
    status: string;
}
export type MessageDocument = Message & Document;
export declare const MessageSchema: import("mongoose").Schema<Message, import("mongoose").Model<Message, any, any, any, Document<unknown, any, Message, any, {}> & Message & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Message, Document<unknown, {}, import("mongoose").FlatRecord<Message>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Message> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
