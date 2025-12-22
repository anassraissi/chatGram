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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const post_schema_1 = require("./schemas/post.schema");
const users_service_1 = require("../users/users.service");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
let PostsService = class PostsService {
    postModel;
    usersService;
    notificationsService;
    constructor(postModel, usersService, notificationsService) {
        this.postModel = postModel;
        this.usersService = usersService;
        this.notificationsService = notificationsService;
    }
    extractHashtags(content) {
        if (!content)
            return [];
        const hashtagRegex = /#(\w+)/g;
        const matches = content.match(hashtagRegex);
        return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
    }
    async extractMentions(content) {
        if (!content)
            return [];
        const mentionRegex = /@(\w+)/g;
        const matches = content.match(mentionRegex);
        if (!matches)
            return [];
        const usernames = matches.map(m => m.substring(1).toLowerCase());
        const users = await Promise.all(usernames.map(username => this.usersService.findByUsername(username)));
        return users
            .filter(user => user !== null)
            .map(user => new mongoose_2.Types.ObjectId(user._id));
    }
    async createPost(userId, createPostDto) {
        try {
            const hashtags = createPostDto.hashtags ||
                (createPostDto.content ? this.extractHashtags(createPostDto.content) : []);
            const mentions = createPostDto.mentions
                ? createPostDto.mentions.map(m => new mongoose_2.Types.ObjectId(m))
                : await this.extractMentions(createPostDto.content || '');
            const post = new this.postModel({
                author: new mongoose_2.Types.ObjectId(userId),
                content: createPostDto.content?.trim() || '',
                media: createPostDto.media || [],
                visibility: createPostDto.visibility || 'public',
                hashtags: [...new Set(hashtags)],
                mentions,
                location: createPostDto.location,
                scheduledFor: createPostDto.scheduledFor ? new Date(createPostDto.scheduledFor) : undefined,
                stats: {
                    likesCount: 0,
                    commentsCount: 0,
                    sharesCount: 0,
                    viewsCount: 0,
                    saveCount: 0
                },
                status: createPostDto.scheduledFor ? 'active' : 'active'
            });
            const savedPost = await post.save();
            if (this.notificationsService && mentions.length > 0) {
                for (const mentionId of mentions) {
                    if (mentionId.toString() !== userId) {
                        await this.notificationsService.createNotification(mentionId.toString(), userId, notification_schema_1.NotificationType.MENTION, { postId: savedPost._id.toString() });
                    }
                }
            }
            return savedPost;
        }
        catch (error) {
            console.error('Error creating post:', error);
            throw new common_1.InternalServerErrorException('Failed to create post');
        }
    }
    async findById(postId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID');
        }
        const post = await this.postModel
            .findById(postId)
            .populate('author', 'username profile.name profile.avatar isPrivate')
            .populate('likes', 'username profile.name profile.avatar')
            .populate('comments.user', 'username profile.name profile.avatar')
            .populate('mentions', 'username profile.name profile.avatar')
            .exec();
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (post.status !== 'active') {
            throw new common_1.NotFoundException('Post not found');
        }
        if (userId && userId !== post.author.toString()) {
            await this.postModel.findByIdAndUpdate(postId, {
                $inc: { 'stats.viewsCount': 1 }
            });
        }
        return post;
    }
    async getUserPosts(userId, currentUserId, page = 1, limit = 20) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const query = {
            author: new mongoose_2.Types.ObjectId(userId),
            status: 'active'
        };
        if (currentUserId && currentUserId !== userId) {
            const user = await this.usersService.findById(userId);
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            if (user.isPrivate) {
                try {
                    const relationship = await this.usersService.getRelationship(currentUserId, userId);
                    if (!relationship.isFollowing) {
                        query.visibility = 'public';
                    }
                }
                catch (error) {
                    query.visibility = 'public';
                }
            }
        }
        const posts = await this.postModel
            .find(query)
            .populate('author', 'username profile.name profile.avatar isPrivate')
            .populate('comments.user', 'username profile.name profile.avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
        const total = await this.postModel.countDocuments(query);
        return {
            posts: posts.map(post => this.toJSON(post, currentUserId)),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalPosts: total,
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        };
    }
    async getFeed(userId, page = 1, limit = 20) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const followingIds = user.following.map(id => new mongoose_2.Types.ObjectId(id));
        const feedUserIds = [...followingIds, new mongoose_2.Types.ObjectId(userId)];
        const posts = await this.postModel
            .find({
            author: { $in: feedUserIds },
            status: 'active',
            $or: [
                { visibility: 'public' },
                { visibility: 'followers', author: { $in: feedUserIds } }
            ]
        })
            .populate('author', 'username profile.name profile.avatar isPrivate')
            .populate('comments.user', 'username profile.name profile.avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
        const total = await this.postModel.countDocuments({
            author: { $in: feedUserIds },
            status: 'active'
        });
        return {
            posts: posts.map(post => this.toJSON(post, userId)),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalPosts: total,
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        };
    }
    async toggleLike(postId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID');
        }
        const post = await this.postModel.findById(postId);
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const isLiked = post.likes.some(likeId => likeId.toString() === userId);
        if (isLiked) {
            await this.postModel.findByIdAndUpdate(postId, {
                $pull: { likes: userObjectId },
                $inc: { 'stats.likesCount': -1 }
            });
            return { liked: false, message: 'Post unliked' };
        }
        else {
            await this.postModel.findByIdAndUpdate(postId, {
                $addToSet: { likes: userObjectId },
                $inc: { 'stats.likesCount': 1 }
            });
            if (this.notificationsService && post.author.toString() !== userId) {
                await this.notificationsService.createNotification(post.author.toString(), userId, notification_schema_1.NotificationType.LIKE, { postId });
            }
            return { liked: true, message: 'Post liked' };
        }
    }
    async addComment(postId, userId, commentDto) {
        if (!mongoose_2.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID');
        }
        const post = await this.postModel.findById(postId);
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        const comment = {
            user: new mongoose_2.Types.ObjectId(userId),
            content: commentDto.content.trim(),
            likes: [],
            createdAt: new Date()
        };
        await this.postModel.findByIdAndUpdate(postId, {
            $push: { comments: comment },
            $inc: { 'stats.commentsCount': 1 }
        });
        if (this.notificationsService && post.author.toString() !== userId) {
            await this.notificationsService.createNotification(post.author.toString(), userId, notification_schema_1.NotificationType.COMMENT, { postId, commentId: comment.user.toString() });
        }
        if (this.notificationsService && commentDto.content) {
            const mentionRegex = /@(\w+)/g;
            const mentions = commentDto.content.match(mentionRegex);
            if (mentions) {
                const usernames = mentions.map(m => m.substring(1).toLowerCase());
                for (const username of usernames) {
                    const mentionedUser = await this.usersService.findByUsername(username);
                    if (mentionedUser) {
                        const mentionedUserId = mentionedUser._id?.toString();
                        const postAuthorId = post.author.toString();
                        if (mentionedUserId && mentionedUserId !== userId && mentionedUserId !== postAuthorId) {
                            await this.notificationsService.createNotification(mentionedUserId, userId, notification_schema_1.NotificationType.MENTION, { postId });
                        }
                    }
                }
            }
        }
        const updatedPost = await this.postModel
            .findById(postId)
            .populate('comments.user', 'username profile.name profile.avatar')
            .exec();
        const newComment = updatedPost?.comments[updatedPost.comments.length - 1];
        return {
            comment: this.commentToJSON(newComment),
            message: 'Comment added successfully'
        };
    }
    async toggleCommentLike(postId, commentIndex, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID');
        }
        const post = await this.postModel.findById(postId);
        if (!post || !post.comments[commentIndex]) {
            throw new common_1.NotFoundException('Comment not found');
        }
        const comment = post.comments[commentIndex];
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const isLiked = comment.likes.some(likeId => likeId.toString() === userId);
        if (isLiked) {
            comment.likes = comment.likes.filter(id => id.toString() !== userId);
        }
        else {
            comment.likes.push(userObjectId);
            if (this.notificationsService && comment.user.toString() !== userId) {
                await this.notificationsService.createNotification(comment.user.toString(), userId, notification_schema_1.NotificationType.COMMENT_LIKE, { postId, commentId: comment.user.toString() });
            }
        }
        await this.postModel.findByIdAndUpdate(postId, {
            $set: { [`comments.${commentIndex}`]: comment }
        });
        return { liked: !isLiked, message: isLiked ? 'Comment unliked' : 'Comment liked' };
    }
    async deleteComment(postId, commentIndex, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID');
        }
        const post = await this.postModel.findById(postId);
        if (!post || !post.comments[commentIndex]) {
            throw new common_1.NotFoundException('Comment not found');
        }
        const comment = post.comments[commentIndex];
        if (comment.user.toString() !== userId && post.author.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own comments');
        }
        post.comments.splice(commentIndex, 1);
        await this.postModel.findByIdAndUpdate(postId, {
            $set: { comments: post.comments },
            $inc: { 'stats.commentsCount': -1 }
        });
        return { message: 'Comment deleted successfully' };
    }
    async updatePost(postId, userId, updatePostDto) {
        if (!mongoose_2.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID');
        }
        const post = await this.postModel.findById(postId);
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (post.author.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only update your own posts');
        }
        const updateData = {};
        if (updatePostDto.content !== undefined) {
            updateData.content = updatePostDto.content.trim();
            updateData.hashtags = this.extractHashtags(updatePostDto.content);
            updateData.mentions = await this.extractMentions(updatePostDto.content);
        }
        if (updatePostDto.visibility !== undefined) {
            updateData.visibility = updatePostDto.visibility;
        }
        if (updatePostDto.location !== undefined) {
            updateData.location = updatePostDto.location;
        }
        const updatedPost = await this.postModel.findByIdAndUpdate(postId, { $set: updateData }, { new: true }).populate('author', 'username profile.name profile.avatar');
        return updatedPost;
    }
    async deletePost(postId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID');
        }
        const post = await this.postModel.findById(postId);
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        if (post.author.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own posts');
        }
        await this.postModel.findByIdAndUpdate(postId, {
            $set: { status: 'deleted' }
        });
        return { message: 'Post deleted successfully' };
    }
    async sharePost(postId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID');
        }
        const post = await this.postModel.findById(postId);
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        await this.postModel.findByIdAndUpdate(postId, {
            $inc: { 'stats.sharesCount': 1 }
        });
        if (this.notificationsService && post.author.toString() !== userId) {
            await this.notificationsService.createNotification(post.author.toString(), userId, notification_schema_1.NotificationType.POST_SHARE, { postId });
        }
        return { message: 'Post shared successfully' };
    }
    async toggleSave(postId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(postId)) {
            throw new common_1.BadRequestException('Invalid post ID');
        }
        const post = await this.postModel.findById(postId);
        if (!post) {
            throw new common_1.NotFoundException('Post not found');
        }
        await this.postModel.findByIdAndUpdate(postId, {
            $inc: { 'stats.saveCount': 1 }
        });
        if (this.notificationsService && post.author.toString() !== userId) {
            await this.notificationsService.createNotification(post.author.toString(), userId, notification_schema_1.NotificationType.POST_SAVE, { postId });
        }
        return { saved: true, message: 'Post saved' };
    }
    async getPostsByHashtag(hashtag, page = 1, limit = 20) {
        const posts = await this.postModel
            .find({
            hashtags: hashtag.toLowerCase(),
            status: 'active',
            visibility: 'public'
        })
            .populate('author', 'username profile.name profile.avatar isPrivate')
            .populate('comments.user', 'username profile.name profile.avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
        const total = await this.postModel.countDocuments({
            hashtags: hashtag.toLowerCase(),
            status: 'active',
            visibility: 'public'
        });
        return {
            posts: posts.map(post => this.toJSON(post)),
            hashtag,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalPosts: total,
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        };
    }
    async getTrendingHashtags(limit = 10) {
        const posts = await this.postModel
            .find({ status: 'active', visibility: 'public' })
            .select('hashtags')
            .exec();
        const hashtagCounts = {};
        posts.forEach(post => {
            post.hashtags?.forEach(tag => {
                hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
            });
        });
        const trending = Object.entries(hashtagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([hashtag, count]) => ({ hashtag, count }));
        return trending;
    }
    toJSON(post, currentUserId) {
        const postObj = post.toObject();
        const isLiked = currentUserId
            ? post.likes.some(likeId => likeId.toString() === currentUserId)
            : false;
        return {
            ...postObj,
            isLiked,
            author: postObj.author,
            likes: postObj.likes,
            comments: postObj.comments?.map((comment) => this.commentToJSON(comment, currentUserId))
        };
    }
    commentToJSON(comment, currentUserId) {
        if (!comment)
            return null;
        const isLiked = currentUserId && comment.likes
            ? comment.likes.some((likeId) => likeId.toString() === currentUserId)
            : false;
        return {
            ...comment,
            isLiked,
            user: comment.user
        };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(post_schema_1.Post.name)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        users_service_1.UsersService,
        notifications_service_1.NotificationsService])
], PostsService);
//# sourceMappingURL=posts.service.js.map