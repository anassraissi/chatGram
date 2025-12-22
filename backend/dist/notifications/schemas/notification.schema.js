"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSchema = exports.Notification = exports.NotificationType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var NotificationType;
(function (NotificationType) {
    NotificationType["LIKE"] = "like";
    NotificationType["COMMENT"] = "comment";
    NotificationType["COMMENT_LIKE"] = "comment_like";
    NotificationType["FOLLOW"] = "follow";
    NotificationType["FOLLOW_REQUEST"] = "follow_request";
    NotificationType["FOLLOW_REQUEST_ACCEPTED"] = "follow_request_accepted";
    NotificationType["MENTION"] = "mention";
    NotificationType["MESSAGE"] = "message";
    NotificationType["POST_SHARE"] = "post_share";
    NotificationType["POST_SAVE"] = "post_save";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
let Notification = class Notification {
    recipient;
    actor;
    type;
    post;
    targetUser;
    commentId;
    message;
    read;
    readAt;
    metadata;
    createdAt;
    updatedAt;
};
exports.Notification = Notification;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Notification.prototype, "recipient", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: 'User',
        required: true
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Notification.prototype, "actor", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: NotificationType,
        required: true,
        index: true
    }),
    __metadata("design:type", String)
], Notification.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: 'Post',
        required: false
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Notification.prototype, "post", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: 'User',
        required: false
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Notification.prototype, "targetUser", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        required: false
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Notification.prototype, "commentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        required: false
    }),
    __metadata("design:type", String)
], Notification.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Boolean,
        default: false,
        index: true
    }),
    __metadata("design:type", Boolean)
], Notification.prototype, "read", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Date
    }),
    __metadata("design:type", Date)
], Notification.prototype, "readAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            title: { type: String, required: true },
            body: { type: String, required: true },
            image: { type: String },
            link: { type: String }
        },
        _id: false,
        required: false
    }),
    __metadata("design:type", Object)
], Notification.prototype, "metadata", void 0);
exports.Notification = Notification = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Notification);
exports.NotificationSchema = mongoose_1.SchemaFactory.createForClass(Notification);
exports.NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
exports.NotificationSchema.index({ recipient: 1, createdAt: -1 });
exports.NotificationSchema.index({ type: 1, createdAt: -1 });
exports.NotificationSchema.index({ actor: 1, type: 1, recipient: 1 });
//# sourceMappingURL=notification.schema.js.map