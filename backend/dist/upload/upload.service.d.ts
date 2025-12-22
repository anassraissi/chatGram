import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private configService;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    private ensureUploadsDirectory;
    getFileUrl(filename: string, subdirectory?: string): string;
    validateFile(file: Express.Multer.File): void;
    validatePostMedia(file: Express.Multer.File): void;
}
