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
  full_name: string | null;
  id: string;
  is_active: boolean;
  phone_number: string | null;
  updated_at: string;
  user_name: string | null;
  address?: string | null;
  badge?: Badge;
}

export interface GetMyProfileResponse {
  getMyProfile: {
    message: string;
    userProfile: UserProfile;
  };
}

export type GenerateAvatarUploadUrlInput = {
  fileType: string; // ví dụ: "jpg", "png", "webp"
};

export type AvatarUploadUrl = {
  cdnUrl: string;
  expiresAt: string;
  fileKey: string;
  fileType: string;
  uploadUrl: string;
};

export type GenerateAvatarUploadUrlResult = {
  success: boolean;
  message?: string | null;
  instructions?: string | null;
  uploadUrl: AvatarUploadUrl;
};

export type UpdateMyProfileInput = {
  full_name?: string | null;
  user_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  role?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
};

export type UpdateMyProfileResult = {
  address: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  email: string;
  full_name: string;
  id: string;
  is_active: boolean;
  phone_number: string | null;
  role: string;
  updated_at: string;
  user_name: string;
};