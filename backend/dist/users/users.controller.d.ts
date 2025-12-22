import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getCurrentUser(req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getUserAvatar(userId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            avatar?: string;
        } | null;
    }>;
    updateProfile(req: any, updateData: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getUserStats(req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            postsCount: number;
            followersCount: number;
            followingCount: number;
            likesCount: number;
            accountAge: number;
        };
    }>;
    getUserById(userId: string): Promise<{
        success: boolean;
        message: string;
        data: any;
        user: any;
    }>;
    searchUsers(query: string, page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getSuggestedUsers(req: any, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getPopularUsers(limit?: number): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getFollowRequests(req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getRelationship(req: any, targetUserId: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    followUser(req: any, targetUserId: string): Promise<{
        success: boolean;
        message: any;
        data: any;
    }>;
    unfollowUser(req: any, targetUserId: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    acceptFollowRequest(req: any, requestId: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    rejectFollowRequest(req: any, requestId: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    removeFollower(req: any, followerId: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getUserByUsername(username: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getFollowers(userId: string, page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getFollowing(userId: string, page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
