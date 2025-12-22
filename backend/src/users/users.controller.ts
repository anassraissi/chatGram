import { 
  Controller, 
  Get, 
  Put, 
  Body, 
  Param, 
  Req, 
  Post,
  Delete,
  UseGuards,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Query
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ========== SPECIFIC ROUTES (MUST COME FIRST) ==========

  // Get current user profile
  @Get('me')
  async getCurrentUser(@Req() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userData = this.usersService.toJSON(user);
    
    return {
      success: true,
      message: 'User profile retrieved successfully',
      data: userData
    };
  }

  @Get('avatar/:userId')
async getUserAvatar(@Param('userId') userId: string) {
  const avatarData = await this.usersService.getUserAvatar(userId);
  
  return {
    success: true,
    message: 'Avatar retrieved successfully',
    data: avatarData
  };
}
  // Update user profile
  @Put('profile')
  async updateProfile(@Req() req: any, @Body() updateData: any) {
    console.log('🔄 Updating profile for user:', req.user.userId);
    
    if (!req.user?.userId) {
      throw new BadRequestException('User ID not found in token');
    }

    const user = await this.usersService.updateProfile(req.user.userId, updateData);
    const userData = this.usersService.toJSON(user);
    
    return {
      success: true,
      message: 'Profile updated successfully',
      data: userData
    };
  }

  // Get user statistics
  @Get('stats/me')
  async getUserStats(@Req() req: any) {
    const stats = await this.usersService.getUserStats(req.user.userId);
    
    return {
      success: true,
      message: 'User statistics retrieved successfully',
      data: stats
    };
  }

  // Get user by ID
  @Get('id/:userId')
  async getUserById(@Param('userId') userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userData = this.usersService.toJSON(user);
    return {
      success: true,
      message: 'User profile retrieved successfully',
      // Provide both `data` and `user` for compatibility with existing frontend parsing
      data: userData,
      user: userData,
    };
  }

  // Get user avatar by ID (public route)


  // Search users
  @Get('search')
  async searchUsers(
    @Query('q') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    console.log('🟡 [CONTROLLER] Search request received:', { query, page, limit });
    
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters long');
    }

    try {
      const results = await this.usersService.searchUsers(query, page, limit);
      
      console.log('🟢 [CONTROLLER] Search completed. Results:', results.users.length);
      
      return {
        success: true,
        message: results.users.length > 0 ? 'Users found successfully' : 'No users found matching your search',
        data: results
      };
      
    } catch (error) {
      console.error('🔴 [CONTROLLER] Search error:', error);
      return {
        success: true,
        message: 'Search completed',
        data: {
          users: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalResults: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          searchQuery: query
        }
      };
    }
  }

  // Get suggested users to follow
  @Get('suggestions')
  async getSuggestedUsers(
    @Req() req: any,
    @Query('limit') limit: number = 10
  ) {
    const suggestions = await this.usersService.getSuggestedUsers(req.user.userId, limit);
    
    return {
      success: true,
      message: 'Suggested users retrieved successfully',
      data: suggestions
    };
  }

  // Get popular users (discover page)
  @Get('discover/popular')
  async getPopularUsers(@Query('limit') limit: number = 20) {
    const popularUsers = await this.usersService.getPopularUsers(limit);
    
    return {
      success: true,
      message: 'Popular users retrieved successfully',
      data: popularUsers
    };
  }

  // Get follow requests (for private accounts)
  @Get('follow-requests')
  async getFollowRequests(@Req() req: any) {
    const requests = await this.usersService.getFollowRequests(req.user.userId);
    
    return {
      success: true,
      message: 'Follow requests retrieved successfully',
      data: requests
    };
  }

  // Check if current user follows a specific user
  @Get('relationship/:targetUserId')
  async getRelationship(@Req() req: any, @Param('targetUserId') targetUserId: string) {
    const relationship = await this.usersService.getRelationship(req.user.userId, targetUserId);
    
    return {
      success: true,
      message: 'Relationship status retrieved',
      data: relationship
    };
  }

  // Follow a user
  @Post('follow/:userId')
  async followUser(@Req() req: any, @Param('userId') targetUserId: string) {
    if (req.user.userId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const result = await this.usersService.followUser(req.user.userId, targetUserId);
    
    return {
      success: true,
      message: result.message,
      data: result
    };
  }

  // Unfollow a user
  @Delete('unfollow/:userId')
  async unfollowUser(@Req() req: any, @Param('userId') targetUserId: string) {
    const result = await this.usersService.unfollowUser(req.user.userId, targetUserId);
    
    return {
      success: true,
      message: 'Unfollowed successfully',
      data: result
    };
  }

  // Accept follow request (for private accounts)
  @Post('follow-requests/:requestId/accept')
  async acceptFollowRequest(@Req() req: any, @Param('requestId') requestId: string) {
    const result = await this.usersService.acceptFollowRequest(req.user.userId, requestId);
    
    return {
      success: true,
      message: 'Follow request accepted',
      data: result
    };
  }

  // Reject follow request (for private accounts)
  @Post('follow-requests/:requestId/reject')
  async rejectFollowRequest(@Req() req: any, @Param('requestId') requestId: string) {
    const result = await this.usersService.rejectFollowRequest(req.user.userId, requestId);
    
    return {
      success: true,
      message: 'Follow request rejected',
      data: result
    };
  }

  // Remove follower
  @Delete('followers/:followerId')
  async removeFollower(@Req() req: any, @Param('followerId') followerId: string) {
    const result = await this.usersService.removeFollower(req.user.userId, followerId);
    
    return {
      success: true,
      message: 'Follower removed successfully',
      data: result
    };
  }

  // ========== PARAMETER ROUTES (MUST COME LAST) ==========

  // Get user profile by username - THIS MUST BE LAST
  @Get(':username')
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userData = this.usersService.toJSON(user);
    
    return {
      success: true,
      message: 'User profile retrieved successfully',
      data: userData
    };
  }

  // Get user's followers
  @Get(':userId/followers')
  async getFollowers(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    const followers = await this.usersService.getFollowers(userId, page, limit);
    
    return {
      success: true,
      message: 'Followers retrieved successfully',
      data: followers
    };
  }

  // Get user's following
  @Get(':userId/following')
  async getFollowing(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    const following = await this.usersService.getFollowing(userId, page, limit);
    
    return {
      success: true,
      message: 'Following retrieved successfully',
      data: following
    };
  }
}