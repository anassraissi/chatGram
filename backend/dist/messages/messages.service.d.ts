import { Model } from 'mongoose';
import { MessageDocument } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class MessagesService {
    private messageModel;
    private usersService;
    private notificationsService?;
    constructor(messageModel: Model<MessageDocument>, usersService: UsersService, notificationsService?: NotificationsService | undefined);
    createMessage(senderId: string, receiverId: string, createMessageDto: CreateMessageDto): Promise<MessageDocument>;
    getConversation(userId: string, otherUserId: string, page?: number, limit?: number): Promise<any>;
    getConversations(userId: string): Promise<any[]>;
    markAsRead(messageId: string, userId: string): Promise<void>;
    markConversationAsRead(userId: string, otherUserId: string): Promise<void>;
    deleteMessage(messageId: string, userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
}
