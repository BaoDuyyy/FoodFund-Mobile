export const CREATE_COMMENT = `
    mutation CreateComment($input: CreateCommentInput!) {
        createComment(input: $input) {
            comment {
                id
                postId
                userId
                content
                parentCommentId
                created_at
            }
        }
    }
`;

export const REPLY_COMMENT = `
    mutation ReplyComment($input: CreateCommentInput!) {
        createComment(input: $input) {
            success
            message
            comment {
                id
                postId
                parentCommentId
                depth
                content
            }
        }
    }
`;
