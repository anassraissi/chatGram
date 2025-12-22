"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
const follow_request_schema_1 = require("./schemas/follow-request.schema");
const bcrypt = __importStar(require("bcryptjs"));
const notifications_service_1 = require("../notifications/notifications.service");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
let UsersService = class UsersService {
    userModel;
    followRequestModel;
    notificationsService;
    constructor(userModel, followRequestModel, notificationsService) {
        this.userModel = userModel;
        this.followRequestModel = followRequestModel;
        this.notificationsService = notificationsService;
    }
    async create(createUserDto) {
        const { email, username, password, profile } = createUserDto;
        const existingUser = await this.userModel.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            if (existingUser.email === email) {
                throw new common_1.ConflictException('Email already exists');
            }
            if (existingUser.username === username) {
                throw new common_1.ConflictException('Username already exists');
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
        }
        catch (error) {
            if (error.code === 11000) {
                throw new common_1.ConflictException('User already exists');
            }
            throw new common_1.InternalServerErrorException('Could not create user');
        }
    }
    async updateAvatar(userId, avatarUrl) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const user = await this.userModel.findByIdAndUpdate(userId, { $set: { 'profile.avatar': avatarUrl } }, { new: true });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        console.log('✅ Avatar updated for user:', userId);
        return user;
    }
    async getUserAvatar(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const user = await this.userModel.findById(userId).select('profile.avatar');
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return { avatar: user.profile?.avatar ?? undefined };
    }
    async updateCoverImage(userId, coverUrl) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const user = await this.userModel.findByIdAndUpdate(userId, { $set: { 'profile.coverImage': coverUrl } }, { new: true });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        console.log('✅ Cover image updated for user:', userId);
        return user;
    }
    async findByEmailOrUsername(identifier) {
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
                    userId: user._id?.toString()
                });
            }
            else {
                console.log('❌ User not found for identifier:', identifier);
            }
            return user;
        }
        catch (error) {
            console.error('❌ Error finding user:', error);
            throw error;
        }
    }
    async findById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            return null;
        }
        return this.userModel.findById(id);
    }
    async findByEmail(email) {
        return this.userModel.findOne({ email: email.toLowerCase() });
    }
    async findByUsername(username) {
        return this.userModel.findOne({ username });
    }
    async updateProfile(userId, updateData) {
        console.log('🔄 Updating profile for user:', userId);
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const updateFields = {};
        if (updateData.name !== undefined) {
            if (typeof updateData.name !== 'string' || updateData.name.length > 50) {
                throw new common_1.BadRequestException('Name must be a string and cannot exceed 50 characters');
            }
            updateFields['profile.name'] = updateData.name.trim();
        }
        if (updateData.bio !== undefined) {
            if (typeof updateData.bio !== 'string' || updateData.bio.length > 150) {
                throw new common_1.BadRequestException('Bio must be a string and cannot exceed 150 characters');
            }
            updateFields['profile.bio'] = updateData.bio.trim();
        }
        if (updateData.location !== undefined) {
            if (typeof updateData.location !== 'string' || updateData.location.length > 50) {
                throw new common_1.BadRequestException('Location must be a string and cannot exceed 50 characters');
            }
            updateFields['profile.location'] = updateData.location.trim();
        }
        if (updateData.website !== undefined) {
            if (updateData.website && typeof updateData.website !== 'string') {
                throw new common_1.BadRequestException('Website must be a valid URL string');
            }
            if (updateData.website && !updateData.website.match(/^https?:\/\/.+\..+$/)) {
                throw new common_1.BadRequestException('Please enter a valid website URL');
            }
            updateFields['profile.website'] = updateData.website ? updateData.website.trim() : '';
        }
        if (updateData.gender !== undefined) {
            const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
            if (!validGenders.includes(updateData.gender)) {
                throw new common_1.BadRequestException('Invalid gender value');
            }
            updateFields['profile.gender'] = updateData.gender;
        }
        if (updateData.isPrivate !== undefined) {
            if (typeof updateData.isPrivate !== 'boolean') {
                throw new common_1.BadRequestException('isPrivate must be a boolean value');
            }
            updateFields['isPrivate'] = updateData.isPrivate;
        }
        if (Object.keys(updateFields).length === 0) {
            throw new common_1.BadRequestException('No valid fields to update');
        }
        const user = await this.userModel.findByIdAndUpdate(userId, { $set: updateFields }, { new: true, runValidators: true });
        if (!user) {
            console.log('❌ User not found with ID:', userId);
            throw new common_1.NotFoundException('User not found');
        }
        console.log('✅ Profile updated successfully');
        return user;
    }
    async updateLastLogin(userId) {
        await this.userModel.findByIdAndUpdate(userId, {
            $set: { 'account.lastLogin': new Date() }
        });
    }
    toJSON(user) {
        if (user && typeof user.toObject === 'function') {
            const userObj = user.toObject();
            if (userObj && typeof userObj === 'object') {
                delete userObj.password;
            }
            return userObj;
        }
        return user;
    }
    async validatePassword(user, candidatePassword) {
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
            }
            else {
                console.log('✅ Password match confirmed');
            }
            return result;
        }
        catch (error) {
            console.error('❌ Error during password comparison:', error);
            return false;
        }
    }
    async getUserStats(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
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
    async followUser(followerId, targetUserId) {
        console.log('🔍 [FOLLOW] Starting follow process...');
        console.log('🔍 [FOLLOW] followerId:', followerId);
        console.log('🔍 [FOLLOW] targetUserId:', targetUserId);
        try {
            if (!mongoose_2.Types.ObjectId.isValid(followerId) || !mongoose_2.Types.ObjectId.isValid(targetUserId)) {
                console.log('❌ [FOLLOW] Invalid ID format');
                throw new common_1.BadRequestException('Invalid user ID format');
            }
            console.log('✅ [FOLLOW] ID validation passed');
            if (followerId === targetUserId) {
                throw new common_1.BadRequestException('You cannot follow yourself');
            }
            console.log('🔍 [FOLLOW] Finding users...');
            const [follower, targetUser] = await Promise.all([
                this.userModel.findById(followerId),
                this.userModel.findById(targetUserId)
            ]);
            if (!follower || !targetUser) {
                throw new common_1.NotFoundException('User not found');
            }
            console.log('🔍 [FOLLOW] Follower isPrivate:', follower.isPrivate);
            console.log('🔍 [FOLLOW] Target isPrivate:', targetUser.isPrivate);
            const isAlreadyFollowing = follower.following.some(followingId => followingId.toString() === targetUserId);
            if (isAlreadyFollowing) {
                throw new common_1.ConflictException('Already following this user');
            }
            if (targetUser.isPrivate) {
                console.log('🔍 [FOLLOW] Target is private - creating follow request');
                const followerObjectId = new mongoose_2.Types.ObjectId(followerId);
                const targetObjectId = new mongoose_2.Types.ObjectId(targetUserId);
                const existingRequest = await this.followRequestModel.findOne({
                    requester: followerObjectId,
                    targetUser: targetObjectId,
                    status: 'pending'
                });
                if (existingRequest) {
                    throw new common_1.ConflictException('Follow request already sent');
                }
                const followRequest = new this.followRequestModel({
                    requester: followerObjectId,
                    targetUser: targetObjectId,
                    status: 'pending'
                });
                await followRequest.save();
                if (this.notificationsService) {
                    await this.notificationsService.createNotification(targetUserId, followerId, notification_schema_1.NotificationType.FOLLOW_REQUEST, { targetUserId });
                }
                return {
                    message: 'Follow request sent',
                    isPrivate: true,
                    status: 'pending',
                    requestId: followRequest._id
                };
            }
            else {
                console.log('🔍 [FOLLOW] Target is public - following immediately');
                await this.userModel.findByIdAndUpdate(followerId, {
                    $addToSet: { following: new mongoose_2.Types.ObjectId(targetUserId) },
                    $inc: { 'stats.followingCount': 1 }
                });
                await this.userModel.findByIdAndUpdate(targetUserId, {
                    $addToSet: { followers: new mongoose_2.Types.ObjectId(followerId) },
                    $inc: { 'stats.followersCount': 1 }
                });
                if (this.notificationsService) {
                    await this.notificationsService.createNotification(targetUserId, followerId, notification_schema_1.NotificationType.FOLLOW, { targetUserId });
                }
                return {
                    message: 'Successfully followed user',
                    isPrivate: false,
                    status: 'following'
                };
            }
        }
        catch (error) {
            console.log('❌ [FOLLOW] Error:', error.message);
            throw new common_1.InternalServerErrorException('Could not follow user: ' + error.message);
        }
    }
    async acceptFollowRequest(userId, requestId) {
        console.log('🔍 [ACCEPT] Starting accept process...');
        console.log('🔍 [ACCEPT] userId (target):', userId);
        console.log('🔍 [ACCEPT] requestId:', requestId);
        try {
            if (!mongoose_2.Types.ObjectId.isValid(requestId)) {
                throw new common_1.BadRequestException('Invalid request ID');
            }
            const requestObjectId = new mongoose_2.Types.ObjectId(requestId);
            const userObjectId = new mongoose_2.Types.ObjectId(userId);
            console.log('🔍 [ACCEPT] Finding follow request...');
            const followRequest = await this.followRequestModel.findOne({
                _id: requestObjectId,
                targetUser: userObjectId,
                status: 'pending'
            });
            console.log('🔍 [ACCEPT] Follow request found:', !!followRequest);
            if (!followRequest) {
                console.log('❌ [ACCEPT] No pending follow request found');
                throw new common_1.NotFoundException('Follow request not found or already processed');
            }
            console.log('🔍 [ACCEPT] Request details:', {
                requester: followRequest.requester,
                targetUser: followRequest.targetUser,
                status: followRequest.status
            });
            console.log('🔍 [ACCEPT] Updating follow request status...');
            await this.followRequestModel.findByIdAndUpdate(requestObjectId, {
                status: 'accepted',
                respondedAt: new Date()
            });
            console.log('🔍 [ACCEPT] Creating follow relationship...');
            await this.userModel.findByIdAndUpdate(followRequest.requester, {
                $addToSet: { following: userObjectId },
                $inc: { 'stats.followingCount': 1 }
            });
            await this.userModel.findByIdAndUpdate(userObjectId, {
                $addToSet: { followers: followRequest.requester },
                $inc: { 'stats.followersCount': 1 }
            });
            if (this.notificationsService) {
                await this.notificationsService.createNotification(followRequest.requester.toString(), userId, notification_schema_1.NotificationType.FOLLOW_REQUEST_ACCEPTED, { targetUserId: userId });
            }
            console.log('✅ [ACCEPT] Follow request accepted successfully!');
            return {
                message: 'Follow request accepted',
                acceptedUserId: followRequest.requester,
                requestId: followRequest._id
            };
        }
        catch (error) {
            console.log('❌ [ACCEPT] Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Could not accept follow request: ' + error.message);
        }
    }
    async rejectFollowRequest(userId, requestId) {
        console.log('🔍 [REJECT] Starting reject process...');
        try {
            if (!mongoose_2.Types.ObjectId.isValid(requestId)) {
                throw new common_1.BadRequestException('Invalid request ID');
            }
            const requestObjectId = new mongoose_2.Types.ObjectId(requestId);
            const userObjectId = new mongoose_2.Types.ObjectId(userId);
            const followRequest = await this.followRequestModel.findOneAndUpdate({
                _id: requestObjectId,
                targetUser: userObjectId,
                status: 'pending'
            }, {
                status: 'rejected',
                respondedAt: new Date()
            }, { new: true });
            if (!followRequest) {
                throw new common_1.NotFoundException('Follow request not found or already processed');
            }
            console.log('✅ [REJECT] Follow request rejected successfully!');
            return {
                message: 'Follow request rejected',
                rejectedUserId: followRequest.requester,
                requestId: followRequest._id
            };
        }
        catch (error) {
            console.log('❌ [REJECT] Error:', error);
            throw new common_1.InternalServerErrorException('Could not reject follow request: ' + error.message);
        }
    }
    async cancelFollowRequest(requesterId, targetUserId) {
        const requesterObjectId = new mongoose_2.Types.ObjectId(requesterId);
        const targetObjectId = new mongoose_2.Types.ObjectId(targetUserId);
        const result = await this.followRequestModel.findOneAndDelete({
            requester: requesterObjectId,
            targetUser: targetObjectId,
            status: 'pending'
        });
        if (!result) {
            throw new common_1.NotFoundException('No pending follow request found');
        }
        return {
            message: 'Follow request cancelled',
            cancelledUserId: targetUserId
        };
    }
    async getFollowRequests(userId) {
        console.log('🔍 [GET REQUESTS] Getting follow requests for user:', userId);
        try {
            const userObjectId = new mongoose_2.Types.ObjectId(userId);
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
        }
        catch (error) {
            console.log('❌ [GET REQUESTS] Error:', error);
            return [];
        }
    }
    async unfollowUser(followerId, targetUserId) {
        console.log('🔍 [UNFOLLOW] Starting unfollow process...');
        try {
            const followerObjectId = new mongoose_2.Types.ObjectId(followerId);
            const targetObjectId = new mongoose_2.Types.ObjectId(targetUserId);
            console.log('🔍 [UNFOLLOW] Using ObjectIds:', {
                followerObjectId,
                targetObjectId
            });
            const follower = await this.userModel.findById(followerId);
            if (!follower) {
                throw new common_1.NotFoundException('Follower not found');
            }
            const isFollowing = follower.following.some(followingId => followingId.toString() === targetUserId);
            if (!isFollowing) {
                throw new common_1.BadRequestException('You are not following this user');
            }
            const updateFollower = await this.userModel.findByIdAndUpdate(followerId, {
                $pull: { following: targetObjectId },
                $inc: { 'stats.followingCount': -1 }
            }, { new: true });
            if (updateFollower && updateFollower.stats.followingCount < 0) {
                await this.userModel.findByIdAndUpdate(followerId, {
                    $set: { 'stats.followingCount': 0 }
                });
            }
            console.log('✅ [UNFOLLOW] Follower updated:', {
                followingCount: updateFollower?.stats.followingCount,
                followingArray: updateFollower?.following
            });
            const updateTarget = await this.userModel.findByIdAndUpdate(targetUserId, {
                $pull: { followers: followerObjectId },
                $inc: { 'stats.followersCount': -1 }
            }, { new: true });
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
        }
        catch (error) {
            console.log('❌ [UNFOLLOW] Error:', error);
            throw new common_1.InternalServerErrorException('Could not unfollow user: ' + error.message);
        }
    }
    async removeFollower(userId, followerId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId) || !mongoose_2.Types.ObjectId.isValid(followerId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        const followerObjectId = new mongoose_2.Types.ObjectId(followerId);
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const isFollower = user.followers.some(fId => fId.toString() === followerId);
            if (!isFollower) {
                throw new common_1.BadRequestException('This user is not your follower');
            }
            const updatedUser = await this.userModel.findByIdAndUpdate(userId, {
                $pull: { followers: followerObjectId },
                $inc: { 'stats.followersCount': -1 }
            }, { new: true });
            if (updatedUser && updatedUser.stats.followersCount < 0) {
                await this.userModel.findByIdAndUpdate(userId, {
                    $set: { 'stats.followersCount': 0 }
                });
            }
            const updatedFollower = await this.userModel.findByIdAndUpdate(followerId, {
                $pull: { following: userObjectId },
                $inc: { 'stats.followingCount': -1 }
            }, { new: true });
            if (updatedFollower && updatedFollower.stats.followingCount < 0) {
                await this.userModel.findByIdAndUpdate(followerId, {
                    $set: { 'stats.followingCount': 0 }
                });
            }
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
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Could not remove follower');
        }
    }
    async getRelationship(currentUserId, targetUserId) {
        if (!mongoose_2.Types.ObjectId.isValid(currentUserId) || !mongoose_2.Types.ObjectId.isValid(targetUserId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const currentUserObjectId = new mongoose_2.Types.ObjectId(currentUserId);
        const targetUserObjectId = new mongoose_2.Types.ObjectId(targetUserId);
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
            throw new common_1.NotFoundException('User not found');
        }
        const isFollowing = currentUser.following.some(followingId => followingId.toString() === targetUserId);
        const isFollowedBy = targetUser.followers.some(followerId => followerId.toString() === currentUserId);
        const isPrivate = targetUser.isPrivate;
        const hasPendingRequest = !!pendingRequest;
        let status;
        if (isFollowing) {
            status = 'following';
        }
        else if (hasPendingRequest) {
            status = 'requested';
        }
        else if (isPrivate) {
            status = 'not_following_private';
        }
        else {
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
    async searchUsers(query, page = 1, limit = 20) {
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
        }
        catch (error) {
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
    async getSuggestedUsers(currentUserId, limit = 10) {
        const currentUser = await this.userModel.findById(currentUserId);
        if (!currentUser) {
            throw new common_1.NotFoundException('Current user not found');
        }
        const excludeIds = [
            new mongoose_2.Types.ObjectId(currentUserId),
            ...currentUser.following.map(id => new mongoose_2.Types.ObjectId(id))
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
    async getPopularUsers(limit = 20) {
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
    async getFollowers(userId, page = 1, limit = 20) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
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
            throw new common_1.NotFoundException('User not found');
        }
        const totalFollowers = await this.userModel.findById(userId).select('followers');
        const totalCount = (totalFollowers && Array.isArray(totalFollowers.followers))
            ? totalFollowers.followers.length
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
    async getFollowing(userId, page = 1, limit = 20) {
        if (!mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user ID format');
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
            throw new common_1.NotFoundException('User not found');
        }
        const totalFollowing = await this.userModel.findById(userId).select('following');
        const totalCount = (totalFollowing && Array.isArray(totalFollowing.following))
            ? totalFollowing.following.length
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(follow_request_schema_1.FollowRequest.name)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        notifications_service_1.NotificationsService])
], UsersService);
//# sourceMappingURL=users.service.js.map