export const GET_POST_COMMENTS_TREE = `
    query GetPostCommentsTree($postId: String!) {
        postCommentsTree(postId: $postId, limit: 20, offset: 0) {
            id
            content
            depth
            user {
                id
                full_name
            }
            created_at
            replies {
                id
                content
                depth
                user {
                    id
                    full_name
                }
                created_at
                replies {
                    id
                    content
                    depth
                    userId
                    created_at
                }
            }
        }
    }
`;
