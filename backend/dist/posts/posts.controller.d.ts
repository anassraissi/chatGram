import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/comment.dto';
export declare class PostsController {
    private postsService;
    constructor(postsService: PostsService);
    createPost(req: any, createPostDto: CreatePostDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getFeed(req: any, page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getPost(req: any, postId: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getUserPosts(req: any, userId: string, page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updatePost(req: any, postId: string, updatePostDto: UpdatePostDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    deletePost(req: any, postId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    toggleLike(req: any, postId: string): Promise<{
        success: boolean;
        message: any;
        data: any;
    }>;
    addComment(req: any, postId: string, commentDto: CreateCommentDto): Promise<{
        success: boolean;
        message: any;
        data: any;
    }>;
    toggleCommentLike(req: any, postId: string, commentIndex: string): Promise<{
        success: boolean;
        message: any;
        data: any;
    }>;
    deleteComment(req: any, postId: string, commentIndex: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sharePost(req: any, postId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    toggleSave(req: any, postId: string): Promise<{
        success: boolean;
        message: any;
        data: any;
    }>;
    getPostsByHashtag(hashtag: string, page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getTrendingHashtags(limit?: number): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
