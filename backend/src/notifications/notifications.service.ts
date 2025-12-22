import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  InternalServerErrorException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @Inject(forwardRef(() => PostsService))
    private postsService: PostsService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway?: NotificationsGateway,
  ) {}

  // Create a notification
  async createNotification(
    recipientId: string,
    actorId: string,
    type: NotificationType,
    options: {
      postId?: string;
      targetUserId?: string;
      commentId?: string;
      message?: string;
      metadata?: any;
    } = {}
  ): Promise<NotificationDocument> {
    try {
      // Don't notify yourself
      if (recipientId === actorId) {
        return null as any;
      }

      // Check for duplicate notification (same type, actor, recipient, post within last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const duplicate = await this.notificationModel.findOne({
        recipient: new Types.ObjectId(recipientId),
        actor: new Types.ObjectId(actorId),
        type,
        post: options.postId ? new Types.ObjectId(options.postId) : undefined,
        createdAt: { $gte: oneHourAgo }
      });

      if (duplicate) {
        return duplicate; // Return existing notification instead of creating duplicate
      }

      // Generate metadata based on type
      const metadata = options.metadata || await this.generateMetadata(
        type,
        actorId,
        options.postId,
        options.targetUserId,
        options.commentId
      );

      const notification = new this.notificationModel({
        recipient: new Types.ObjectId(recipientId),
        actor: new Types.ObjectId(actorId),
        type,
        post: options.postId ? new Types.ObjectId(options.postId) : undefined,
        targetUser: options.targetUserId ? new Types.ObjectId(options.targetUserId) : undefined,
        commentId: options.commentId ? new Types.ObjectId(options.commentId) : undefined,
        message: options.message,
        metadata,
        read: false
      });

      const savedNotification = await notification.save();
      
      // Emit real-time notification via WebSocket
      if (this.notificationsGateway) {
        const notificationData = this.toJSON(savedNotification);
        await this.notificationsGateway.sendNotificationToUser(recipientId, notificationData);
      }

      return savedNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new InternalServerErrorException('Failed to create notification');
    }
  }

  // Generate notification metadata
  private async generateMetadata(
    type: NotificationType,
    actorId: string,
    postId?: string,
    targetUserId?: string,
    commentId?: string
  ): Promise<{ title: string; body: string; image?: string; link?: string }> {
    const actor = await this.usersService.findById(actorId);
    if (!actor) {
      throw new NotFoundException('Actor not found');
    }

    const actorName = (actor as any).profile?.name || (actor as any).username || 'Someone';
    const actorAvatar = (actor as any).profile?.avatar || '';

    let title = '';
    let body = '';
    let link = '';
    let image = actorAvatar;

    switch (type) {
      case NotificationType.LIKE:
        title = 'New Like';
        body = `${actorName} liked your post`;
        link = postId ? `/posts/${postId}` : '';
        break;

      case NotificationType.COMMENT:
        title = 'New Comment';
        body = `${actorName} commented on your post`;
        link = postId ? `/posts/${postId}` : '';
        break;

      case NotificationType.COMMENT_LIKE:
        title = 'Comment Liked';
        body = `${actorName} liked your comment`;
        link = postId ? `/posts/${postId}` : '';
        break;

      case NotificationType.FOLLOW:
        title = 'New Follower';
        body = `${actorName} started following you`;
        link = `/users/${(actor as any).username}`;
        break;

      case NotificationType.FOLLOW_REQUEST:
        title = 'Follow Request';
        body = `${actorName} wants to follow you`;
        link = `/users/follow-requests`;
        break;

      case NotificationType.FOLLOW_REQUEST_ACCEPTED:
        title = 'Follow Request Accepted';
        body = `${actorName} accepted your follow request`;
        link = `/users/${(actor as any).username}`;
        break;

      case NotificationType.MENTION:
        title = 'You were mentioned';
        body = `${actorName} mentioned you in a post`;
        link = postId ? `/posts/${postId}` : '';
        break;

      case NotificationType.POST_SHARE:
        title = 'Post Shared';
        body = `${actorName} shared your post`;
        link = postId ? `/posts/${postId}` : '';
        break;

      case NotificationType.POST_SAVE:
        title = 'Post Saved';
        body = `${actorName} saved your post`;
        link = postId ? `/posts/${postId}` : '';
        break;

      default:
        title = 'New Notification';
        body = `${actorName} interacted with you`;
    }

    // Get post image if available
    if (postId && (type === NotificationType.LIKE || type === NotificationType.COMMENT || type === NotificationType.MENTION)) {
      try {
        const post = await this.postsService.findById(postId);
        if (post && post.media && post.media.length > 0) {
          const firstMedia = post.media[0];
          if (firstMedia.type === 'image') {
            image = firstMedia.url;
          } else if (firstMedia.thumbnail) {
            image = firstMedia.thumbnail;
          }
        }
      } catch (error) {
        // Post not found or error, use actor avatar
      }
    }

    return { title, body, image, link };
  }

  // Get user's notifications
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const query: any = {
      recipient: new Types.ObjectId(userId)
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
      recipient: new Types.ObjectId(userId),
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

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new BadRequestException('Invalid notification ID');
    }

    const notification = await this.notificationModel.findOne({
      _id: new Types.ObjectId(notificationId),
      recipient: new Types.ObjectId(userId)
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return { message: 'Notification marked as read' };
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<any> {
    await this.notificationModel.updateMany(
      {
        recipient: new Types.ObjectId(userId),
        read: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );

    return { message: 'All notifications marked as read' };
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new BadRequestException('Invalid notification ID');
    }

    const notification = await this.notificationModel.findOneAndDelete({
      _id: new Types.ObjectId(notificationId),
      recipient: new Types.ObjectId(userId)
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return { message: 'Notification deleted' };
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) {
      return 0;
    }

    return await this.notificationModel.countDocuments({
      recipient: new Types.ObjectId(userId),
      read: false
    });
  }

  // Delete old read notifications (cleanup)
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const result = await this.notificationModel.deleteMany({
      read: true,
      readAt: { $lt: cutoffDate }
    });

    return result.deletedCount || 0;
  }

  // Convert notification to JSON
  toJSON(notification: NotificationDocument): any {
    const notifObj = notification.toObject();
    return {
      ...notifObj,
      id: notifObj._id,
      _id: undefined
    };
  }
}

