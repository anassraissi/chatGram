import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFiles, 
  UploadedFile,
  UseGuards,
  BadRequestException,
  Req
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { UsersService } from '../users/users.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private uploadService: UploadService,
    private usersService: UsersService,
  ) {}


  // Avatar upload
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
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
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    try {
      console.log('🔄 Uploading avatar for user:', req.user.userId);
      
      if (!file) {
        throw new BadRequestException('No file provided');
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
      
      // Update user's avatar in database
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
    } catch (error: any) {
      console.error('❌ Avatar upload error:', error);
      console.error('Error stack:', error?.stack);
      throw new BadRequestException(error?.message || 'Failed to upload avatar');
    }
  }

  // Cover image upload
  @Post('cover')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
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
      fileSize: 10 * 1024 * 1024, // 10MB limit for cover images
    },
  }))
  async uploadCover(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    try {
      console.log('🔄 Uploading cover for user:', req.user.userId);
      
      if (!file) {
        throw new BadRequestException('No file provided');
      }
      
      this.uploadService.validateFile(file);
      
      const fileUrl = this.uploadService.getFileUrl(file.filename);
      
      // Update user's cover image in database
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
    } catch (error: any) {
      console.error('❌ Cover upload error:', error);
      console.error('Error stack:', error?.stack);
      throw new BadRequestException(error?.message || 'Failed to upload cover');
    }
  }

  // Post media upload (multiple files)
  @Post('post-media')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: './uploads/posts',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        const filename = `post-${uniqueSuffix}${ext}`;
        callback(null, filename);
      },
    }),
    fileFilter: (req, file, callback) => {
      // Allow images and videos
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|mp4|mpeg|mov|avi)$/i)) {
        return callback(new Error('Only image and video files are allowed!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit for post media
    },
  }))
  async uploadPostMedia(@Req() req: any, @UploadedFiles() files: Express.Multer.File[]) {
    try {
      console.log('🔄 Uploading post media for user:', req.user.userId);
      
      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      const uploadedFiles: Array<{
        url: string;
        type: 'image' | 'video';
        fileSize: number;
        filename?: string;
        thumbnail?: string;
        duration?: number;
        width?: number;
        height?: number;
      }> = [];
      
      for (const file of files) {
        this.uploadService.validatePostMedia(file);
        const fileUrl = this.uploadService.getFileUrl(file.filename, 'posts');
        
        // Determine media type
        const isVideo = file.mimetype.startsWith('video/');
        const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
        
        uploadedFiles.push({
          url: fileUrl,
          type: mediaType,
          fileSize: file.size,
          filename: file.filename,
          // Note: For production, you'd want to extract actual dimensions and duration
          // using libraries like 'sharp' for images or 'ffprobe' for videos
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
    } catch (error: any) {
      console.error('❌ Post media upload error:', error?.message || 'Unknown error');
      throw new BadRequestException(error?.message || 'Failed to upload post media');
    }
  }

  // Single post media upload
  @Post('post-media/single')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/posts',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        const filename = `post-${uniqueSuffix}${ext}`;
        callback(null, filename);
      },
    }),
    fileFilter: (req, file, callback) => {
      // Allow images and videos
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|mp4|mpeg|mov|avi)$/i)) {
        return callback(new Error('Only image and video files are allowed!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit for post media
    },
  }))
  async uploadSinglePostMedia(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    try {
      console.log('🔄 Uploading single post media for user:', req.user.userId);
      
      this.uploadService.validatePostMedia(file);
      
      const fileUrl = this.uploadService.getFileUrl(file.filename, 'posts');
      
      // Determine media type
      const isVideo = file.mimetype.startsWith('video/');
      const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
      
      console.log('✅ Single post media uploaded successfully:', fileUrl);
      
      return {
        success: true,
        message: 'Post media uploaded successfully',
        data: {
          url: fileUrl,
          type: mediaType,
          fileSize: file.size,
          filename: file.filename,
          // Note: For production, extract actual dimensions and duration
        }
      };
    } catch (error: any) {
      console.error('❌ Single post media upload error:', error?.message || 'Unknown error');
      throw new BadRequestException(error?.message || 'Failed to upload post media');
    }
  }
}