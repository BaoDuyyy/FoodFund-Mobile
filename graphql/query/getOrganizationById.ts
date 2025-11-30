export const GET_ORGANIZATION_BY_ID_QUERY = `
query($getOrganizationByIdId: String!) {
  getOrganizationById(id: $getOrganizationByIdId) {
    active_members
    address
    created_at
    description
    id
    members {
      id
      joined_at
      member {
        avatar_url
        email
        full_name
        id
        is_active
        phone_number
        user_name
      }
      member_role
      status
    }
    name
    phone_number
    representative_id
    representative {
      avatar_url
      email
      full_name
      id
      is_active
      phone_number
      user_name
    }
    status
    total_members
    website
  }
}
`;
