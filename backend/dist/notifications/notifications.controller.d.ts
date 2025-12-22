import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(req: any, page?: number, limit?: number, unreadOnly?: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getUnreadCount(req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            count: number;
        };
    }>;
    markAsRead(req: any, notificationId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    markAllAsRead(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteNotification(req: any, notificationId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
