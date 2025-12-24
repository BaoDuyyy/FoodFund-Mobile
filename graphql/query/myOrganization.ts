export const MY_ORGANIZATION = `
  query MyOrganization {
    myOrganization {
      active_members
      address
      created_at
      description
      id
      members {
        id
        member {
          id
          cognito_id
          full_name
          phone_number
          user_name
          is_active
        }
        joined_at
        member_role
        status
      }
      name
      phone_number
      representative {
        id
        cognito_id
        full_name
        phone_number
        user_name
        is_active
      }
      representative_id
      status
      total_members
      website
      updated_at
    }
  }
`;
