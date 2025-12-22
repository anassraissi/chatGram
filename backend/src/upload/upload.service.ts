import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    // Ensure uploads directory exists
    this.ensureUploadsDirectory();
    
    // Get base URL from environment or use default
    const port = this.configService.get<string>('PORT') || '3001';
    const host = this.configService.get<string>('HOST') || 'localhost';
    const protocol = this.configService.get<string>('PROTOCOL') || 'http';
    this.baseUrl = this.configService.get<string>('API_BASE_URL') || `${protocol}://${host}:${port}`;
  }

  private ensureUploadsDirectory() {
    const uploadsPath = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsPath)) {
      mkdirSync(uploadsPath, { recursive: true });
    }
    
    // Ensure posts subdirectory exists
    const postsPath = join(process.cwd(), 'uploads', 'posts');
    if (!existsSync(postsPath)) {
      mkdirSync(postsPath, { recursive: true });
    }
  }

  getFileUrl(filename: string, subdirectory: string = ''): string {
    if (!filename) return '';
    const path = subdirectory ? `${subdirectory}/${filename}` : filename;
    return `${this.baseUrl}/uploads/${path}`;
  }

  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size too large. Maximum size is 5MB.');
    }
  }

  validatePostMedia(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Allow images and videos for post media
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
      throw new BadRequestException('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MPEG, MOV, AVI) are allowed.');
    }

    // Larger size limit for post media (10MB for images, 50MB for videos)
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB
    const isVideo = file.mimetype.startsWith('video/');
    const maxSize = isVideo ? maxVideoSize : maxImageSize;

    if (file.size > maxSize) {
      const maxSizeMB = isVideo ? 50 : 10;
      throw new BadRequestException(`File size too large. Maximum size is ${maxSizeMB}MB for ${isVideo ? 'videos' : 'images'}.`);
    }
  }
}