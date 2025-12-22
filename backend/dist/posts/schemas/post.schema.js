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
exports.PostSchema = exports.Post = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Post = class Post {
    author;
    content;
    media;
    visibility;
    likes;
    comments;
    stats;
    hashtags;
    mentions;
    status;
    scheduledFor;
    location;
    createdAt;
    updatedAt;
};
exports.Post = Post;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Post.prototype, "author", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        required: false,
        maxlength: 2200,
        trim: true
    }),
    __metadata("design:type", String)
], Post.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)([{
            url: { type: String, required: true },
            type: { type: String, enum: ['image', 'video'], required: true },
            thumbnail: { type: String },
            duration: { type: Number },
            width: { type: Number },
            height: { type: Number },
            fileSize: { type: Number }
        }]),
    __metadata("design:type", Array)
], Post.prototype, "media", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['public', 'followers', 'private'],
        default: 'public'
    }),
    __metadata("design:type", String)
], Post.prototype, "visibility", void 0);
__decorate([
    (0, mongoose_1.Prop)([{
            type: mongoose_2.Types.ObjectId,
            ref: 'User'
        }]),
    __metadata("design:type", Array)
], Post.prototype, "likes", void 0);
__decorate([
    (0, mongoose_1.Prop)([{
            user: { type: mongoose_2.Types.ObjectId, ref: 'User', required: true },
            content: { type: String, required: true, maxlength: 500 },
            likes: [{ type: mongoose_2.Types.ObjectId, ref: 'User' }],
            createdAt: { type: Date, default: Date.now }
        }]),
    __metadata("design:type", Array)
], Post.prototype, "comments", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            likesCount: { type: Number, default: 0 },
            commentsCount: { type: Number, default: 0 },
            sharesCount: { type: Number, default: 0 },
            viewsCount: { type: Number, default: 0 },
            saveCount: { type: Number, default: 0 }
        },
        _id: false
    }),
    __metadata("design:type", Object)
], Post.prototype, "stats", void 0);
__decorate([
    (0, mongoose_1.Prop)([{
            type: String,
            trim: true,
            lowercase: true
        }]),
    __metadata("design:type", Array)
], Post.prototype, "hashtags", void 0);
__decorate([
    (0, mongoose_1.Prop)([{
            type: mongoose_2.Types.ObjectId,
            ref: 'User'
        }]),
    __metadata("design:type", Array)
], Post.prototype, "mentions", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['active', 'archived', 'deleted'],
        default: 'active'
    }),
    __metadata("design:type", String)
], Post.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Post.prototype, "scheduledFor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Post.prototype, "location", void 0);
exports.Post = Post = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Post);
exports.PostSchema = mongoose_1.SchemaFactory.createForClass(Post);
exports.PostSchema.index({ author: 1, createdAt: -1 });
exports.PostSchema.index({ hashtags: 1 });
exports.PostSchema.index({ 'stats.likesCount': -1 });
exports.PostSchema.index({ createdAt: -1 });
exports.PostSchema.index({ status: 1 });
exports.PostSchema.index({ visibility: 1, status: 1 });
//# sourceMappingURL=post.schema.js.map