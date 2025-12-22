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
exports.MessagesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const messages_service_1 = require("./messages.service");
const users_service_1 = require("../users/users.service");
let MessagesGateway = class MessagesGateway {
    jwtService;
    configService;
    messagesService;
    usersService;
    server;
    userSockets = new Map();
    constructor(jwtService, configService, messagesService, usersService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.messagesService = messagesService;
        this.usersService = usersService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }
            const secret = this.configService.get('JWT_SECRET');
            const payload = this.jwtService.verify(token, { secret });
            const userId = payload.sub;
            if (!userId) {
                client.disconnect();
                return;
            }
            this.userSockets.set(userId, client.id);
            client.data.userId = userId;
            client.join(`user:${userId}`);
            const unreadCount = await this.messagesService.getUnreadCount(userId);
            client.emit('unread-count', { count: unreadCount });
            console.log(`✅ User ${userId} connected to messages`);
        }
        catch (error) {
            console.error('❌ WebSocket connection error:', error?.message || error);
            try {
                client.emit('connection-error', { message: error?.message || 'connection error' });
            }
            catch { }
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.data?.userId) {
            this.userSockets.delete(client.data.userId);
            console.log(`❌ User ${client.data.userId} disconnected from messages`);
        }
    }
    async handleSendMessage(client, data) {
        if (!client.data?.userId)
            return;
        try {
            if (!data || !data.receiverId || typeof data.receiverId !== 'string') {
                client.emit('message-error', { error: 'receiverId is required' });
                return;
            }
            const message = await this.messagesService.createMessage(client.data.userId, data.receiverId, { content: data.content, attachments: data.attachments });
            client.emit('message-sent', { message });
            this.server.to(`user:${data.receiverId}`).emit('new-message', { message });
            const unreadCount = await this.messagesService.getUnreadCount(data.receiverId);
            this.server.to(`user:${data.receiverId}`).emit('unread-count', { count: unreadCount });
        }
        catch (err) {
            client.emit('message-error', { error: err?.message || err });
        }
    }
};
exports.MessagesGateway = MessagesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MessagesGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('send-message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleSendMessage", null);
exports.MessagesGateway = MessagesGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: [process.env.FRONTEND_ORIGIN || 'http://localhost:3000'],
            credentials: true,
        },
        namespace: '/messages',
    }),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => messages_service_1.MessagesService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        messages_service_1.MessagesService,
        users_service_1.UsersService])
], MessagesGateway);
//# sourceMappingURL=messages.gateway.js.map