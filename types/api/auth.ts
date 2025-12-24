// src/types/api/auth.ts

export type SignInInput = {
  email: string;
  password: string;
};

export type SignInUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  provider?: string | null;
  createdAt?: string | null;
};

export type SignInPayload = {
  expiresIn?: string | number | null;
  accessToken?: string | null;
  idToken?: string | null;
  message?: string | null;
  refreshToken?: string | null;
  user?: SignInUser | null;
};

// add signup types
export type SignUpInput = {
  email: string;
  name?: string;
  password: string;
};

export type SignUpPayload = {
  emailSent?: boolean | null;
  message?: string | null;
  userSub?: string | null;
};

// User info stored locally (from SecureStore)
export type UserInfo = {
  id: string | null;
  email: string | null;
  name: string | null;
  userName: string | null;
  role: string | null;
};
