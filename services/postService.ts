import { getGraphqlUrl } from "../config/api";
import { CREATE_COMMENT, REPLY_COMMENT } from "../graphql/mutation/createComment";
import { DELETE_COMMENT } from "../graphql/mutation/deleteComment";
import { LIKE_POST } from "../graphql/mutation/likePost";
import { UNLIKE_POST } from "../graphql/mutation/unlikePost";
import { UPDATE_COMMENT } from "../graphql/mutation/updateComment";
import { GET_POST_COMMENTS_TREE } from "../graphql/query/getPostCommentsTree";
import { GET_POST_LIKES } from "../graphql/query/getPostLikes";
import { GET_POSTS_BY_CAMPAIGN } from "../graphql/query/getPostsByCampaign";
import type {
    Comment,
    CreateCommentInput,
    CreateCommentResponse,
    DeleteCommentResponse,
    GetPostsByCampaignInput,
    LikePostResponse,
    Post,
    PostLike,
    ReplyCommentResponse,
    UnlikePostResponse,
    UpdateCommentInput,
    UpdateCommentResponse,
} from "../types/api/post";
import type { GraphQLResponse } from "../types/graphql";
import AuthService from "./authService";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract error messages from GraphQL errors array
 */
function extractErrorMessage(errors: Array<{ message?: string }>): string {
    return errors.map((e) => e.message || JSON.stringify(e)).join("; ");
}

/**
 * Generic GraphQL request handler with authentication
 */
