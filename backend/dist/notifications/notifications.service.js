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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const notification_schema_1 = require("./schemas/notification.schema");
const users_service_1 = require("../users/users.service");
const posts_service_1 = require("../posts/posts.service");
const notifications_gateway_1 = require("./notifications.gateway");
let NotificationsService = class NotificationsService {
    notificationModel;
    usersService;
    postsService;
    notificationsGateway;
    constructor(notificationModel, usersService, postsService, notificationsGateway) {
        this.notificationModel = notificationModel;
        this.usersService = usersService;
        this.postsService = postsService;
        this.notificationsGateway = notificationsGateway;
    }
    async createNotification(recipientId, actorId, type, options = {}) {
        try {
            if (recipientId === actorId) {
                return null;
            }
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const duplicate = await this.notificationModel.findOne({
                recipient: new mongoose_2.Types.ObjectId(recipientId),
                actor: new mongoose_2.Types.ObjectId(actorId),
                type,
                post: options.postId ? new mongoose_2.Types.ObjectId(options.postId) : undefined,
                createdAt: { $gte: oneHourAgo }
            });
            if (duplicate) {
                return duplicate;
            }
            const metadata = options.metadata || await this.generateMetadata(type, actorId, options.postId, options.targetUserId, options.commentId);
            const notification = new this.notificationModel({
                recipient: new mongoose_2.Types.ObjectId(recipientId),
                actor: new mongoose_2.Types.ObjectId(actorId),
                type,
                post: options.postId ? new mongoose_2.Types.ObjectId(options.postId) : undefined,
                targetUser: options.targetUserId ? new mongoose_2.Types.ObjectId(options.targetUserId) : undefined,
                commentId: options.commentId ? new mongoose_2.Types.ObjectId(options.commentId) : undefined,
                message: options.message,
                metadata,
                read: false
            });
            const savedNotification = await notification.save();
            if (this.notificationsGateway) {
                const notificationData = this.toJSON(savedNotification);
                await this.notificationsGateway.sendNotificationToUser(recipientId, notificationData);
            }
            return savedNotification;
        }
        catch (error) {
            console.error('Error creating notification:', error);
            throw new common_1.InternalServerErrorException('Failed to create notification');
        }
    }
    async generateMetadata(type, actorId, postId, targetUserId, commentId) {
        const actor = await this.usersService.findById(actorId);
        if (!actor) {
            throw new common_1.NotFoundException('Actor not found');
        }
        const actorName = actor.profile?.name || actor.username || 'Someone';
        const actorAvatar = actor.profile?.avatar || '';
        let title = '';
        let body = '';
        let link = '';
        let image = actorAvatar;
        switch (type) {
            case notification_schema_1.NotificationType.LIKE:
                title = 'New Like';
                body = `${actorName} liked your post`;
                link = postId ? `/posts/${postId}` : '';
                break;
            case notification_schema_1.NotificationType.COMMENT:
                title = 'New Comment';
                body = `${actorName} commented on your post`;
                link = postId ? `/posts/${postId}` : '';
                break;
            case notification_schema_1.NotificationType.COMMENT_LIKE:
                title = 'Comment Liked';
                body = `${actorName} liked your comment`;
                link = postId ? `/posts/${postId}` : '';
                break;
            case notification_schema_1.NotificationType.FOLLOW:
                title = 'New Follower';
                body = `${actorName} started following you`;
                link = `/users/${actor.username}`;
                break;
            case notification_schema_1.NotificationType.FOLLOW_REQUEST:
                title = 'Follow Request';
                body = `${actorName} wants to follow you`;
                link = `/users/follow-requests`;
                break;
            case notification_schema_1.NotificationType.FOLLOW_REQUEST_ACCEPTED:
                title = 'Follow Request Accepted';
                body = `${actorName} accepted your follow request`;
                link = `/users/${actor.username}`;
                break;
            case notification_schema_1.NotificationType.MENTION:
                title = 'You were mentioned';
                body = `${actorName} mentioned you in a post`;
                link = postId ? `/posts/${postId}` : '';
                break;
            case notification_schema_1.NotificationType.POST_SHARE:
                title = 'Post Shared';
                body = `${actorName} shared your post`;
                link = postId ? `/posts/${postId}` : '';
                break;
            case notification_schema_1.NotificationType.POST_SAVE:
                title = 'Post Saved';
                body = `${actorName} saved your post`;
                link = postId ? `/posts/${postId}` : '';
                break;
            default:
                title = 'New Notification';
                body = `${actorName} interacted with you`;
        }
        if (postId && (type === notification_schema_1.NotificationType.LIKE || type === notification_schema_1.NotificationType.COMMENT || type === notification_schema_1.NotificationType.MENTION)) {
            try {
                const post = await this.postsService.findById(postId);
                if (post && post.media && post.media.length > 0) {
                    const firstMedia = post.media[0];
                    if (firstMedia.type === 'image') {
                        image = firstMedia.url;
                    }
                    else if (firstMedia.thumbnail) {
                        image = firstMedia.thumbnail;
                    }
                }
            }
            catch (error) {
            }
        }
        return { title, body, image, link };
    }
    async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const query = {
            recipient: new mongoose_2.Types.ObjectId(userId)
        };
        if (unreadOnly) {
            query.read = false;
        }
        const notifications = await this.notificationModel
            .find(query)
            .populate('actor', 'username profile.name profile.avatar')
            .populate('post', 'content media')
            .populate('targetUser', 'username profile.name profile.avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
        const total = await this.notificationModel.countDocuments(query);
        const unreadCount = await this.notificationModel.countDocuments({
            recipient: new mongoose_2.Types.ObjectId(userId),
            read: false
        });
        return {
            notifications: notifications.map(notif => this.toJSON(notif)),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalNotifications: total,
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            },
            unreadCount
        };
    }
    async markAsRead(notificationId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(notificationId)) {
            throw new common_1.BadRequestException('Invalid notification ID');
        }
        const notification = await this.notificationModel.findOne({
            _id: new mongoose_2.Types.ObjectId(notificationId),
            recipient: new mongoose_2.Types.ObjectId(userId)
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        notification.read = true;
        notification.readAt = new Date();
        await notification.save();
        return { message: 'Notification marked as read' };
    }
    async markAllAsRead(userId) {
        await this.notificationModel.updateMany({
            recipient: new mongoose_2.Types.ObjectId(userId),
            read: false
        }, {
            $set: {
                read: true,
                readAt: new Date()
            }
        });
        return { message: 'All notifications marked as read' };
    }
    async deleteNotification(notificationId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(notificationId)) {
            throw new common_1.BadRequestException('Invalid notification ID');
        }
        const notification = await this.notificationModel.findOneAndDelete({
            _id: new mongoose_2.Types.ObjectId(notificationId),
            recipient: new mongoose_2.Types.ObjectId(userId)
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        return { message: 'Notification deleted' };
    }
    async getUnreadCount(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            return 0;
        }
        return await this.notificationModel.countDocuments({
            recipient: new mongoose_2.Types.ObjectId(userId),
            read: false
        });
    }
    async deleteOldNotifications(daysOld = 30) {
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
        const result = await this.notificationModel.deleteMany({
            read: true,
            readAt: { $lt: cutoffDate }
        });
        return result.deletedCount || 0;
    }
    toJSON(notification) {
        const notifObj = notification.toObject();
        return {
            ...notifObj,
            id: notifObj._id,
            _id: undefined
        };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => posts_service_1.PostsService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_gateway_1.NotificationsGateway))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        users_service_1.UsersService,
        posts_service_1.PostsService,
        notifications_gateway_1.NotificationsGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map