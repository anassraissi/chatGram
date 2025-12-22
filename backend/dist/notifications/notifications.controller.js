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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const notifications_service_1 = require("./notifications.service");
let NotificationsController = class NotificationsController {
    notificationsService;
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async getNotifications(req, page = 1, limit = 20, unreadOnly = 'false') {
        try {
            const result = await this.notificationsService.getUserNotifications(req.user.userId, Number(page), Number(limit), unreadOnly === 'true');
            return {
                success: true,
                message: 'Notifications retrieved successfully',
                data: result
            };
        }
        catch (error) {
            console.error('Error getting notifications:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to get notifications');
        }
    }
    async getUnreadCount(req) {
        try {
            const count = await this.notificationsService.getUnreadCount(req.user.userId);
            return {
                success: true,
                message: 'Unread count retrieved successfully',
                data: { count }
            };
        }
        catch (error) {
            console.error('Error getting unread count:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to get unread count');
        }
    }
    async markAsRead(req, notificationId) {
        try {
            await this.notificationsService.markAsRead(notificationId, req.user.userId);
            return {
                success: true,
                message: 'Notification marked as read'
            };
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to mark notification as read');
        }
    }
    async markAllAsRead(req) {
        try {
            await this.notificationsService.markAllAsRead(req.user.userId);
            return {
                success: true,
                message: 'All notifications marked as read'
            };
        }
        catch (error) {
            console.error('Error marking all as read:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to mark all as read');
        }
    }
    async deleteNotification(req, notificationId) {
        try {
            await this.notificationsService.deleteNotification(notificationId, req.user.userId);
            return {
                success: true,
                message: 'Notification deleted successfully'
            };
        }
        catch (error) {
            console.error('Error deleting notification:', error);
            throw new common_1.BadRequestException(error?.message || 'Failed to delete notification');
        }
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('unreadOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Get)('unread/count'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Post)(':notificationId/read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('notificationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Post)('read-all'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Delete)(':notificationId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('notificationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "deleteNotification", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map