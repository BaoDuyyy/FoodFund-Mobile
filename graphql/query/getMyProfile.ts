export const GET_MY_PROFILE_QUERY = `
  query {
    getMyProfile {
      message
      userProfile {
        avatar_url
        bio
        created_at
        email
        full_name
        id
        is_active
        phone_number
        updated_at
        user_name
        badge {
          created_at
          description
          icon_url
          id
          is_active
          name
          sort_order
          updated_at
        }
      }
    }
  }
`;
