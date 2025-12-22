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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs_1 = require("fs");
const path_1 = require("path");
let UploadService = class UploadService {
    configService;
    baseUrl;
    constructor(configService) {
        this.configService = configService;
        this.ensureUploadsDirectory();
        const port = this.configService.get('PORT') || '3001';
        const host = this.configService.get('HOST') || 'localhost';
        const protocol = this.configService.get('PROTOCOL') || 'http';
        this.baseUrl = this.configService.get('API_BASE_URL') || `${protocol}://${host}:${port}`;
    }
    ensureUploadsDirectory() {
        const uploadsPath = (0, path_1.join)(process.cwd(), 'uploads');
        if (!(0, fs_1.existsSync)(uploadsPath)) {
            (0, fs_1.mkdirSync)(uploadsPath, { recursive: true });
        }
        const postsPath = (0, path_1.join)(process.cwd(), 'uploads', 'posts');
        if (!(0, fs_1.existsSync)(postsPath)) {
            (0, fs_1.mkdirSync)(postsPath, { recursive: true });
        }
    }
    getFileUrl(filename, subdirectory = '') {
        if (!filename)
            return '';
        const path = subdirectory ? `${subdirectory}/${filename}` : filename;
        return `${this.baseUrl}/uploads/${path}`;
    }
    validateFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new common_1.BadRequestException('File size too large. Maximum size is 5MB.');
        }
    }
    validatePostMedia(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo'
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MPEG, MOV, AVI) are allowed.');
        }
        const maxImageSize = 10 * 1024 * 1024;
        const maxVideoSize = 50 * 1024 * 1024;
        const isVideo = file.mimetype.startsWith('video/');
        const maxSize = isVideo ? maxVideoSize : maxImageSize;
        if (file.size > maxSize) {
            const maxSizeMB = isVideo ? 50 : 10;
            throw new common_1.BadRequestException(`File size too large. Maximum size is ${maxSizeMB}MB for ${isVideo ? 'videos' : 'images'}.`);
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map