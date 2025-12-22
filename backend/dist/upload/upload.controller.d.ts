import { UploadService } from './upload.service';
import { UsersService } from '../users/users.service';
export declare class UploadController {
    private uploadService;
    private usersService;
    constructor(uploadService: UploadService, usersService: UsersService);
    uploadAvatar(req: any, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            filename: string;
            url: string;
            mimetype: string;
            size: number;
            user: {
                _id: unknown;
                username: string;
                profile: {
                    name: string;
                    bio: string;
                    avatar: string;
                    website: string;
                    gender: string;
                    location: string;
                    coverImage: string;
                };
            };
        };
    }>;
    uploadCover(req: any, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            filename: string;
            url: string;
            mimetype: string;
            size: number;
            user: {
                _id: unknown;
                username: string;
                profile: {
                    name: string;
                    bio: string;
                    avatar: string;
                    website: string;
                    gender: string;
                    location: string;
                    coverImage: string;
                };
            };
        };
    }>;
    uploadPostMedia(req: any, files: Express.Multer.File[]): Promise<{
        success: boolean;
        message: string;
        data: {
            files: {
                url: string;
                type: "image" | "video";
                fileSize: number;
                filename?: string;
                thumbnail?: string;
                duration?: number;
                width?: number;
                height?: number;
            }[];
            count: number;
        };
    }>;
    uploadSinglePostMedia(req: any, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            url: string;
            type: "image" | "video";
            fileSize: number;
            filename: string;
        };
    }>;
}
