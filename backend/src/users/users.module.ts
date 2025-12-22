import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { FollowRequest, FollowRequestSchema } from './schemas/follow-request.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: FollowRequest.name, schema: FollowRequestSchema }
    ]),
    forwardRef(() => NotificationsModule), // For notifications
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService] // ← THIS IS IMPORTANT FOR JWT STRATEGY!
})
export class UsersModule {}