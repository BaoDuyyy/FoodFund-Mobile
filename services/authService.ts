import * as SecureStore from "expo-secure-store";
import { getGraphqlUrl } from "../config/api";
import { GOOGLE_AUTHENTICATION_MUTATION } from "../graphql/mutation/googleAuthentication";
import { LOGIN_MUTATION } from "../graphql/mutation/login";
import { SIGN_OUT_MUTATION } from "../graphql/mutation/signOut";
import { SIGNUP_MUTATION } from "../graphql/mutation/signup";
import type {
  SignInInput,
  SignInPayload,
  SignInUser,
  SignUpInput,
  SignUpPayload,
  UserInfo,
} from "../types/api/auth";
import type { GraphQLResponse } from "../types/graphql";

// ============================================================================
// CONSTANTS
// ============================================================================

// SecureStore keys - centralized for maintainability
const STORE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER_ID: "userId",
  USER_EMAIL: "userEmail",
  USER_NAME: "userName",
  USER_ROLE: "userRole",
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse JWT token payload (base64 decode)
 */
function parseJwt(token: string): Record<string, any> {
  try {
    const base64 = token.split(".")[1];
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

/**
 * Extract error messages from GraphQL errors array
 */
function extractErrorMessage(errors: Array<{ message?: string }>): string {
  return errors.map((e) => e.message || JSON.stringify(e)).join("; ");
}

/**
 * Convert null/undefined to empty string for SecureStore
 */
function toStoreValue(value: string | null | undefined): string {
  return value ?? "";
}

/**
 * Generic GraphQL request handler
 */
async function graphqlRequest<T>(options: {
  query: string;
  variables?: Record<string, any>;
  overrideUrl?: string;
  token?: string | null;
}): Promise<GraphQLResponse<T>> {
  const { query, variables, overrideUrl, token } = options;
  const url = getGraphqlUrl(overrideUrl);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;

  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });
  } catch (err: any) {
    throw new Error(`Cannot connect to server: ${err?.message || err}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Network error ${res.status}: ${text}`);
  }

  const json = await res.json().catch(() => null);
  if (!json) {
    throw new Error("Invalid JSON from server");
  }

  if (json.errors?.length) {
    throw new Error(extractErrorMessage(json.errors));
  }

  return json;
}

// ============================================================================
// SECURE STORE HELPERS
// ============================================================================

