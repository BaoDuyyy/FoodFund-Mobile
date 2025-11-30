export interface Badge {
  created_at: string;
  description: string;
  icon_url: string;
  id: string;
  is_active: boolean;
  name: string;
  sort_order: number;
  updated_at: string;
}

export interface UserProfile {
  avatar_url: string;
  bio: string;
  created_at: string;
  email: string;
  full_name: string;
  id: string;
  is_active: boolean;
  phone_number: string;
  updated_at: string;
  user_name: string;
  badge?: Badge;
}

export interface GetMyProfileResponse {
  getMyProfile: {
    message: string;
    userProfile: UserProfile;
  };
}