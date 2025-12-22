import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { NotificationsService } from './notifications.service';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private configService;
    private usersService;
    private notificationsService;
    server: Server;
    private userSockets;
    constructor(jwtService: JwtService, configService: ConfigService, usersService: UsersService, notificationsService: NotificationsService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    sendNotificationToUser(userId: string, notification: any): Promise<void>;
    broadcastNotification(userIds: string[], notification: any): Promise<void>;
    handleMarkRead(client: Socket, data: {
        notificationId: string;
    }): Promise<void>;
}
