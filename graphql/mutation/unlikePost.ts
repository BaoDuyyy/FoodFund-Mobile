export const UNLIKE_POST = `
    mutation UnlikePost($postId: String!) {
        unlikePost(postId: $postId) {
            success
            isLiked
            likeCount
        }
    }
`;
