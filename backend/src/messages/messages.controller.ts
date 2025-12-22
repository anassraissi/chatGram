import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  // Send a message
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(@Request() req: any, @Body() createMessageDto: CreateMessageDto) {
    const senderId = req.user.sub;
    const { receiverId, content, attachments } = createMessageDto;

    if (!receiverId || typeof receiverId !== 'string') {
      throw new BadRequestException('receiverId is required');
    }

    const message = await this.messagesService.createMessage(senderId, receiverId, {
      content,
      attachments,
    });

    return {
      success: true,
      message: 'Message sent successfully',
      data: message,
    };
  }

  // Get conversation between two users
  @Get('conversation/:userId')
  async getConversation(
    @Request() req: any,
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const currentUserId = req.user.sub;

    const conversation = await this.messagesService.getConversation(
      currentUserId,
      userId,
      page,
      limit,
    );

    return {
      success: true,
      message: 'Conversation retrieved successfully',
      data: conversation,
    };
  }

  // Get all conversations for current user
  @Get('conversations')
  async getConversations(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const userId = req.user.sub;

    const conversations = await this.messagesService.getConversations(userId);

    return {
      success: true,
      message: 'Conversations retrieved successfully',
      data: conversations,
    };
  }

  // Mark conversation as read
  @Post('mark-as-read/:userId')
  async markAsRead(@Request() req: any, @Param('userId') userId: string) {
    const currentUserId = req.user.sub;

    await this.messagesService.markConversationAsRead(currentUserId, userId);

    return {
      success: true,
      message: 'Messages marked as read',
    };
  }

  // Get unread count
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.sub;
    const count = await this.messagesService.getUnreadCount(userId);

    return {
      success: true,
      message: 'Unread count retrieved',
      data: { count },
    };
  }

  // Delete a message
  @Post('delete/:messageId')
  async deleteMessage(@Request() req: any, @Param('messageId') messageId: string) {
    const userId = req.user.sub;

    await this.messagesService.deleteMessage(messageId, userId);

    return {
      success: true,
      message: 'Message deleted successfully',
    };
  }
}

