"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getCurrentUser(req) {
        const user = await this.usersService.findById(req.user.userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const userData = this.usersService.toJSON(user);
        return {
            success: true,
            message: 'User profile retrieved successfully',
            data: userData
        };
    }
    async getUserAvatar(userId) {
        const avatarData = await this.usersService.getUserAvatar(userId);
        return {
            success: true,
            message: 'Avatar retrieved successfully',
            data: avatarData
        };
    }
    async updateProfile(req, updateData) {
        console.log('🔄 Updating profile for user:', req.user.userId);
        if (!req.user?.userId) {
            throw new common_1.BadRequestException('User ID not found in token');
        }
        const user = await this.usersService.updateProfile(req.user.userId, updateData);
        const userData = this.usersService.toJSON(user);
        return {
            success: true,
            message: 'Profile updated successfully',
            data: userData
        };
    }
    async getUserStats(req) {
        const stats = await this.usersService.getUserStats(req.user.userId);
        return {
            success: true,
            message: 'User statistics retrieved successfully',
            data: stats
        };
    }
    async getUserById(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const userData = this.usersService.toJSON(user);
        return {
            success: true,
            message: 'User profile retrieved successfully',
            data: userData,
            user: userData,
        };
    }
    async searchUsers(query, page = 1, limit = 20) {
        console.log('🟡 [CONTROLLER] Search request received:', { query, page, limit });
        if (!query || query.trim().length < 2) {
            throw new common_1.BadRequestException('Search query must be at least 2 characters long');
        }
        try {
            const results = await this.usersService.searchUsers(query, page, limit);
            console.log('🟢 [CONTROLLER] Search completed. Results:', results.users.length);
            return {
                success: true,
                message: results.users.length > 0 ? 'Users found successfully' : 'No users found matching your search',
                data: results
            };
        }
        catch (error) {
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
    async getSuggestedUsers(req, limit = 10) {
        const suggestions = await this.usersService.getSuggestedUsers(req.user.userId, limit);
        return {
            success: true,
            message: 'Suggested users retrieved successfully',
            data: suggestions
        };
    }
    async getPopularUsers(limit = 20) {
        const popularUsers = await this.usersService.getPopularUsers(limit);
        return {
            success: true,
            message: 'Popular users retrieved successfully',
            data: popularUsers
        };
    }
    async getFollowRequests(req) {
        const requests = await this.usersService.getFollowRequests(req.user.userId);
        return {
            success: true,
            message: 'Follow requests retrieved successfully',
            data: requests
        };
    }
    async getRelationship(req, targetUserId) {
        const relationship = await this.usersService.getRelationship(req.user.userId, targetUserId);
        return {
            success: true,
            message: 'Relationship status retrieved',
            data: relationship
        };
    }
    async followUser(req, targetUserId) {
        if (req.user.userId === targetUserId) {
            throw new common_1.BadRequestException('You cannot follow yourself');
        }
        const result = await this.usersService.followUser(req.user.userId, targetUserId);
        return {
            success: true,
            message: result.message,
            data: result
        };
    }
    async unfollowUser(req, targetUserId) {
        const result = await this.usersService.unfollowUser(req.user.userId, targetUserId);
        return {
            success: true,
            message: 'Unfollowed successfully',
            data: result
        };
    }
    async acceptFollowRequest(req, requestId) {
        const result = await this.usersService.acceptFollowRequest(req.user.userId, requestId);
        return {
            success: true,
            message: 'Follow request accepted',
            data: result
        };
    }
    async rejectFollowRequest(req, requestId) {
        const result = await this.usersService.rejectFollowRequest(req.user.userId, requestId);
        return {
            success: true,
            message: 'Follow request rejected',
            data: result
        };
    }
    async removeFollower(req, followerId) {
        const result = await this.usersService.removeFollower(req.user.userId, followerId);
        return {
            success: true,
            message: 'Follower removed successfully',
            data: result
        };
    }
    async getUserByUsername(username) {
        const user = await this.usersService.findByUsername(username);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const userData = this.usersService.toJSON(user);
        return {
            success: true,
            message: 'User profile retrieved successfully',
            data: userData
        };
    }
    async getFollowers(userId, page = 1, limit = 20) {
        const followers = await this.usersService.getFollowers(userId, page, limit);
        return {
            success: true,
            message: 'Followers retrieved successfully',
            data: followers
        };
    }
    async getFollowing(userId, page = 1, limit = 20) {
        const following = await this.usersService.getFollowing(userId, page, limit);
        return {
            success: true,
            message: 'Following retrieved successfully',
            data: following
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Get)('avatar/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserAvatar", null);
__decorate([
    (0, common_1.Put)('profile'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('stats/me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('id/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getSuggestedUsers", null);
__decorate([
    (0, common_1.Get)('discover/popular'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getPopularUsers", null);
__decorate([
    (0, common_1.Get)('follow-requests'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFollowRequests", null);
__decorate([
    (0, common_1.Get)('relationship/:targetUserId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('targetUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getRelationship", null);
__decorate([
    (0, common_1.Post)('follow/:userId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "followUser", null);
__decorate([
    (0, common_1.Delete)('unfollow/:userId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "unfollowUser", null);
__decorate([
    (0, common_1.Post)('follow-requests/:requestId/accept'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "acceptFollowRequest", null);
__decorate([
    (0, common_1.Post)('follow-requests/:requestId/reject'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "rejectFollowRequest", null);
__decorate([
    (0, common_1.Delete)('followers/:followerId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('followerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "removeFollower", null);
__decorate([
    (0, common_1.Get)(':username'),
    __param(0, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserByUsername", null);
__decorate([
    (0, common_1.Get)(':userId/followers'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFollowers", null);
__decorate([
    (0, common_1.Get)(':userId/following'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFollowing", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map