import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/comment.dto';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  // Create a new post
  @Post()
  async createPost(@Req() req: any, @Body() createPostDto: CreatePostDto) {
    try {
      const post = await this.postsService.createPost(req.user.userId, createPostDto);
      const postData = this.postsService.toJSON(post, req.user.userId);

      return {
        success: true,
        message: 'Post created successfully',
        data: postData
      };
    } catch (error: any) {
      console.error('Error creating post:', error);
      throw new BadRequestException(error?.message || 'Failed to create post');
    }
  }

  // Get feed (posts from users you follow)
  @Get('feed')
  async getFeed(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    try {
      const result = await this.postsService.getFeed(
        req.user.userId,
        Number(page),
        Number(limit)
      );

      return {
        success: true,
        message: 'Feed retrieved successfully',
        data: result
      };
    } catch (error: any) {
      console.error('Error getting feed:', error);
      throw new BadRequestException(error?.message || 'Failed to get feed');
    }
  }

  // Get a specific post
  @Get(':postId')
  async getPost(@Req() req: any, @Param('postId') postId: string) {
    try {
      const post = await this.postsService.findById(postId, req.user.userId);
      const postData = this.postsService.toJSON(post, req.user.userId);

      return {
        success: true,
        message: 'Post retrieved successfully',
        data: postData
      };
    } catch (error: any) {
      console.error('Error getting post:', error);
      throw new BadRequestException(error?.message || 'Failed to get post');
    }
  }

  // Get user's posts
  @Get('user/:userId')
  async getUserPosts(
    @Req() req: any,
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    try {
      const result = await this.postsService.getUserPosts(
        userId,
        req.user.userId,
        Number(page),
        Number(limit)
      );

      return {
        success: true,
        message: 'User posts retrieved successfully',
        data: result
      };
    } catch (error: any) {
      console.error('Error getting user posts:', error);
      throw new BadRequestException(error?.message || 'Failed to get user posts');
    }
  }

  // Update a post
  @Put(':postId')
  async updatePost(
    @Req() req: any,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto
  ) {
    try {
      const post = await this.postsService.updatePost(
        postId,
        req.user.userId,
        updatePostDto
      );
      const postData = this.postsService.toJSON(post, req.user.userId);

      return {
        success: true,
        message: 'Post updated successfully',
        data: postData
      };
    } catch (error: any) {
      console.error('Error updating post:', error);
      throw new BadRequestException(error?.message || 'Failed to update post');
    }
  }

  // Delete a post
  @Delete(':postId')
  async deletePost(@Req() req: any, @Param('postId') postId: string) {
    try {
      await this.postsService.deletePost(postId, req.user.userId);

      return {
        success: true,
        message: 'Post deleted successfully'
      };
    } catch (error: any) {
      console.error('Error deleting post:', error);
      throw new BadRequestException(error?.message || 'Failed to delete post');
    }
  }

  // Like/Unlike a post
  @Post(':postId/like')
  async toggleLike(@Req() req: any, @Param('postId') postId: string) {
    try {
      const result = await this.postsService.toggleLike(postId, req.user.userId);

      return {
        success: true,
        message: result.message,
        data: result
      };
    } catch (error: any) {
      console.error('Error toggling like:', error);
      throw new BadRequestException(error?.message || 'Failed to toggle like');
    }
  }

  // Add comment to post
  @Post(':postId/comments')
  async addComment(
    @Req() req: any,
    @Param('postId') postId: string,
    @Body() commentDto: CreateCommentDto
  ) {
    try {
      const result = await this.postsService.addComment(
        postId,
        req.user.userId,
        commentDto
      );

      return {
        success: true,
        message: result.message,
        data: result.comment
      };
    } catch (error: any) {
      console.error('Error adding comment:', error);
      throw new BadRequestException(error?.message || 'Failed to add comment');
    }
  }

  // Like/Unlike a comment
  @Post(':postId/comments/:commentIndex/like')
  async toggleCommentLike(
    @Req() req: any,
    @Param('postId') postId: string,
    @Param('commentIndex') commentIndex: string
  ) {
    try {
      const result = await this.postsService.toggleCommentLike(
        postId,
        Number(commentIndex),
        req.user.userId
      );

      return {
        success: true,
        message: result.message,
        data: result
      };
    } catch (error: any) {
      console.error('Error toggling comment like:', error);
      throw new BadRequestException(error?.message || 'Failed to toggle comment like');
    }
  }

  // Delete a comment
  @Delete(':postId/comments/:commentIndex')
  async deleteComment(
    @Req() req: any,
    @Param('postId') postId: string,
    @Param('commentIndex') commentIndex: string
  ) {
    try {
      await this.postsService.deleteComment(
        postId,
        Number(commentIndex),
        req.user.userId
      );

      return {
        success: true,
        message: 'Comment deleted successfully'
      };
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      throw new BadRequestException(error?.message || 'Failed to delete comment');
    }
  }

  // Share a post
  @Post(':postId/share')
  async sharePost(@Req() req: any, @Param('postId') postId: string) {
    try {
      await this.postsService.sharePost(postId, req.user.userId);

      return {
        success: true,
        message: 'Post shared successfully'
      };
    } catch (error: any) {
      console.error('Error sharing post:', error);
      throw new BadRequestException(error?.message || 'Failed to share post');
    }
  }

  // Save/Unsave a post
  @Post(':postId/save')
  async toggleSave(@Req() req: any, @Param('postId') postId: string) {
    try {
      const result = await this.postsService.toggleSave(postId, req.user.userId);

      return {
        success: true,
        message: result.message,
        data: result
      };
    } catch (error: any) {
      console.error('Error toggling save:', error);
      throw new BadRequestException(error?.message || 'Failed to toggle save');
    }
  }

  // Get posts by hashtag
  @Get('hashtag/:hashtag')
  async getPostsByHashtag(
    @Param('hashtag') hashtag: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    try {
      const result = await this.postsService.getPostsByHashtag(
        hashtag,
        Number(page),
        Number(limit)
      );

      return {
        success: true,
        message: 'Hashtag posts retrieved successfully',
        data: result
      };
    } catch (error: any) {
      console.error('Error getting hashtag posts:', error);
      throw new BadRequestException(error?.message || 'Failed to get hashtag posts');
    }
  }

  // Get trending hashtags
  @Get('hashtags/trending')
  async getTrendingHashtags(@Query('limit') limit: number = 10) {
    try {
      const hashtags = await this.postsService.getTrendingHashtags(Number(limit));

      return {
        success: true,
        message: 'Trending hashtags retrieved successfully',
        data: hashtags
      };
    } catch (error: any) {
      console.error('Error getting trending hashtags:', error);
      throw new BadRequestException(error?.message || 'Failed to get trending hashtags');
    }
  }
}

