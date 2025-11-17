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
