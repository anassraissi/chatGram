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
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const notifications_service_1 = require("./notifications.service");
let NotificationsGateway = class NotificationsGateway {
    jwtService;
    configService;
    usersService;
    notificationsService;
    server;
    userSockets = new Map();
    constructor(jwtService, configService, usersService, notificationsService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.usersService = usersService;
        this.notificationsService = notificationsService;
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
            const unreadCount = await this.notificationsService.getUnreadCount(userId);
            client.emit('unread-count', { count: unreadCount });
            console.log(`✅ User ${userId} connected to notifications`);
        }
        catch (error) {
            console.error('❌ WebSocket connection error:', error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.data?.userId) {
            this.userSockets.delete(client.data.userId);
            console.log(`❌ User ${client.data.userId} disconnected from notifications`);
        }
    }
    async sendNotificationToUser(userId, notification) {
        this.server.to(`user:${userId}`).emit('new-notification', notification);
        const unreadCount = await this.notificationsService.getUnreadCount(userId);
        this.server.to(`user:${userId}`).emit('unread-count', { count: unreadCount });
    }
    async broadcastNotification(userIds, notification) {
        userIds.forEach(userId => {
            this.sendNotificationToUser(userId, notification);
        });
    }
    async handleMarkRead(client, data) {
        if (!client.data?.userId)
            return;
        try {
            await this.notificationsService.markAsRead(data.notificationId, client.data.userId);
            const unreadCount = await this.notificationsService.getUnreadCount(client.data.userId);
            client.emit('unread-count', { count: unreadCount });
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark-read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], NotificationsGateway.prototype, "handleMarkRead", null);
exports.NotificationsGateway = NotificationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/notifications',
    }),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        users_service_1.UsersService,
        notifications_service_1.NotificationsService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map