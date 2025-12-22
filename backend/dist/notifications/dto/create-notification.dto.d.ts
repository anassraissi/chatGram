import { NotificationType } from '../schemas/notification.schema';
export declare class CreateNotificationDto {
    recipient: string;
    actor: string;
    type: NotificationType;
    post?: string;
    targetUser?: string;
    commentId?: string;
    message?: string;
    metadata?: {
        title: string;
        body: string;
        image?: string;
        link?: string;
    };
}
