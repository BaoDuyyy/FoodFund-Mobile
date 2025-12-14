export const LIKE_POST = `
    mutation LikePost($postId: String!) {
        likePost(postId: $postId) {
            success
            isLiked
            likeCount
            isOptimistic
        }
    }
`;
