import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class MessagesController {
    private messagesService;
    constructor(messagesService: MessagesService);
    sendMessage(req: any, createMessageDto: CreateMessageDto): Promise<{
        success: boolean;
        message: string;
        data: import("./schemas/message.schema").MessageDocument;
    }>;
    getConversation(req: any, userId: string, page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getConversations(req: any, page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: any[];
    }>;
    markAsRead(req: any, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getUnreadCount(req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            count: number;
        };
    }>;
    deleteMessage(req: any, messageId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
