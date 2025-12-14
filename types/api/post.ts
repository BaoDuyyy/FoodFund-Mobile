/**
 * Post Types
 * Types for posts, comments, and likes
 */

// ============================================================================
// POST TYPES
// ============================================================================

export interface PostCreator {
    id: string;
    full_name: string;
}

export interface Post {
    id: string;
    campaignId: string;
    title: string;
    content: string;
    media: string[];
    creator: PostCreator;
    likeCount: number;
    commentCount: number;
    isLikedByMe: boolean;
    created_at: string;
}

export type PostSortOrder = "NEWEST_FIRST" | "OLDEST_FIRST" | "MOST_LIKED";

export interface GetPostsByCampaignInput {
    campaignId: string;
    sortBy?: PostSortOrder;
    limit?: number;
    offset?: number;
}

// ============================================================================
// LIKE TYPES
// ============================================================================

export interface LikePostResponse {
    success: boolean;
    isLiked: boolean;
    likeCount: number;
    isOptimistic?: boolean;
}

export interface UnlikePostResponse {
    success: boolean;
    isLiked: boolean;
    likeCount: number;
}

export interface PostLike {
    id: string;
    user: {
        id: string;
        full_name: string;
    };
}

// ============================================================================
// COMMENT TYPES
// ============================================================================

export interface Comment {
    id: string;
    postId: string;
    userId?: string;
    content: string;
    parentCommentId?: string | null;
    depth?: number;
    user?: {
        id: string;
        full_name: string;
    };
    created_at: string;
    updated_at?: string;
    replies?: Comment[];
}

export interface CreateCommentInput {
    postId: string;
    content: string;
    parentCommentId?: string | null;
}

export interface UpdateCommentInput {
    content: string;
}

export interface CreateCommentResponse {
    comment: Comment;
}

export interface ReplyCommentResponse {
    success: boolean;
    message: string;
    comment: Comment;
}

export interface UpdateCommentResponse {
    success: boolean;
    message: string;
    comment: {
        id: string;
        content: string;
        updated_at: string;
    };
}

export interface DeleteCommentResponse {
    success: boolean;
    message: string;
}
