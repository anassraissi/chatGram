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
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const upload_service_1 = require("./upload.service");
const users_service_1 = require("../users/users.service");
let UploadController = class UploadController {
    uploadService;
    usersService;
    constructor(uploadService, usersService) {
        this.uploadService = uploadService;
        this.usersService = usersService;
    }
    async uploadAvatar(req, file) {
        try {
            console.log('🔄 Uploading avatar for user:', req.user.userId);
            if (!file) {
                throw new common_1.BadRequestException('No file provided');
            }
            console.log('📁 File received:', {
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
            });
            this.uploadService.validateFile(file);
            const fileUrl = this.uploadService.getFileUrl(file.filename);
            console.log('🔗 File URL:', fileUrl);
            const updatedUser = await this.usersService.updateAvatar(req.user.userId, fileUrl);
            console.log('✅ Avatar uploaded successfully:', fileUrl);
            return {
                success: true,
                message: 'Avatar uploaded successfully',
                data: {
                    filename: file.filename,
                    url: fileUrl,
                    mimetype: file.mimetype,
                    size: file.size,
                    user: {
                        _id: updatedUser._id,
                        username: updatedUser.username,
                        profile: updatedUser.profile,
                    }
                }
            };
        }
        catch (error) {
            console.error('❌ Avatar upload error:', error);
            console.error('Error stack:', error?.stack);
            throw new common_1.BadRequestException(error?.message || 'Failed to upload avatar');
        }
    }
    async uploadCover(req, file) {
        try {
            console.log('🔄 Uploading cover for user:', req.user.userId);
            if (!file) {
                throw new common_1.BadRequestException('No file provided');
            }
            this.uploadService.validateFile(file);
            const fileUrl = this.uploadService.getFileUrl(file.filename);
            const updatedUser = await this.usersService.updateCoverImage(req.user.userId, fileUrl);
            console.log('✅ Cover image uploaded successfully:', fileUrl);
            return {
                success: true,
                message: 'Cover image uploaded successfully',
                data: {
                    filename: file.filename,
                    url: fileUrl,
                    mimetype: file.mimetype,
                    size: file.size,
                    user: {
                        _id: updatedUser._id,
                        username: updatedUser.username,
                        profile: updatedUser.profile,
                    }
                }
            };
        }
        catch (error) {
            console.error('❌ Cover upload error:', error);
            console.error('Error stack:', error?.stack);
            throw new common_1.BadRequestException(error?.message || 'Failed to upload cover');
        }
    }
    async uploadPostMedia(req, files) {
        try {
            console.log('🔄 Uploading post media for user:', req.user.userId);
            if (!files || files.length === 0) {
                throw new common_1.BadRequestException('No files provided');
            }
            const uploadedFiles = [];
            for (const file of files) {
                this.uploadService.validatePostMedia(file);
                const fileUrl = this.uploadService.getFileUrl(file.filename, 'posts');
                const isVideo = file.mimetype.startsWith('video/');
                const mediaType = isVideo ? 'video' : 'image';
                uploadedFiles.push({
                    url: fileUrl,
                    type: mediaType,
                    fileSize: file.size,
                    filename: file.filename,
                });
            }
            console.log('✅ Post media uploaded successfully:', uploadedFiles.length, 'files');
            return {
                success: true,
                message: 'Post media uploaded successfully',
                data: {
                    files: uploadedFiles,
                    count: uploadedFiles.length
                }
            };
        }
        catch (error) {
            console.error('❌ Post media upload error:', error?.message || 'Unknown error');
            throw new common_1.BadRequestException(error?.message || 'Failed to upload post media');
        }
    }
    async uploadSinglePostMedia(req, file) {
        try {
            console.log('🔄 Uploading single post media for user:', req.user.userId);
            this.uploadService.validatePostMedia(file);
            const fileUrl = this.uploadService.getFileUrl(file.filename, 'posts');
            const isVideo = file.mimetype.startsWith('video/');
            const mediaType = isVideo ? 'video' : 'image';
            console.log('✅ Single post media uploaded successfully:', fileUrl);
            return {
                success: true,
                message: 'Post media uploaded successfully',
                data: {
                    url: fileUrl,
                    type: mediaType,
                    fileSize: file.size,
                    filename: file.filename,
                }
            };
        }
        catch (error) {
            console.error('❌ Single post media upload error:', error?.message || 'Unknown error');
            throw new common_1.BadRequestException(error?.message || 'Failed to upload post media');
        }
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = (0, path_1.extname)(file.originalname);
                const filename = `${uniqueSuffix}${ext}`;
                callback(null, filename);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                return callback(new Error('Only image files are allowed!'), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Post)('cover'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = (0, path_1.extname)(file.originalname);
                const filename = `cover-${uniqueSuffix}${ext}`;
                callback(null, filename);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                return callback(new Error('Only image files are allowed!'), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadCover", null);
__decorate([
    (0, common_1.Post)('post-media'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/posts',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = (0, path_1.extname)(file.originalname);
                const filename = `post-${uniqueSuffix}${ext}`;
                callback(null, filename);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|mp4|mpeg|mov|avi)$/i)) {
                return callback(new Error('Only image and video files are allowed!'), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 50 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadPostMedia", null);
__decorate([
    (0, common_1.Post)('post-media/single'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/posts',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = (0, path_1.extname)(file.originalname);
                const filename = `post-${uniqueSuffix}${ext}`;
                callback(null, filename);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|mp4|mpeg|mov|avi)$/i)) {
                return callback(new Error('Only image and video files are allowed!'), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 50 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadSinglePostMedia", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [upload_service_1.UploadService,
        users_service_1.UsersService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map