import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // Get user's notifications
  @Get()
  async getNotifications(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('unreadOnly') unreadOnly: string = 'false'
  ) {
    try {
      const result = await this.notificationsService.getUserNotifications(
        req.user.userId,
        Number(page),
        Number(limit),
        unreadOnly === 'true'
      );

      return {
        success: true,
        message: 'Notifications retrieved successfully',
        data: result
      };
    } catch (error: any) {
      console.error('Error getting notifications:', error);
      throw new BadRequestException(error?.message || 'Failed to get notifications');
    }
  }

  // Get unread count
  @Get('unread/count')
  async getUnreadCount(@Req() req: any) {
    try {
      const count = await this.notificationsService.getUnreadCount(req.user.userId);

      return {
        success: true,
        message: 'Unread count retrieved successfully',
        data: { count }
      };
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      throw new BadRequestException(error?.message || 'Failed to get unread count');
    }
  }

  // Mark notification as read
  @Post(':notificationId/read')
  async markAsRead(@Req() req: any, @Param('notificationId') notificationId: string) {
    try {
      await this.notificationsService.markAsRead(notificationId, req.user.userId);

      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw new BadRequestException(error?.message || 'Failed to mark notification as read');
    }
  }

  // Mark all notifications as read
  @Post('read-all')
  async markAllAsRead(@Req() req: any) {
    try {
      await this.notificationsService.markAllAsRead(req.user.userId);

      return {
        success: true,
        message: 'All notifications marked as read'
      };
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      throw new BadRequestException(error?.message || 'Failed to mark all as read');
    }
  }

  // Delete notification
  @Delete(':notificationId')
  async deleteNotification(@Req() req: any, @Param('notificationId') notificationId: string) {
    try {
      await this.notificationsService.deleteNotification(notificationId, req.user.userId);

      return {
        success: true,
        message: 'Notification deleted successfully'
      };
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      throw new BadRequestException(error?.message || 'Failed to delete notification');
    }
  }
}