const SecureStoreHelper = {
  /**
   * Save access token and optionally refresh token
   */
  async saveTokens(
    accessToken: string | null | undefined,
    refreshToken?: string | null
  ): Promise<void> {
    if (accessToken) {
      await SecureStore.setItemAsync(STORE_KEYS.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
      await SecureStore.setItemAsync(STORE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  },

  /**
   * Extract and save user info from JWT token
   */
  async saveUserFromJwt(token: string): Promise<void> {
    const decoded = parseJwt(token);

    await Promise.all([
      SecureStore.setItemAsync(STORE_KEYS.USER_ID, toStoreValue(decoded.sub)),
      SecureStore.setItemAsync(STORE_KEYS.USER_EMAIL, toStoreValue(decoded.email)),
      SecureStore.setItemAsync(STORE_KEYS.USER_NAME, toStoreValue(decoded.username)),
      SecureStore.setItemAsync(
        STORE_KEYS.USER_ROLE,
        toStoreValue(decoded["custom:role"])
      ),
    ]);
  },

  /**
   * Save user info from SignInUser payload
   */
  async saveUserFromPayload(user: SignInUser | null | undefined): Promise<void> {
    if (!user) return;

    const operations: Promise<void>[] = [];

    if (user.id) {
      operations.push(
        SecureStore.setItemAsync(STORE_KEYS.USER_ID, user.id)
      );
    }
    if (user.email) {
      operations.push(
        SecureStore.setItemAsync(STORE_KEYS.USER_EMAIL, user.email)
      );
    }
    if (user.name) {
      operations.push(
        SecureStore.setItemAsync(STORE_KEYS.USER_NAME, user.name)
      );
    }

    if (operations.length > 0) {
      await Promise.all(operations);
    }
  },

  /**
   * Clear all auth-related data from SecureStore
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(STORE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(STORE_KEYS.USER_ID),
      SecureStore.deleteItemAsync(STORE_KEYS.USER_EMAIL),
      SecureStore.deleteItemAsync(STORE_KEYS.USER_NAME),
      SecureStore.deleteItemAsync(STORE_KEYS.USER_ROLE),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(STORE_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(STORE_KEYS.REFRESH_TOKEN);
  },

  async getUserInfo(): Promise<UserInfo> {
    const [id, email, name, userName, role] = await Promise.all([
      SecureStore.getItemAsync(STORE_KEYS.USER_ID),
      SecureStore.getItemAsync(STORE_KEYS.USER_EMAIL),
      SecureStore.getItemAsync(STORE_KEYS.USER_NAME),
      SecureStore.getItemAsync(STORE_KEYS.USER_NAME), // userName is stored under USER_NAME key
      SecureStore.getItemAsync(STORE_KEYS.USER_ROLE),
    ]);

    return { id, email, name, userName, role };
  },

  /**
   * Log current SecureStore state (for debugging)
   */
  async logCurrentState(): Promise<void> {
    // Debug logging disabled in production
  },
};

// ============================================================================
// AUTH SERVICE
// ============================================================================

export const AuthService = {
  /**
   * Login with email and password
   */
  async login(
    email: string,
    password: string,
    overrideUrl?: string
  ): Promise<SignInPayload> {
    const response = await graphqlRequest<{ signIn: SignInPayload }>({
      query: LOGIN_MUTATION,
      variables: { input: { email, password } as SignInInput },
      overrideUrl,
    });

    const payload = response.data?.signIn;
    if (!payload) {
      throw new Error("Empty signIn response");
    }

    // Save auth data
    await this.saveAuthData(payload);

    // Log state in development
    if (__DEV__) {
      await SecureStoreHelper.logCurrentState();
    }

    return payload;
  },

  /**
   * Sign up new user
   */
  async signup(
    input: SignUpInput,
    overrideUrl?: string
  ): Promise<SignUpPayload> {
    const response = await graphqlRequest<{ signUp: SignUpPayload }>({
      query: SIGNUP_MUTATION,
      variables: { signUpInput2: input },
      overrideUrl,
    });

    const payload = response.data?.signUp;
    if (!payload) {
      throw new Error("Empty signUp response");
    }

    return payload;
  },

  /**
   * Login with Google ID token
   */
  async loginWithGoogle(
    idToken: string,
    overrideUrl?: string
  ): Promise<SignInPayload> {
    const response = await graphqlRequest<{
      googleAuthentication: SignInPayload;
    }>({
      query: GOOGLE_AUTHENTICATION_MUTATION,
      variables: { input: { idToken } },
      overrideUrl,
    });

    const payload = response.data?.googleAuthentication;
    if (!payload) {
      throw new Error("Google authentication failed");
    }

    // Save auth data
    await this.saveAuthData(payload);

    return payload;
  },

  /**
   * Sign out current user
   */
  async signOut(overrideUrl?: string): Promise<boolean> {
    const token = await SecureStoreHelper.getAccessToken();

    const response = await graphqlRequest<{ signOut: boolean }>({
      query: SIGN_OUT_MUTATION,
      overrideUrl,
      token,
    });

    // Clear local storage regardless of server response
    await SecureStoreHelper.clearAll();

    return response.data?.signOut ?? true;
  },

  // -------------------------------------------------------------------------
  // Token Helpers
  // -------------------------------------------------------------------------

  async getAccessToken(): Promise<string | null> {
    return SecureStoreHelper.getAccessToken();
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStoreHelper.getRefreshToken();
  },

  async removeTokens(): Promise<void> {
    await SecureStoreHelper.clearAll();
  },

  // -------------------------------------------------------------------------
  // User Info Helpers
  // -------------------------------------------------------------------------

  async getUserInfo(): Promise<UserInfo> {
    return SecureStoreHelper.getUserInfo();
  },

  // -------------------------------------------------------------------------
  // Private Helpers
  // -------------------------------------------------------------------------

  /**
   * Save authentication data to SecureStore
   */
  async saveAuthData(payload: SignInPayload): Promise<void> {
    // Save tokens (accessToken and refreshToken)
    await SecureStoreHelper.saveTokens(
      payload.accessToken,
      payload.refreshToken
    );

    // Save user info from JWT if access token exists
    if (payload.accessToken) {
      await SecureStoreHelper.saveUserFromJwt(payload.accessToken);
    }

    // Override with user payload if available (more accurate)
    if (payload.user) {
      await SecureStoreHelper.saveUserFromPayload(payload.user);
    }
  },
};

export default AuthService;