async function graphqlRequest<T>(options: {
    query: string;
    variables?: Record<string, any>;
    overrideUrl?: string;
}): Promise<GraphQLResponse<T>> {
    const { query, variables, overrideUrl } = options;
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let res: Response;

    try {
        res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({ query, variables }),
        });
    } catch (err: any) {
        throw new Error(`Cannot connect to server: ${err?.message || err}`);
    }

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Network error ${res.status}: ${text}`);
    }

    const json = await res.json().catch(() => null);
    if (!json) {
        throw new Error("Invalid JSON from server");
    }

    if (json.errors?.length) {
        throw new Error(extractErrorMessage(json.errors));
    }

    return json;
}

// ============================================================================
// POST SERVICE
// ============================================================================

export const PostService = {
    // ==========================================================================
    // READ OPERATIONS (grouped together)
    // ==========================================================================

    /**
     * Get posts by campaign ID with pagination
     */
    async getPostsByCampaign(
        input: GetPostsByCampaignInput,
        overrideUrl?: string
    ): Promise<Post[]> {
        const { campaignId, sortBy, limit = 20, offset = 0 } = input;

        if (!campaignId) {
            throw new Error("Campaign ID is required");
        }

        const response = await graphqlRequest<{ postsByCampaign: Post[] }>({
            query: GET_POSTS_BY_CAMPAIGN,
            variables: { campaignId, sortBy, limit, offset },
            overrideUrl,
        });

        const posts = response.data?.postsByCampaign;
        if (!Array.isArray(posts)) {
            throw new Error("Empty or invalid postsByCampaign response");
        }

        return posts;
    },

    /**
     * Get likes for a post with pagination
     */
    async getPostLikes(
        postId: string,
        limit = 20,
        offset = 0,
        overrideUrl?: string
    ): Promise<PostLike[]> {
        if (!postId) {
            throw new Error("Post ID is required");
        }

        const response = await graphqlRequest<{ postLikes: PostLike[] }>({
            query: GET_POST_LIKES,
            variables: { postId, limit, offset },
            overrideUrl,
        });

        const likes = response.data?.postLikes;
        if (!Array.isArray(likes)) {
            throw new Error("Empty or invalid postLikes response");
        }

        return likes;
    },

    /**
     * Get comments tree for a post
     */
    async getPostCommentsTree(
        postId: string,
        overrideUrl?: string
    ): Promise<Comment[]> {
        if (!postId) {
            throw new Error("Post ID is required");
        }

        const response = await graphqlRequest<{ postCommentsTree: Comment[] }>({
            query: GET_POST_COMMENTS_TREE,
            variables: { postId },
            overrideUrl,
        });

        const comments = response.data?.postCommentsTree;
        if (!Array.isArray(comments)) {
            throw new Error("Empty or invalid postCommentsTree response");
        }

        return comments;
    },

    // ==========================================================================
    // LIKE OPERATIONS
    // ==========================================================================

    /**
     * Like a post
     */
    async likePost(
        postId: string,
        overrideUrl?: string
    ): Promise<LikePostResponse> {
        if (!postId) {
            throw new Error("Post ID is required");
        }

        const response = await graphqlRequest<{ likePost: LikePostResponse }>({
            query: LIKE_POST,
            variables: { postId },
            overrideUrl,
        });

        const result = response.data?.likePost;
        if (!result) {
            throw new Error("Empty or invalid likePost response");
        }

        return result;
    },

    /**
     * Unlike a post
     */
    async unlikePost(
        postId: string,
        overrideUrl?: string
    ): Promise<UnlikePostResponse> {
        if (!postId) {
            throw new Error("Post ID is required");
        }

        const response = await graphqlRequest<{ unlikePost: UnlikePostResponse }>({
            query: UNLIKE_POST,
            variables: { postId },
            overrideUrl,
        });

        const result = response.data?.unlikePost;
        if (!result) {
            throw new Error("Empty or invalid unlikePost response");
        }

        return result;
    },

    // ==========================================================================
    // COMMENT OPERATIONS
    // ==========================================================================

    /**
     * Create a new comment on a post
     */
    async createComment(
        input: CreateCommentInput,
        overrideUrl?: string
    ): Promise<CreateCommentResponse> {
        if (!input.postId) {
            throw new Error("Post ID is required");
        }
        if (!input.content?.trim()) {
            throw new Error("Comment content is required");
        }

        const response = await graphqlRequest<{ createComment: CreateCommentResponse }>({
            query: CREATE_COMMENT,
            variables: { input },
            overrideUrl,
        });

        const result = response.data?.createComment;
        if (!result) {
            throw new Error("Empty or invalid createComment response");
        }

        return result;
    },

    /**
     * Reply to an existing comment
     */
    async replyComment(
        input: CreateCommentInput,
        overrideUrl?: string
    ): Promise<ReplyCommentResponse> {
        if (!input.postId) {
            throw new Error("Post ID is required");
        }
        if (!input.parentCommentId) {
            throw new Error("Parent comment ID is required for replies");
        }
        if (!input.content?.trim()) {
            throw new Error("Reply content is required");
        }

        const response = await graphqlRequest<{ createComment: ReplyCommentResponse }>({
            query: REPLY_COMMENT,
            variables: { input },
            overrideUrl,
        });

        const result = response.data?.createComment;
        if (!result) {
            throw new Error("Empty or invalid replyComment response");
        }

        return result;
    },

    /**
     * Update an existing comment
     */
    async updateComment(
        commentId: string,
        input: UpdateCommentInput,
        overrideUrl?: string
    ): Promise<UpdateCommentResponse> {
        if (!commentId) {
            throw new Error("Comment ID is required");
        }
        if (!input.content?.trim()) {
            throw new Error("Comment content is required");
        }

        const response = await graphqlRequest<{ updateComment: UpdateCommentResponse }>({
            query: UPDATE_COMMENT,
            variables: { commentId, input },
            overrideUrl,
        });

        const result = response.data?.updateComment;
        if (!result) {
            throw new Error("Empty or invalid updateComment response");
        }

        return result;
    },

    /**
     * Delete a comment
     */
    async deleteComment(
        commentId: string,
        overrideUrl?: string
    ): Promise<DeleteCommentResponse> {
        if (!commentId) {
            throw new Error("Comment ID is required");
        }

        const response = await graphqlRequest<{ deleteComment: DeleteCommentResponse }>({
            query: DELETE_COMMENT,
            variables: { commentId },
            overrideUrl,
        });

        const result = response.data?.deleteComment;
        if (!result) {
            throw new Error("Empty or invalid deleteComment response");
        }

        return result;
    },
};

export default PostService;
