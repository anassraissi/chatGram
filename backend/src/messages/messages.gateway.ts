import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Inject, forwardRef } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: [process.env.FRONTEND_ORIGIN || 'http://localhost:3000'],
    credentials: true,
  },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(forwardRef(() => MessagesService)) private messagesService: MessagesService,
    @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET');
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
    } catch (error) {
      console.error('❌ WebSocket connection error:', error?.message || error);
      try { client.emit('connection-error', { message: error?.message || 'connection error' }); } catch {}
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data?.userId) {
      this.userSockets.delete(client.data.userId);
      console.log(`❌ User ${client.data.userId} disconnected from messages`);
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    if (!client.data?.userId) return;
    try {
      if (!data || !data.receiverId || typeof data.receiverId !== 'string') {
        client.emit('message-error', { error: 'receiverId is required' });
        return;
      }

      const message = await this.messagesService.createMessage(
        client.data.userId,
        data.receiverId,
        { content: data.content, attachments: data.attachments },
      );

      client.emit('message-sent', { message });
      this.server.to(`user:${data.receiverId}`).emit('new-message', { message });
      const unreadCount = await this.messagesService.getUnreadCount(data.receiverId);
      this.server.to(`user:${data.receiverId}`).emit('unread-count', { count: unreadCount });
    } catch (err) {
      client.emit('message-error', { error: err?.message || err });
    }
  }
}
