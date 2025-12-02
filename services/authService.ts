import * as SecureStore from "expo-secure-store";
import { getGraphqlUrl } from "../config/api";
import { GOOGLE_AUTHENTICATION_MUTATION } from "../graphql/mutation/googleAuthentication";
import { LOGIN_MUTATION } from "../graphql/mutation/login";
import { SIGN_OUT_MUTATION } from "../graphql/mutation/signOut";
import { SIGNUP_MUTATION } from "../graphql/mutation/signup";
import {
  SignInInput,
  SignInPayload,
  SignUpInput,
  SignUpPayload,
} from "../types/api/auth";

// Replace Buffer decoding with a compatible base64 decoder for React Native/Expo
function parseJwt(token: string): any {
  try {
    const base64 = token.split(".")[1];
    // Add padding if needed
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=");
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

export const AuthService = {
  async login(
    email: string,
    password: string,
    overrideUrl?: string
  ): Promise<SignInPayload> {
    const url = getGraphqlUrl(overrideUrl);

    let res: Response;

    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: LOGIN_MUTATION,
          variables: { input: { email, password } as SignInInput },
        }),
      });
    } catch (err: any) {
      throw new Error(`Cannot connect to server: ${err.message}`);
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
      const errMsg = json.errors
        .map((e: any) => e.message || JSON.stringify(e))
        .join("; ");
      throw new Error(errMsg);
    }

    const payload: SignInPayload | undefined = json.data?.signIn;
    if (!payload) throw new Error("Empty signIn response");

    // Save tokens if received
    if (payload?.accessToken) {
      await SecureStore.setItemAsync("accessToken", payload.accessToken);

      // Parse JWT to get user info
      const decoded = parseJwt(payload.accessToken);
      // Always set userRole from decoded["custom:role"] if present
      await SecureStore.setItemAsync("userId", decoded.sub || "");
      await SecureStore.setItemAsync("userEmail", decoded.email || "");
      await SecureStore.setItemAsync("userName", decoded.username || "");
      await SecureStore.setItemAsync("userRole", decoded["custom:role"] || "");
    }
    if (payload?.refreshToken) {
      await SecureStore.setItemAsync("refreshToken", payload.refreshToken);
    }
    // Also save user info from payload.user if available
    if (payload?.user) {
      if (payload.user.id) await SecureStore.setItemAsync("userId", payload.user.id);
      if (payload.user.email) await SecureStore.setItemAsync("userEmail", payload.user.email);
      if (payload.user.name) await SecureStore.setItemAsync("userName", payload.user.name);
    }

    // Log các biến trong store sau khi đăng nhập
    const accessToken = await SecureStore.getItemAsync("accessToken");
    const refreshToken = await SecureStore.getItemAsync("refreshToken");
    const userId = await SecureStore.getItemAsync("userId");
    const userEmail = await SecureStore.getItemAsync("userEmail");
    const userName = await SecureStore.getItemAsync("userName");
    const userRole = await SecureStore.getItemAsync("userRole");
    console.log("SecureStore after login:", {
      accessToken,
      refreshToken,
      userId,
      userEmail,
      userName,
      userRole,
    });

    return payload;
  },

  async signup(
    input: SignUpInput,
    overrideUrl?: string
  ): Promise<SignUpPayload> {
    const url = getGraphqlUrl(overrideUrl);

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: SIGNUP_MUTATION,
          variables: { signUpInput2: input },
        }),
      });
    } catch (err: any) {
      throw new Error(`Cannot connect to server: ${err.message}`);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Network error ${res.status}: ${text}`);
    }

    const json = await res.json().catch(() => null);
    if (!json) throw new Error("Invalid JSON from server");

    if (json.errors?.length) {
      const errMsg = json.errors
        .map((e: any) => e.message || JSON.stringify(e))
        .join("; ");
      throw new Error(errMsg);
    }

    const payload: SignUpPayload | undefined = json.data?.signUp;
    if (!payload) throw new Error("Empty signUp response");

    return payload;
  },

  async loginWithGoogle(idToken: string, overrideUrl?: string): Promise<SignInPayload> {
    const url = getGraphqlUrl(overrideUrl);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: GOOGLE_AUTHENTICATION_MUTATION,
          variables: { input: { idToken } },
        }),
      });
    } catch (err: any) {
      throw new Error(`Cannot connect to server: ${err?.message || err}`);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Network error ${res.status}: ${text}`);
    }
    const json = await res.json().catch(() => null);
    if (!json) throw new Error("Invalid JSON from server");
    if (json.errors?.length) {
      const errMsg = json.errors.map((e: any) => e.message || JSON.stringify(e)).join("; ");
      throw new Error(errMsg);
    }
    const payload: SignInPayload | undefined = json.data?.googleAuthentication;
    if (!payload) throw new Error("Google authentication failed");
    return payload;
  },

  async signOut(overrideUrl?: string) {
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: SIGN_OUT_MUTATION,
        }),
      });
    } catch (err: any) {
      throw new Error(`Cannot connect to server: ${err?.message || err}`);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Network error ${res.status}: ${text}`);
    }
    const json = await res.json().catch(() => null);
    if (!json) throw new Error("Invalid JSON from server");
    if (json.errors?.length) {
      const errMsg = json.errors.map((e: any) => e.message || JSON.stringify(e)).join("; ");
      throw new Error(errMsg);
    }
    return json.data?.signOut;
  },

  // Token helpers
  async getAccessToken() {
    return await SecureStore.getItemAsync("accessToken");
  },
  async getRefreshToken() {
    return await SecureStore.getItemAsync("refreshToken");
  },
  async removeTokens() {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("userId");
    await SecureStore.deleteItemAsync("userEmail");
    await SecureStore.deleteItemAsync("userName");
    await SecureStore.deleteItemAsync("userRole");
  },

  // User info helpers
  async getUserInfo() {
    const id = await SecureStore.getItemAsync("userId");
    const email = await SecureStore.getItemAsync("userEmail");
    const name = await SecureStore.getItemAsync("userName");
    const role = await SecureStore.getItemAsync("userRole");
    return { id, email, name, role };
  },
};

export default AuthService;