export declare class MediaDto {
    url: string;
    type: 'image' | 'video';
    thumbnail?: string;
    duration?: number;
    width?: number;
    height?: number;
    fileSize?: number;
}
export declare class CreatePostDto {
    content?: string;
    media?: MediaDto[];
    visibility?: 'public' | 'followers' | 'private';
    hashtags?: string[];
    mentions?: string[];
    location?: string;
    scheduledFor?: string;
}
