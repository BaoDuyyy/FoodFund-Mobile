export interface OrganizationMember {
  id: string;
  joined_at: string;
  member_role: string;
  status?: string;
  member: {
    id: string;
    full_name: string;
    phone_number: string;
    user_name: string;
    email: string;
    avatar_url?: string;
    is_active?: boolean;
  };
}

export interface OrganizationRepresentative {
  id: string;
  full_name: string;
  phone_number: string;
  user_name: string;
  email: string;
  avatar_url?: string;
  is_active?: boolean;
  role?: string;
  cognito_id?: string;
}

export interface Organization {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  website?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  status: string;
  active_members: number;
  total_members: number;
  representative_id?: string;
  representative?: OrganizationRepresentative;
  members?: OrganizationMember[];
  bank_account_number?: string;
}

export interface GetOrganizationByIdResponse {
  getOrganizationById: Organization;
}

export interface ListActiveOrganizationsResponse {
  listActiveOrganizations: {
    hasMore: boolean;
    limit: number;
    message: string;
    offset: number;
    success: boolean;
    total: number;
    organizations: Organization[];
  };
}
