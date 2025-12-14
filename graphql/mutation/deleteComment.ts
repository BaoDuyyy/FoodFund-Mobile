export const DELETE_COMMENT = `
    mutation DeleteComment($commentId: String!) {
        deleteComment(commentId: $commentId) {
            success
            message
        }
    }
`;
