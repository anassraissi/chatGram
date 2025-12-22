import { 
  Injectable, 
  ConflictException, 
  NotFoundException, 
  InternalServerErrorException,
  BadRequestException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { FollowRequest, FollowRequestDocument } from './schemas/follow-request.schema';
import * as bcrypt from 'bcryptjs';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(FollowRequest.name) private followRequestModel: Model<FollowRequestDocument>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService?: NotificationsService,
  ) {}

  // Create new user
  async create(createUserDto: any): Promise<UserDocument> {
    const { email, username, password, profile } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already exists');
      }
    }

    try {
      const user = new this.userModel({
        email,
        username,
        password,
        profile: profile || {
          name: createUserDto.name || '',
          bio: '',
          avatar: '',
          website: '',
          gender: 'prefer-not-to-say',
          location: '',
          coverImage: ''
        },
        stats: {
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
          likesCount: 0
        },
        account: {
          isEmailVerified: false,
          isActive: true,
          lastLogin: null,
          role: 'user'
        },
        following: [],
        followers: [],
        isPrivate: false
      });

      return await user.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('User already exists');
      }
      throw new InternalServerErrorException('Could not create user');
    }
  }

  // Update user avatar
  async updateAvatar(userId: string, avatarUrl: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { 'profile.avatar': avatarUrl } },
      { new: true }
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    console.log('✅ Avatar updated for user:', userId);
    return user;
  }

  // Get user avatar URL/data
  async getUserAvatar(userId: string): Promise<{ avatar?: string } | null> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel.findById(userId).select('profile.avatar');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { avatar: user.profile?.avatar ?? undefined };
  }

  // Update user cover image
  async updateCoverImage(userId: string, coverUrl: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { 'profile.coverImage': coverUrl } },
      { new: true }
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    console.log('✅ Cover image updated for user:', userId);
    return user;
  }

  // Find user by email or username (for login)
  async findByEmailOrUsername(identifier: string): Promise<UserDocument | null> {
    try {
    const user = await this.userModel.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    }).select('+password').exec();

      if (user) {
        console.log('🔍 User found in database:', {
          username: user.username,
          email: user.email,
          hasPassword: !!user.password,
          passwordType: typeof user.password,
          passwordLength: user.password ? user.password.length : 0,
          userId: (user as any)._id?.toString()
        });
      } else {
        console.log('❌ User not found for identifier:', identifier);
      }

    return user;
    } catch (error) {
      console.error('❌ Error finding user:', error);
      throw error;
    }
  }

  // Find user by ID
  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel.findById(id);
  }

  // Find user by email
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  // Find user by username
  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username });
  }

  // Update user profile
  async updateProfile(userId: string, updateData: any): Promise<UserDocument> {
    console.log('🔄 Updating profile for user:', userId);
    
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    // Validate and sanitize input data
    const updateFields: any = {};
    
    if (updateData.name !== undefined) {
      if (typeof updateData.name !== 'string' || updateData.name.length > 50) {
        throw new BadRequestException('Name must be a string and cannot exceed 50 characters');
      }
      updateFields['profile.name'] = updateData.name.trim();
    }

    if (updateData.bio !== undefined) {
      if (typeof updateData.bio !== 'string' || updateData.bio.length > 150) {
        throw new BadRequestException('Bio must be a string and cannot exceed 150 characters');
      }
      updateFields['profile.bio'] = updateData.bio.trim();
    }

    if (updateData.location !== undefined) {
      if (typeof updateData.location !== 'string' || updateData.location.length > 50) {
        throw new BadRequestException('Location must be a string and cannot exceed 50 characters');
      }
      updateFields['profile.location'] = updateData.location.trim();
    }

    if (updateData.website !== undefined) {
      if (updateData.website && typeof updateData.website !== 'string') {
        throw new BadRequestException('Website must be a valid URL string');
      }
      if (updateData.website && !updateData.website.match(/^https?:\/\/.+\..+$/)) {
        throw new BadRequestException('Please enter a valid website URL');
      }
      updateFields['profile.website'] = updateData.website ? updateData.website.trim() : '';
    }

    if (updateData.gender !== undefined) {
      const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
      if (!validGenders.includes(updateData.gender)) {
        throw new BadRequestException('Invalid gender value');
      }
      updateFields['profile.gender'] = updateData.gender;
    }

    if (updateData.isPrivate !== undefined) {
      if (typeof updateData.isPrivate !== 'boolean') {
        throw new BadRequestException('isPrivate must be a boolean value');
      }
      updateFields['isPrivate'] = updateData.isPrivate;
    }

    // Only update if there are fields to update
    if (Object.keys(updateFields).length === 0) {
      throw new BadRequestException('No valid fields to update');
    }

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      console.log('❌ User not found with ID:', userId);
      throw new NotFoundException('User not found');
    }

    console.log('✅ Profile updated successfully');
    return user;
  }

  // Update last login
  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { 'account.lastLogin': new Date() }
    });
  }

  // Convert to JSON (remove sensitive data)
  toJSON(user: any): any {
    if (user && typeof (user as any).toObject === 'function') {
      const userObj = (user as any).toObject();
      if (userObj && typeof userObj === 'object') {
        delete userObj.password;
      }
      return userObj;
    }
    return user;
  }

  // Validate password manually
  async validatePassword(user: UserDocument, candidatePassword: string): Promise<boolean> {
    if (!user.password) {
      console.log('❌ Password validation failed: No password field on user');
      console.log('🔍 User object keys:', Object.keys(user));
      return false;
    }
    
    try {
      console.log('🔍 Comparing password:', {
        candidateLength: candidatePassword.length,
        storedHashPrefix: user.password.substring(0, 20),
        storedHashLength: user.password.length
      });
      
      const result = await bcrypt.compare(candidatePassword, user.password);
      console.log('🔍 Bcrypt compare result:', result);
      
      if (!result) {
        console.log('❌ Password mismatch');
        console.log('🔍 Candidate password:', candidatePassword);
        console.log('🔍 Stored hash:', user.password.substring(0, 30) + '...');
      } else {
        console.log('✅ Password match confirmed');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error during password comparison:', error);
      return false;
    }
  }

  // Get user stats
  async getUserStats(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userObj = user.toObject();
    
    return {
      postsCount: userObj.stats.postsCount,
      followersCount: userObj.stats.followersCount,
      followingCount: userObj.stats.followingCount,
      likesCount: userObj.stats.likesCount || 0,
      accountAge: Math.floor((Date.now() - userObj.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    };
  }

  // ========== FOLLOW SYSTEM ==========

  // Follow a user (Instagram-style)
  async followUser(followerId: string, targetUserId: string): Promise<any> {
    console.log('🔍 [FOLLOW] Starting follow process...');
    console.log('🔍 [FOLLOW] followerId:', followerId);
    console.log('🔍 [FOLLOW] targetUserId:', targetUserId);

    try {
      // Validate IDs
      if (!Types.ObjectId.isValid(followerId) || !Types.ObjectId.isValid(targetUserId)) {
        console.log('❌ [FOLLOW] Invalid ID format');
        throw new BadRequestException('Invalid user ID format');
      }

      console.log('✅ [FOLLOW] ID validation passed');

      if (followerId === targetUserId) {
        throw new BadRequestException('You cannot follow yourself');
      }

      console.log('🔍 [FOLLOW] Finding users...');
      const [follower, targetUser] = await Promise.all([
      this.userModel.findById(followerId),
      this.userModel.findById(targetUserId)
    ]);

    if (!follower || !targetUser) {
      throw new NotFoundException('User not found');
    }

    console.log('🔍 [FOLLOW] Follower isPrivate:', follower.isPrivate);
    console.log('🔍 [FOLLOW] Target isPrivate:', targetUser.isPrivate);

    // Check if already following
    const isAlreadyFollowing = follower.following.some(followingId => 
      followingId.toString() === targetUserId
    );

    if (isAlreadyFollowing) {
      throw new ConflictException('Already following this user');
    }

    // ========== FIXED LOGIC ==========
    
    // ONLY send follow request if TARGET account is private
    if (targetUser.isPrivate) {
      console.log('🔍 [FOLLOW] Target is private - creating follow request');
      
      // Convert to ObjectIds for FollowRequest
      const followerObjectId = new Types.ObjectId(followerId);
      const targetObjectId = new Types.ObjectId(targetUserId);

      // Check for existing pending request
      const existingRequest = await this.followRequestModel.findOne({
        requester: followerObjectId,
        targetUser: targetObjectId,
        status: 'pending'
      });

      if (existingRequest) {
        throw new ConflictException('Follow request already sent');
      }

      // Create follow request
      const followRequest = new this.followRequestModel({
        requester: followerObjectId,
        targetUser: targetObjectId,
        status: 'pending'
      });

      await followRequest.save();

      // Send notification to target user
      if (this.notificationsService) {
        await this.notificationsService.createNotification(
          targetUserId,
          followerId,
          NotificationType.FOLLOW_REQUEST,
          { targetUserId }
        );
      }

      return {
        message: 'Follow request sent',
        isPrivate: true,
        status: 'pending',
        requestId: followRequest._id
      };
    } else {
      // Target is public - follow immediately (regardless of follower's privacy)
      console.log('🔍 [FOLLOW] Target is public - following immediately');
      
      await this.userModel.findByIdAndUpdate(
        followerId,
        { 
          $addToSet: { following: new Types.ObjectId(targetUserId) },
          $inc: { 'stats.followingCount': 1 }
        }
      );

      await this.userModel.findByIdAndUpdate(
        targetUserId,
        { 
          $addToSet: { followers: new Types.ObjectId(followerId) },
          $inc: { 'stats.followersCount': 1 }
        }
      );

      // Send notification to target user
      if (this.notificationsService) {
        await this.notificationsService.createNotification(
          targetUserId,
          followerId,
          NotificationType.FOLLOW,
          { targetUserId }
        );
      }

      return {
        message: 'Successfully followed user',
        isPrivate: false,
        status: 'following'
      };
    }

  } catch (error) {
    console.log('❌ [FOLLOW] Error:', error.message);
    throw new InternalServerErrorException('Could not follow user: ' + error.message);
  }
}
  // Accept follow request
  async acceptFollowRequest(userId: string, requestId: string): Promise<any> {
    console.log('🔍 [ACCEPT] Starting accept process...');
    console.log('🔍 [ACCEPT] userId (target):', userId);
    console.log('🔍 [ACCEPT] requestId:', requestId);

    try {
      if (!Types.ObjectId.isValid(requestId)) {
        throw new BadRequestException('Invalid request ID');
      }

      // Convert to ObjectIds for proper comparison
      const requestObjectId = new Types.ObjectId(requestId);
      const userObjectId = new Types.ObjectId(userId);

      console.log('🔍 [ACCEPT] Finding follow request...');
      
      // Find the follow request
      const followRequest = await this.followRequestModel.findOne({
        _id: requestObjectId,
        targetUser: userObjectId,
        status: 'pending'
      });

      console.log('🔍 [ACCEPT] Follow request found:', !!followRequest);
      
      if (!followRequest) {
        console.log('❌ [ACCEPT] No pending follow request found');
        throw new NotFoundException('Follow request not found or already processed');
      }

      console.log('🔍 [ACCEPT] Request details:', {
        requester: followRequest.requester,
        targetUser: followRequest.targetUser,
        status: followRequest.status
      });

      // Update the follow request status
      console.log('🔍 [ACCEPT] Updating follow request status...');
      await this.followRequestModel.findByIdAndUpdate(
        requestObjectId,
        {
          status: 'accepted',
          respondedAt: new Date()
        }
      );

      console.log('🔍 [ACCEPT] Creating follow relationship...');
      
      // Create the actual follow relationship
      await this.userModel.findByIdAndUpdate(
        followRequest.requester,
        { 
          $addToSet: { following: userObjectId },
          $inc: { 'stats.followingCount': 1 }
        }
      );

      await this.userModel.findByIdAndUpdate(
        userObjectId,
        { 
          $addToSet: { followers: followRequest.requester },
          $inc: { 'stats.followersCount': 1 }
        }
      );

      // Send notification to requester
      if (this.notificationsService) {
        await this.notificationsService.createNotification(
          followRequest.requester.toString(),
          userId,
          NotificationType.FOLLOW_REQUEST_ACCEPTED,
          { targetUserId: userId }
        );
      }

      console.log('✅ [ACCEPT] Follow request accepted successfully!');
      
      return {
        message: 'Follow request accepted',
        acceptedUserId: followRequest.requester,
        requestId: followRequest._id
      };

    } catch (error) {
      console.log('❌ [ACCEPT] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Could not accept follow request: ' + error.message);
    }
  }

  // Reject follow request
  async rejectFollowRequest(userId: string, requestId: string): Promise<any> {
    console.log('🔍 [REJECT] Starting reject process...');
    
    try {
      if (!Types.ObjectId.isValid(requestId)) {
        throw new BadRequestException('Invalid request ID');
      }

      const requestObjectId = new Types.ObjectId(requestId);
      const userObjectId = new Types.ObjectId(userId);

      const followRequest = await this.followRequestModel.findOneAndUpdate(
        {
          _id: requestObjectId,
          targetUser: userObjectId,
          status: 'pending'
        },
        {
          status: 'rejected',
          respondedAt: new Date()
        },
        { new: true }
      );

      if (!followRequest) {
        throw new NotFoundException('Follow request not found or already processed');
      }

      console.log('✅ [REJECT] Follow request rejected successfully!');
      
      return {
        message: 'Follow request rejected',
        rejectedUserId: followRequest.requester,
        requestId: followRequest._id
      };

    } catch (error) {
      console.log('❌ [REJECT] Error:', error);
      throw new InternalServerErrorException('Could not reject follow request: ' + error.message);
    }
  }

  // Cancel follow request (if user wants to withdraw)
  async cancelFollowRequest(requesterId: string, targetUserId: string): Promise<any> {
    const requesterObjectId = new Types.ObjectId(requesterId);
    const targetObjectId = new Types.ObjectId(targetUserId);

    const result = await this.followRequestModel.findOneAndDelete({
      requester: requesterObjectId,
      targetUser: targetObjectId,
      status: 'pending'
    });

    if (!result) {
      throw new NotFoundException('No pending follow request found');
    }

    return {
      message: 'Follow request cancelled',
      cancelledUserId: targetUserId
    };
  }

  // Get follow requests for a user
  async getFollowRequests(userId: string): Promise<any> {
    console.log('🔍 [GET REQUESTS] Getting follow requests for user:', userId);
    
    try {
      const userObjectId = new Types.ObjectId(userId);
      
      console.log('🔍 [GET REQUESTS] Searching for requests with targetUser:', userObjectId);
      
      const requests = await this.followRequestModel
        .find({
          targetUser: userObjectId,
          status: 'pending'
        })
        .populate('requester', 'username profile.name profile.avatar profile.bio isPrivate stats.followersCount stats.followingCount')
        .sort({ createdAt: -1 })
        .exec();

      console.log('🔍 [GET REQUESTS] Found requests:', requests.length);
      
      return requests.map(request => ({
        _id: request._id,
        requester: this.toJSON(request.requester),
        createdAt: request.createdAt,
        status: request.status
      }));
    } catch (error) {
      console.log('❌ [GET REQUESTS] Error:', error);
      return [];
    }
  }

  // Unfollow user (works for both public and private)
  async unfollowUser(followerId: string, targetUserId: string): Promise<any> {
    console.log('🔍 [UNFOLLOW] Starting unfollow process...');
    
    try {
      // Convert string IDs to ObjectIds for proper comparison
      const followerObjectId = new Types.ObjectId(followerId);
      const targetObjectId = new Types.ObjectId(targetUserId);

      console.log('🔍 [UNFOLLOW] Using ObjectIds:', {
        followerObjectId,
        targetObjectId
      });

      // Check if actually following before unfollowing
      const follower = await this.userModel.findById(followerId);
      if (!follower) {
        throw new NotFoundException('Follower not found');
      }

      const isFollowing = follower.following.some(followingId => 
        followingId.toString() === targetUserId
      );

      if (!isFollowing) {
        throw new BadRequestException('You are not following this user');
      }

      // Remove from follower's following array
      const updateFollower = await this.userModel.findByIdAndUpdate(
        followerId,
        { 
          $pull: { following: targetObjectId },
          $inc: { 'stats.followingCount': -1 }
        },
        { new: true }
      );

      // Ensure count doesn't go negative
      if (updateFollower && updateFollower.stats.followingCount < 0) {
        await this.userModel.findByIdAndUpdate(followerId, {
          $set: { 'stats.followingCount': 0 }
        });
      }

      console.log('✅ [UNFOLLOW] Follower updated:', {
        followingCount: updateFollower?.stats.followingCount,
        followingArray: updateFollower?.following
      });

      // Remove from target's followers array
      const updateTarget = await this.userModel.findByIdAndUpdate(
        targetUserId,
        { 
          $pull: { followers: followerObjectId },
          $inc: { 'stats.followersCount': -1 }
        },
        { new: true }
      );

      // Ensure count doesn't go negative
      if (updateTarget && updateTarget.stats.followersCount < 0) {
        await this.userModel.findByIdAndUpdate(targetUserId, {
          $set: { 'stats.followersCount': 0 }
        });
      }

      console.log('✅ [UNFOLLOW] Target updated:', {
        followersCount: updateTarget?.stats.followersCount,
        followersArray: updateTarget?.followers
      });

      console.log('✅ [UNFOLLOW] Unfollow successful!');
      
      return {
        message: 'Unfollowed successfully',
        unfollowedUserId: targetUserId
      };

    } catch (error) {
      console.log('❌ [UNFOLLOW] Error:', error);
      throw new InternalServerErrorException('Could not unfollow user: ' + error.message);
    }
  }

  // Remove a follower
  async removeFollower(userId: string, followerId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(followerId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const userObjectId = new Types.ObjectId(userId);
    const followerObjectId = new Types.ObjectId(followerId);

    try {
      // Check if follower actually exists in user's followers
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isFollower = user.followers.some(fId => 
        fId.toString() === followerId
      );

      if (!isFollower) {
        throw new BadRequestException('This user is not your follower');
      }

      // Remove from user's followers
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        { 
          $pull: { followers: followerObjectId },
          $inc: { 'stats.followersCount': -1 }
        },
        { new: true }
      );

      // Ensure count doesn't go negative
      if (updatedUser && updatedUser.stats.followersCount < 0) {
        await this.userModel.findByIdAndUpdate(userId, {
          $set: { 'stats.followersCount': 0 }
        });
      }

      // Remove from follower's following
      const updatedFollower = await this.userModel.findByIdAndUpdate(
        followerId,
        { 
          $pull: { following: userObjectId },
          $inc: { 'stats.followingCount': -1 }
        },
        { new: true }
      );

      // Ensure count doesn't go negative
      if (updatedFollower && updatedFollower.stats.followingCount < 0) {
        await this.userModel.findByIdAndUpdate(followerId, {
          $set: { 'stats.followingCount': 0 }
        });
      }

      // Delete any pending follow requests between these users
      await this.followRequestModel.deleteMany({
        $or: [
          { requester: followerObjectId, targetUser: userObjectId },
          { requester: userObjectId, targetUser: followerObjectId }
        ],
        status: 'pending'
      });

      return {
        message: 'Follower removed successfully',
        removedFollowerId: followerId
      };
    } catch (error) {
      throw new InternalServerErrorException('Could not remove follower');
    }
  }

  // Enhanced relationship status
  async getRelationship(currentUserId: string, targetUserId: string): Promise<any> {
    if (!Types.ObjectId.isValid(currentUserId) || !Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const currentUserObjectId = new Types.ObjectId(currentUserId);
    const targetUserObjectId = new Types.ObjectId(targetUserId);

    const [currentUser, targetUser, pendingRequest] = await Promise.all([
      this.userModel.findById(currentUserId),
      this.userModel.findById(targetUserId),
      this.followRequestModel.findOne({
        requester: currentUserObjectId,
        targetUser: targetUserObjectId,
        status: 'pending'
      })
    ]);

    if (!currentUser || !targetUser) {
      throw new NotFoundException('User not found');
    }

    const isFollowing = currentUser.following.some(followingId => 
      followingId.toString() === targetUserId
    );
    const isFollowedBy = targetUser.followers.some(followerId => 
      followerId.toString() === currentUserId
    );
    const isPrivate = targetUser.isPrivate;
    const hasPendingRequest = !!pendingRequest;

    let status: string;
    if (isFollowing) {
      status = 'following';
    } else if (hasPendingRequest) {
      status = 'requested';
    } else if (isPrivate) {
      status = 'not_following_private';
    } else {
      status = 'not_following';
    }

    return {
      isFollowing,
      isFollowedBy,
      isPrivate,
      hasPendingRequest,
      canMessage: isFollowing || !isPrivate,
      status,
      requestId: pendingRequest?._id
    };
  }

  // ========== SEARCH AND SUGGESTIONS ==========

  // Search users by username or name
  async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<any> {
    const searchRegex = new RegExp(query, 'i');
    
    const searchConditions = {
      $or: [
        { username: searchRegex },
        { 'profile.name': searchRegex }
      ],
      'account.isActive': true
    };
    
    try {
      const users = await this.userModel
        .find(searchConditions)
        .select('username profile.name profile.avatar profile.bio isPrivate stats.followersCount stats.followingCount')
        .sort({ 'stats.followersCount': -1, 'profile.name': 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      const total = await this.userModel.countDocuments(searchConditions);
      const totalPages = Math.ceil(total / limit);

      return {
        users: users.map(user => this.toJSON(user)),
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalResults: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        searchQuery: query
      };
      
    } catch (error) {
      console.error('Search error:', error);
      return {
        users: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalResults: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        searchQuery: query
      };
    }
  }

  // Get suggested users to follow
  async getSuggestedUsers(currentUserId: string, limit: number = 10): Promise<any> {
    const currentUser = await this.userModel.findById(currentUserId);
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    // Get list of user IDs to exclude (current user + users already following)
    const excludeIds = [
      new Types.ObjectId(currentUserId),
      ...currentUser.following.map(id => new Types.ObjectId(id))
    ];

    const suggestions = await this.userModel
      .find({
        _id: { $nin: excludeIds },
        'account.isActive': true
      })
      .select('username profile.name profile.avatar profile.bio isPrivate stats.followersCount stats.postsCount')
      .sort({ 'stats.followersCount': -1, 'stats.postsCount': -1 })
      .limit(limit)
      .exec();

    return suggestions.map(user => this.toJSON(user));
  }

  // Get popular users
  async getPopularUsers(limit: number = 20): Promise<any> {
    const popularUsers = await this.userModel
      .find({
        'account.isActive': true,
        'stats.followersCount': { $gt: 0 }
      })
      .select('username profile.name profile.avatar profile.bio isPrivate stats.followersCount stats.postsCount')
      .sort({ 'stats.followersCount': -1, 'stats.postsCount': -1 })
      .limit(limit)
      .exec();

    return popularUsers.map(user => this.toJSON(user));
  }

  // Get followers with pagination
  async getFollowers(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel.findById(userId).populate({
      path: 'followers',
      select: 'username profile.name profile.avatar profile.bio isPrivate stats.followersCount stats.followingCount',
      options: {
        skip: (page - 1) * limit,
        limit: limit
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalFollowers = await this.userModel.findById(userId).select('followers');
    const totalCount = (totalFollowers && Array.isArray((totalFollowers as any).followers))
      ? (totalFollowers as any).followers.length
      : 0;
    const totalPages = Math.ceil(totalCount / limit) || 0;

    return {
      followers: user.followers.map(follower => this.toJSON(follower)),
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalFollowers: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  // Get following with pagination
  async getFollowing(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel.findById(userId).populate({
      path: 'following',
      select: 'username profile.name profile.avatar profile.bio isPrivate stats.followersCount stats.followingCount',
      options: {
        skip: (page - 1) * limit,
        limit: limit
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalFollowing = await this.userModel.findById(userId).select('following');
    const totalCount = (totalFollowing && Array.isArray((totalFollowing as any).following))
      ? (totalFollowing as any).following.length
      : 0;
    const totalPages = Math.ceil(totalCount / limit) || 0;

    return {
      following: user.following.map(following => this.toJSON(following)),
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalFollowing: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }
}