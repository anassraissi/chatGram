import { Model } from 'mongoose';
import { NotificationDocument, NotificationType } from './schemas/notification.schema';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { NotificationsGateway } from './notifications.gateway';
export declare class NotificationsService {
    private notificationModel;
    private usersService;
    private postsService;
    private notificationsGateway?;
    constructor(notificationModel: Model<NotificationDocument>, usersService: UsersService, postsService: PostsService, notificationsGateway?: NotificationsGateway | undefined);
    createNotification(recipientId: string, actorId: string, type: NotificationType, options?: {
        postId?: string;
        targetUserId?: string;
        commentId?: string;
        message?: string;
        metadata?: any;
    }): Promise<NotificationDocument>;
    private generateMetadata;
    getUserNotifications(userId: string, page?: number, limit?: number, unreadOnly?: boolean): Promise<any>;
    markAsRead(notificationId: string, userId: string): Promise<any>;
    markAllAsRead(userId: string): Promise<any>;
    deleteNotification(notificationId: string, userId: string): Promise<any>;
    getUnreadCount(userId: string): Promise<number>;
    deleteOldNotifications(daysOld?: number): Promise<number>;
    toJSON(notification: NotificationDocument): any;
}
