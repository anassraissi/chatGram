import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
import { FollowRequestDocument } from './schemas/follow-request.schema';
import { NotificationsService } from '../notifications/notifications.service';
export declare class UsersService {
    private userModel;
    private followRequestModel;
    private notificationsService?;
    constructor(userModel: Model<UserDocument>, followRequestModel: Model<FollowRequestDocument>, notificationsService?: NotificationsService | undefined);
    create(createUserDto: any): Promise<UserDocument>;
    updateAvatar(userId: string, avatarUrl: string): Promise<UserDocument>;
    getUserAvatar(userId: string): Promise<{
        avatar?: string;
    } | null>;
    updateCoverImage(userId: string, coverUrl: string): Promise<UserDocument>;
    findByEmailOrUsername(identifier: string): Promise<UserDocument | null>;
    findById(id: string): Promise<UserDocument | null>;
    findByEmail(email: string): Promise<UserDocument | null>;
    findByUsername(username: string): Promise<UserDocument | null>;
    updateProfile(userId: string, updateData: any): Promise<UserDocument>;
    updateLastLogin(userId: string): Promise<void>;
    toJSON(user: any): any;
    validatePassword(user: UserDocument, candidatePassword: string): Promise<boolean>;
    getUserStats(userId: string): Promise<{
        postsCount: number;
        followersCount: number;
        followingCount: number;
        likesCount: number;
        accountAge: number;
    }>;
    followUser(followerId: string, targetUserId: string): Promise<any>;
    acceptFollowRequest(userId: string, requestId: string): Promise<any>;
    rejectFollowRequest(userId: string, requestId: string): Promise<any>;
    cancelFollowRequest(requesterId: string, targetUserId: string): Promise<any>;
    getFollowRequests(userId: string): Promise<any>;
    unfollowUser(followerId: string, targetUserId: string): Promise<any>;
    removeFollower(userId: string, followerId: string): Promise<any>;
    getRelationship(currentUserId: string, targetUserId: string): Promise<any>;
    searchUsers(query: string, page?: number, limit?: number): Promise<any>;
    getSuggestedUsers(currentUserId: string, limit?: number): Promise<any>;
    getPopularUsers(limit?: number): Promise<any>;
    getFollowers(userId: string, page?: number, limit?: number): Promise<any>;
    getFollowing(userId: string, page?: number, limit?: number): Promise<any>;
}
