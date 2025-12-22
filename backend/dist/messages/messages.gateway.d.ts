import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from './messages.service';
import { UsersService } from '../users/users.service';
export declare class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private configService;
    private messagesService;
    private usersService;
    server: Server;
    private userSockets;
    constructor(jwtService: JwtService, configService: ConfigService, messagesService: MessagesService, usersService: UsersService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleSendMessage(client: Socket, data: any): Promise<void>;
}
