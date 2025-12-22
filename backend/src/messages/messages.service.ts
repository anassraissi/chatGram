import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService?: NotificationsService,
  ) {}

  // Create a new message
  async createMessage(senderId: string, receiverId: string, createMessageDto: CreateMessageDto): Promise<MessageDocument> {
    if (!Types.ObjectId.isValid(senderId) || !Types.ObjectId.isValid(receiverId)) {
      throw new BadRequestException('Invalid user ID');
    }

    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    // Verify both users exist
    const sender = await this.usersService.findById(senderId);
    const receiver = await this.usersService.findById(receiverId);

    if (!sender || !receiver) {
      throw new NotFoundException('User not found');
    }

    const message = new this.messageModel({
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(receiverId),
      content: createMessageDto.content.trim(),
      attachments: createMessageDto.attachments || [],
      status: 'active',
    });

    const savedMessage = await message.save();

    // Send notification to receiver
    if (this.notificationsService) {
      await this.notificationsService.createNotification(
        receiverId,
        senderId,
        NotificationType.MESSAGE,
        { 
          message: createMessageDto.content.substring(0, 100), // First 100 chars
          metadata: {
            messageId: (savedMessage._id as Types.ObjectId).toString(),
            body: createMessageDto.content.substring(0, 100),
            link: `/messages?user=${sender.username}`
          }
        }
      );
    }

    // Populate sender and receiver
    await savedMessage.populate('sender', 'username profile.name profile.avatar');
    await savedMessage.populate('receiver', 'username profile.name profile.avatar');
    
    return savedMessage;
  }

  // Get conversation between two users
  async getConversation(
    userId: string, 
    otherUserId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<any> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(otherUserId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const messages = await this.messageModel
      .find({
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId }
        ],
        status: 'active'
      })
      .populate('sender', 'username profile.name profile.avatar')
      .populate('receiver', 'username profile.name profile.avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.messageModel.countDocuments({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ],
      status: 'active'
    });

    // Mark messages as read if they're received by the current user
    const unreadMessages = messages.filter(
      msg => msg.receiver.toString() === userId && !msg.read
    );

    if (unreadMessages.length > 0) {
      await this.messageModel.updateMany(
        {
          _id: { $in: unreadMessages.map(m => m._id) }
        },
        {
          $set: { read: true, readAt: new Date() }
        }
      );
    }

    return {
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      }
    };
  }

  // Get all conversations for a user
  async getConversations(userId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    // Get distinct conversations (users who have sent/received messages)
    const conversations = await this.messageModel.aggregate([
      {
        $match: {
          $or: [
            { sender: new Types.ObjectId(userId) },
            { receiver: new Types.ObjectId(userId) }
          ],
          status: 'active'
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', new Types.ObjectId(userId)] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', new Types.ObjectId(userId)] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: '$user._id',
            username: '$user.username',
            profile: '$user.profile'
          },
          lastMessage: {
            _id: '$lastMessage._id',
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            sender: '$lastMessage.sender',
            read: '$lastMessage.read'
          },
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    return conversations;
  }

  // Mark message as read
  async markAsRead(messageId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new BadRequestException('Invalid message ID');
    }

    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.receiver.toString() !== userId) {
      throw new BadRequestException('You can only mark your own received messages as read');
    }

    await this.messageModel.findByIdAndUpdate(messageId, {
      $set: { read: true, readAt: new Date() }
    });
  }

  // Mark all messages in a conversation as read
  async markConversationAsRead(userId: string, otherUserId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(otherUserId)) {
      throw new BadRequestException('Invalid user ID');
    }

    await this.messageModel.updateMany(
      {
        sender: new Types.ObjectId(otherUserId),
        receiver: new Types.ObjectId(userId),
        read: false
      },
      {
        $set: { read: true, readAt: new Date() }
      }
    );
  }

  // Delete a message
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new BadRequestException('Invalid message ID');
    }

    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender.toString() !== userId && message.receiver.toString() !== userId) {
      throw new BadRequestException('You can only delete your own messages');
    }

    await this.messageModel.findByIdAndUpdate(messageId, {
      $set: { status: 'deleted' }
    });
  }

  // Get unread message count
  async getUnreadCount(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.messageModel.countDocuments({
      receiver: new Types.ObjectId(userId),
      read: false,
      status: 'active'
    });
  }
}


