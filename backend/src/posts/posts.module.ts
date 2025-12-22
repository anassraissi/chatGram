import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './schemas/post.schema';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    forwardRef(() => UsersModule), // For user-related operations
    forwardRef(() => NotificationsModule), // For notifications
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService], // Export for use in other modules if needed
})
export class PostsModule {}

