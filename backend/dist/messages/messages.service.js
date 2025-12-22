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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const message_schema_1 = require("./schemas/message.schema");
const users_service_1 = require("../users/users.service");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
let MessagesService = class MessagesService {
    messageModel;
    usersService;
    notificationsService;
    constructor(messageModel, usersService, notificationsService) {
        this.messageModel = messageModel;
        this.usersService = usersService;
        this.notificationsService = notificationsService;
    }
    async createMessage(senderId, receiverId, createMessageDto) {
        if (!mongoose_2.Types.ObjectId.isValid(senderId) || !mongoose_2.Types.ObjectId.isValid(receiverId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        if (senderId === receiverId) {
            throw new common_1.BadRequestException('Cannot send message to yourself');
        }
        const sender = await this.usersService.findById(senderId);
        const receiver = await this.usersService.findById(receiverId);
        if (!sender || !receiver) {
            throw new common_1.NotFoundException('User not found');
        }
        const message = new this.messageModel({
            sender: new mongoose_2.Types.ObjectId(senderId),
            receiver: new mongoose_2.Types.ObjectId(receiverId),
            content: createMessageDto.content.trim(),
            attachments: createMessageDto.attachments || [],
            status: 'active',
        });
        const savedMessage = await message.save();
        if (this.notificationsService) {
            await this.notificationsService.createNotification(receiverId, senderId, notification_schema_1.NotificationType.MESSAGE, {
                message: createMessageDto.content.substring(0, 100),
                metadata: {
                    messageId: savedMessage._id.toString(),
                    body: createMessageDto.content.substring(0, 100),
                    link: `/messages?user=${sender.username}`
                }
            });
        }
        await savedMessage.populate('sender', 'username profile.name profile.avatar');
        await savedMessage.populate('receiver', 'username profile.name profile.avatar');
        return savedMessage;
    }
    async getConversation(userId, otherUserId, page = 1, limit = 50) {
        if (!mongoose_2.Types.ObjectId.isValid(userId) || !mongoose_2.Types.ObjectId.isValid(otherUserId)) {
            throw new common_1.BadRequestException('Invalid user ID');
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
        const unreadMessages = messages.filter(msg => msg.receiver.toString() === userId && !msg.read);
        if (unreadMessages.length > 0) {
            await this.messageModel.updateMany({
                _id: { $in: unreadMessages.map(m => m._id) }
            }, {
                $set: { read: true, readAt: new Date() }
            });
        }
        return {
            messages: messages.reverse(),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalMessages: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            }
        };
    }
    async getConversations(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const conversations = await this.messageModel.aggregate([
            {
                $match: {
                    $or: [
                        { sender: new mongoose_2.Types.ObjectId(userId) },
                        { receiver: new mongoose_2.Types.ObjectId(userId) }
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
                            { $eq: ['$sender', new mongoose_2.Types.ObjectId(userId)] },
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
                                        { $eq: ['$receiver', new mongoose_2.Types.ObjectId(userId)] },
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
    async markAsRead(messageId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(messageId)) {
            throw new common_1.BadRequestException('Invalid message ID');
        }
        const message = await this.messageModel.findById(messageId);
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (message.receiver.toString() !== userId) {
            throw new common_1.BadRequestException('You can only mark your own received messages as read');
        }
        await this.messageModel.findByIdAndUpdate(messageId, {
            $set: { read: true, readAt: new Date() }
        });
    }
    async markConversationAsRead(userId, otherUserId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId) || !mongoose_2.Types.ObjectId.isValid(otherUserId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        await this.messageModel.updateMany({
            sender: new mongoose_2.Types.ObjectId(otherUserId),
            receiver: new mongoose_2.Types.ObjectId(userId),
            read: false
        }, {
            $set: { read: true, readAt: new Date() }
        });
    }
    async deleteMessage(messageId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(messageId)) {
            throw new common_1.BadRequestException('Invalid message ID');
        }
        const message = await this.messageModel.findById(messageId);
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (message.sender.toString() !== userId && message.receiver.toString() !== userId) {
            throw new common_1.BadRequestException('You can only delete your own messages');
        }
        await this.messageModel.findByIdAndUpdate(messageId, {
            $set: { status: 'deleted' }
        });
    }
    async getUnreadCount(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        return this.messageModel.countDocuments({
            receiver: new mongoose_2.Types.ObjectId(userId),
            read: false,
            status: 'active'
        });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        users_service_1.UsersService,
        notifications_service_1.NotificationsService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map