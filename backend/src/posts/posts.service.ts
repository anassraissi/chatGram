import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/comment.dto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService?: NotificationsService,
  ) {}

  // Extract hashtags from content
  private extractHashtags(content: string): string[] {
    if (!content) return [];
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
  }

  // Extract mentions from content
  private async extractMentions(content: string): Promise<Types.ObjectId[]> {
    if (!content) return [];
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex);
    if (!matches) return [];

    const usernames = matches.map(m => m.substring(1).toLowerCase());
    const users = await Promise.all(
      usernames.map(username => this.usersService.findByUsername(username))
    );
    
    return users
      .filter(user => user !== null)
      .map(user => new Types.ObjectId((user as any)._id));
  }

  // Create a new post
  async createPost(userId: string, createPostDto: CreatePostDto): Promise<PostDocument> {
    try {
      const hashtags = createPostDto.hashtags || 
        (createPostDto.content ? this.extractHashtags(createPostDto.content) : []);
      
      const mentions = createPostDto.mentions 
        ? createPostDto.mentions.map(m => new Types.ObjectId(m))
        : await this.extractMentions(createPostDto.content || '');

      const post = new this.postModel({
        author: new Types.ObjectId(userId),
        content: createPostDto.content?.trim() || '',
        media: createPostDto.media || [],
        visibility: createPostDto.visibility || 'public',
        hashtags: [...new Set(hashtags)], // Remove duplicates
        mentions,
        location: createPostDto.location,
        scheduledFor: createPostDto.scheduledFor ? new Date(createPostDto.scheduledFor) : undefined,
        stats: {
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          viewsCount: 0,
          saveCount: 0
        },
        status: createPostDto.scheduledFor ? 'active' : 'active'
      });

      const savedPost = await post.save();

      // Send notifications for mentions
      if (this.notificationsService && mentions.length > 0) {
        for (const mentionId of mentions) {
          if (mentionId.toString() !== userId) {
            await this.notificationsService.createNotification(
              mentionId.toString(),
              userId,
              NotificationType.MENTION,
              { postId: (savedPost._id as Types.ObjectId).toString() }
            );
          }
        }
      }

      return savedPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new InternalServerErrorException('Failed to create post');
    }
  }

  // Get post by ID
  async findById(postId: string, userId?: string): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }

    const post = await this.postModel
      .findById(postId)
      .populate('author', 'username profile.name profile.avatar isPrivate')
      .populate('likes', 'username profile.name profile.avatar')
      .populate('comments.user', 'username profile.name profile.avatar')
      .populate('mentions', 'username profile.name profile.avatar')
      .exec();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check visibility
    if (post.status !== 'active') {
      throw new NotFoundException('Post not found');
    }

    // Increment views count
    if (userId && userId !== post.author.toString()) {
      await this.postModel.findByIdAndUpdate(postId, {
        $inc: { 'stats.viewsCount': 1 }
      });
    }

    return post;
  }

  // Get user's posts
  async getUserPosts(
    userId: string, 
    currentUserId?: string,
    page: number = 1, 
    limit: number = 20
  ): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const query: any = {
      author: new Types.ObjectId(userId),
      status: 'active'
    };

      // If viewing own posts, show all. Otherwise, respect visibility
      if (currentUserId && currentUserId !== userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
          throw new NotFoundException('User not found');
        }

        // If user is private and not following, only show public posts
        if (user.isPrivate) {
          try {
            const relationship = await this.usersService.getRelationship(currentUserId, userId);
            if (!relationship.isFollowing) {
              query.visibility = 'public';
            }
          } catch (error) {
            // If relationship check fails, only show public posts
            query.visibility = 'public';
          }
        }
      }

    const posts = await this.postModel
      .find(query)
      .populate('author', 'username profile.name profile.avatar isPrivate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.postModel.countDocuments(query);

    return {
      posts: posts.map(post => this.toJSON(post, currentUserId)),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  // Get feed (posts from users you follow + your own posts)
  async getFeed(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get IDs of users to include in feed
    const followingIds = user.following.map(id => new Types.ObjectId(id));
    const feedUserIds = [...followingIds, new Types.ObjectId(userId)];

    const posts = await this.postModel
      .find({
        author: { $in: feedUserIds },
        status: 'active',
        $or: [
          { visibility: 'public' },
          { visibility: 'followers', author: { $in: feedUserIds } }
        ]
      })
      .populate('author', 'username profile.name profile.avatar isPrivate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.postModel.countDocuments({
      author: { $in: feedUserIds },
      status: 'active'
    });

    return {
      posts: posts.map(post => this.toJSON(post, userId)),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  // Like/Unlike a post
  async toggleLike(postId: string, userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }

    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const isLiked = post.likes.some(likeId => likeId.toString() === userId);

    if (isLiked) {
      // Unlike
      await this.postModel.findByIdAndUpdate(postId, {
        $pull: { likes: userObjectId },
        $inc: { 'stats.likesCount': -1 }
      });
      return { liked: false, message: 'Post unliked' };
    } else {
      // Like
      await this.postModel.findByIdAndUpdate(postId, {
        $addToSet: { likes: userObjectId },
        $inc: { 'stats.likesCount': 1 }
      });

      // Send notification to post author
      if (this.notificationsService && post.author.toString() !== userId) {
        await this.notificationsService.createNotification(
          post.author.toString(),
          userId,
          NotificationType.LIKE,
          { postId }
        );
      }

      return { liked: true, message: 'Post liked' };
    }
  }

  // Add comment to post
  async addComment(postId: string, userId: string, commentDto: CreateCommentDto): Promise<any> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }

    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = {
      user: new Types.ObjectId(userId),
      content: commentDto.content.trim(),
      likes: [],
      createdAt: new Date()
    };

    await this.postModel.findByIdAndUpdate(postId, {
      $push: { comments: comment },
      $inc: { 'stats.commentsCount': 1 }
    });

    // Send notification to post author
    if (this.notificationsService && post.author.toString() !== userId) {
      await this.notificationsService.createNotification(
        post.author.toString(),
        userId,
        NotificationType.COMMENT,
        { postId, commentId: comment.user.toString() }
      );
    }

    // Check for mentions in comment
    if (this.notificationsService && commentDto.content) {
      const mentionRegex = /@(\w+)/g;
      const mentions = commentDto.content.match(mentionRegex);
      if (mentions) {
        const usernames = mentions.map(m => m.substring(1).toLowerCase());
        for (const username of usernames) {
          const mentionedUser = await this.usersService.findByUsername(username);
          if (mentionedUser) {
            const mentionedUserId = (mentionedUser as any)._id?.toString();
            const postAuthorId = post.author.toString();
            if (mentionedUserId && mentionedUserId !== userId && mentionedUserId !== postAuthorId) {
              await this.notificationsService.createNotification(
                mentionedUserId,
                userId,
                NotificationType.MENTION,
                { postId }
              );
            }
          }
        }
      }
    }

    // Return the comment with populated user
    const updatedPost = await this.postModel
      .findById(postId)
      .populate('comments.user', 'username profile.name profile.avatar')
      .exec();

    const newComment = updatedPost?.comments[updatedPost.comments.length - 1];
    return {
      comment: this.commentToJSON(newComment),
      message: 'Comment added successfully'
    };
  }

  // Like/Unlike a comment
  async toggleCommentLike(postId: string, commentIndex: number, userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }

    const post = await this.postModel.findById(postId);
    if (!post || !post.comments[commentIndex]) {
      throw new NotFoundException('Comment not found');
    }

    const comment = post.comments[commentIndex];
    const userObjectId = new Types.ObjectId(userId);
    const isLiked = comment.likes.some(likeId => likeId.toString() === userId);

    if (isLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      comment.likes.push(userObjectId);
      
      // Send notification to comment author
      if (this.notificationsService && comment.user.toString() !== userId) {
        await this.notificationsService.createNotification(
          comment.user.toString(),
          userId,
          NotificationType.COMMENT_LIKE,
          { postId, commentId: comment.user.toString() }
        );
      }
    }

    await this.postModel.findByIdAndUpdate(postId, {
      $set: { [`comments.${commentIndex}`]: comment }
    });

    return { liked: !isLiked, message: isLiked ? 'Comment unliked' : 'Comment liked' };
  }

  // Delete comment
  async deleteComment(postId: string, commentIndex: number, userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }

    const post = await this.postModel.findById(postId);
    if (!post || !post.comments[commentIndex]) {
      throw new NotFoundException('Comment not found');
    }

    const comment = post.comments[commentIndex];
    
    // Check if user is the comment author or post author
    if (comment.user.toString() !== userId && post.author.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    post.comments.splice(commentIndex, 1);
    await this.postModel.findByIdAndUpdate(postId, {
      $set: { comments: post.comments },
      $inc: { 'stats.commentsCount': -1 }
    });

    return { message: 'Comment deleted successfully' };
  }

  // Update post
  async updatePost(postId: string, userId: string, updatePostDto: UpdatePostDto): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }

    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.toString() !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const updateData: any = {};
    if (updatePostDto.content !== undefined) {
      updateData.content = updatePostDto.content.trim();
      // Re-extract hashtags and mentions
      updateData.hashtags = this.extractHashtags(updatePostDto.content);
      updateData.mentions = await this.extractMentions(updatePostDto.content);
    }
    if (updatePostDto.visibility !== undefined) {
      updateData.visibility = updatePostDto.visibility;
    }
    if (updatePostDto.location !== undefined) {
      updateData.location = updatePostDto.location;
    }

    const updatedPost = await this.postModel.findByIdAndUpdate(
      postId,
      { $set: updateData },
      { new: true }
    ).populate('author', 'username profile.name profile.avatar');

    return updatedPost!;
  }

  // Delete post (soft delete)
  async deletePost(postId: string, userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }

    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postModel.findByIdAndUpdate(postId, {
      $set: { status: 'deleted' }
    });

    return { message: 'Post deleted successfully' };
  }

  // Share post (increment share count)
  async sharePost(postId: string, userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }

    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.postModel.findByIdAndUpdate(postId, {
      $inc: { 'stats.sharesCount': 1 }
    });

    // Send notification to post author
    if (this.notificationsService && post.author.toString() !== userId) {
      await this.notificationsService.createNotification(
        post.author.toString(),
        userId,
        NotificationType.POST_SHARE,
        { postId }
      );
    }

    return { message: 'Post shared successfully' };
  }

  // Save/Unsave post (for bookmarks)
  async toggleSave(postId: string, userId: string): Promise<any> {
    // This would typically use a separate SavedPosts collection
    // For now, we'll just increment the saveCount
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException('Invalid post ID');
    }

    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // In a real implementation, you'd check a SavedPosts collection
    // For now, we'll just increment the count
    await this.postModel.findByIdAndUpdate(postId, {
      $inc: { 'stats.saveCount': 1 }
    });

    // Send notification to post author
    if (this.notificationsService && post.author.toString() !== userId) {
      await this.notificationsService.createNotification(
        post.author.toString(),
        userId,
        NotificationType.POST_SAVE,
        { postId }
      );
    }

    return { saved: true, message: 'Post saved' };
  }

  // Get posts by hashtag
  async getPostsByHashtag(hashtag: string, page: number = 1, limit: number = 20): Promise<any> {
    const posts = await this.postModel
      .find({
        hashtags: hashtag.toLowerCase(),
        status: 'active',
        visibility: 'public'
      })
      .populate('author', 'username profile.name profile.avatar isPrivate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.postModel.countDocuments({
      hashtags: hashtag.toLowerCase(),
      status: 'active',
      visibility: 'public'
    });

    return {
      posts: posts.map(post => this.toJSON(post)),
      hashtag,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  // Get trending hashtags
  async getTrendingHashtags(limit: number = 10): Promise<any> {
    const posts = await this.postModel
      .find({ status: 'active', visibility: 'public' })
      .select('hashtags')
      .exec();

    const hashtagCounts: { [key: string]: number } = {};
    posts.forEach(post => {
      post.hashtags?.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });

    const trending = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([hashtag, count]) => ({ hashtag, count }));

    return trending;
  }

  // Convert post to JSON (remove sensitive data, add user-specific info)
  toJSON(post: PostDocument, currentUserId?: string): any {
    const postObj = post.toObject();
    const isLiked = currentUserId 
      ? post.likes.some(likeId => likeId.toString() === currentUserId)
      : false;
    
    return {
      ...postObj,
      isLiked,
      author: postObj.author,
      likes: postObj.likes,
      comments: postObj.comments?.map((comment: any) => this.commentToJSON(comment, currentUserId))
    };
  }

  // Convert comment to JSON
  commentToJSON(comment: any, currentUserId?: string): any {
    if (!comment) return null;
    const isLiked = currentUserId && comment.likes
      ? comment.likes.some((likeId: any) => likeId.toString() === currentUserId)
      : false;
    
    return {
      ...comment,
      isLiked,
      user: comment.user
    };
  }
}

