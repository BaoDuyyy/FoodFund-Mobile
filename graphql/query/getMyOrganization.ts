/**
 * Query for staff to get their organization details
 * Used to retrieve member's cognito_id for filtering delivery tasks
 */
export const GET_MY_ORGANIZATION = `
  query GetMyOrganization {
    getMyOrganization {
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
