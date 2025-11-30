export const LIST_ACTIVE_ORGANIZATIONS_QUERY = `
query {
  listActiveOrganizations {
    hasMore
    limit
    message
    offset
    success
    total
    organizations {
      active_members
      address
      created_at
      description
      id
      members {
        joined_at
        member_role
        id
        member {
          id
          full_name
          phone_number
          user_name
          email
        }
      }
      representative {
        id
        full_name
        phone_number
        role
        user_name
        email
      }
      name
      phone_number
      status
      total_members
      website
      updated_at
      bank_account_number
    }
  }
}
`;
