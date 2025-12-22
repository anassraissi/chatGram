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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const posts_service_1 = require("./posts.service");
const create_post_dto_1 = require("./dto/create-post.dto");
const update_post_dto_1 = require("./dto/update-post.dto");
const comment_dto_1 = require("./dto/comment.dto");
let PostsController = class PostsController {
    postsService;
    constructor(postsService) {
        this.postsService = postsService;
    }
    async createPost(req, createPostDto) {
        try {
            const post = await this.postsService.createPost(req.user.userId, createPostDto);
            const postData = this.postsService.toJSON(post, req.user.userId);
            return {
                success: true,
                message: 'Post created successfully',
                data: postData
            };
        }
        catch (error) {
            console.error('Error creating post:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to create post');
        }
    }
    async getFeed(req, page = 1, limit = 20) {
        try {
            const result = await this.postsService.getFeed(req.user.userId, Number(page), Number(limit));
            return {
                success: true,
                message: 'Feed retrieved successfully',
                data: result
            };
        }
        catch (error) {
            console.error('Error getting feed:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to get feed');
        }
    }
    async getPost(req, postId) {
        try {
            const post = await this.postsService.findById(postId, req.user.userId);
            const postData = this.postsService.toJSON(post, req.user.userId);
            return {
                success: true,
                message: 'Post retrieved successfully',
                data: postData
            };
        }
        catch (error) {
            console.error('Error getting post:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to get post');
        }
    }
    async getUserPosts(req, userId, page = 1, limit = 20) {
        try {
            const result = await this.postsService.getUserPosts(userId, req.user.userId, Number(page), Number(limit));
            return {
                success: true,
                message: 'User posts retrieved successfully',
                data: result
            };
        }
        catch (error) {
            console.error('Error getting user posts:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to get user posts');
        }
    }
    async updatePost(req, postId, updatePostDto) {
        try {
            const post = await this.postsService.updatePost(postId, req.user.userId, updatePostDto);
            const postData = this.postsService.toJSON(post, req.user.userId);
            return {
                success: true,
                message: 'Post updated successfully',
                data: postData
            };
        }
        catch (error) {
            console.error('Error updating post:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to update post');
        }
    }
    async deletePost(req, postId) {
        try {
            await this.postsService.deletePost(postId, req.user.userId);
            return {
                success: true,
                message: 'Post deleted successfully'
            };
        }
        catch (error) {
            console.error('Error deleting post:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to delete post');
        }
    }
    async toggleLike(req, postId) {
        try {
            const result = await this.postsService.toggleLike(postId, req.user.userId);
            return {
                success: true,
                message: result.message,
                data: result
            };
        }
        catch (error) {
            console.error('Error toggling like:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to toggle like');
        }
    }
    async addComment(req, postId, commentDto) {
        try {
            const result = await this.postsService.addComment(postId, req.user.userId, commentDto);
            return {
                success: true,
                message: result.message,
                data: result.comment
            };
        }
        catch (error) {
            console.error('Error adding comment:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to add comment');
        }
    }
    async toggleCommentLike(req, postId, commentIndex) {
        try {
            const result = await this.postsService.toggleCommentLike(postId, Number(commentIndex), req.user.userId);
            return {
                success: true,
                message: result.message,
                data: result
            };
        }
        catch (error) {
            console.error('Error toggling comment like:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to toggle comment like');
        }
    }
    async deleteComment(req, postId, commentIndex) {
        try {
            await this.postsService.deleteComment(postId, Number(commentIndex), req.user.userId);
            return {
                success: true,
                message: 'Comment deleted successfully'
            };
        }
        catch (error) {
            console.error('Error deleting comment:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to delete comment');
        }
    }
    async sharePost(req, postId) {
        try {
            await this.postsService.sharePost(postId, req.user.userId);
            return {
                success: true,
                message: 'Post shared successfully'
            };
        }
        catch (error) {
            console.error('Error sharing post:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to share post');
        }
    }
    async toggleSave(req, postId) {
        try {
            const result = await this.postsService.toggleSave(postId, req.user.userId);
            return {
                success: true,
                message: result.message,
                data: result
            };
        }
        catch (error) {
            console.error('Error toggling save:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to toggle save');
        }
    }
    async getPostsByHashtag(hashtag, page = 1, limit = 20) {
        try {
            const result = await this.postsService.getPostsByHashtag(hashtag, Number(page), Number(limit));
            return {
                success: true,
                message: 'Hashtag posts retrieved successfully',
                data: result
            };
        }
        catch (error) {
            console.error('Error getting hashtag posts:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to get hashtag posts');
        }
    }
    async getTrendingHashtags(limit = 10) {
        try {
            const hashtags = await this.postsService.getTrendingHashtags(Number(limit));
            return {
                success: true,
                message: 'Trending hashtags retrieved successfully',
                data: hashtags
            };
        }
        catch (error) {
            console.error('Error getting trending hashtags:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to get trending hashtags');
        }
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_post_dto_1.CreatePostDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "createPost", null);
__decorate([
    (0, common_1.Get)('feed'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getFeed", null);
__decorate([
    (0, common_1.Get)(':postId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getPost", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getUserPosts", null);
__decorate([
    (0, common_1.Put)(':postId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('postId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_post_dto_1.UpdatePostDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "updatePost", null);
__decorate([
    (0, common_1.Delete)(':postId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "deletePost", null);
__decorate([
    (0, common_1.Post)(':postId/like'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "toggleLike", null);
__decorate([
    (0, common_1.Post)(':postId/comments'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('postId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, comment_dto_1.CreateCommentDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "addComment", null);
__decorate([
    (0, common_1.Post)(':postId/comments/:commentIndex/like'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('postId')),
    __param(2, (0, common_1.Param)('commentIndex')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "toggleCommentLike", null);
__decorate([
    (0, common_1.Delete)(':postId/comments/:commentIndex'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('postId')),
    __param(2, (0, common_1.Param)('commentIndex')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "deleteComment", null);
__decorate([
    (0, common_1.Post)(':postId/share'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "sharePost", null);
__decorate([
    (0, common_1.Post)(':postId/save'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "toggleSave", null);
__decorate([
    (0, common_1.Get)('hashtag/:hashtag'),
    __param(0, (0, common_1.Param)('hashtag')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getPostsByHashtag", null);
__decorate([
    (0, common_1.Get)('hashtags/trending'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getTrendingHashtags", null);
exports.PostsController = PostsController = __decorate([
    (0, common_1.Controller)('posts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsController);
//# sourceMappingURL=posts.controller.js.map