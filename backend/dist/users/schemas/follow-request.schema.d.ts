import { Document, Types } from 'mongoose';
export type FollowRequestDocument = FollowRequest & Document;
export declare class FollowRequest {
    requester: Types.ObjectId;
    targetUser: Types.ObjectId;
    status: string;
    respondedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FollowRequestSchema: import("mongoose").Schema<FollowRequest, import("mongoose").Model<FollowRequest, any, any, any, Document<unknown, any, FollowRequest, any, {}> & FollowRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, FollowRequest, Document<unknown, {}, import("mongoose").FlatRecord<FollowRequest>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<FollowRequest> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
