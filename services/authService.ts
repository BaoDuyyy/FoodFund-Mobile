import * as SecureStore from "expo-secure-store";
import { getGraphqlUrl } from "../config/api";
import { LOGIN_MUTATION } from "../graphql/mutation/login";
import { SIGNUP_MUTATION } from "../graphql/mutation/signup";
import {
  SignInInput,
  SignInPayload,
  SignUpInput,
  SignUpPayload,
} from "../types/api/auth";

function parseJwt(token: string): any {
  try {
    const base64 = token.split(".")[1];
    const json = Buffer.from(base64, "base64").toString();
    return JSON.parse(json);
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
      if (decoded) {
        await SecureStore.setItemAsync("userId", decoded.sub || "");
        await SecureStore.setItemAsync("userEmail", decoded.email || "");
        await SecureStore.setItemAsync("userName", decoded.username || "");
        await SecureStore.setItemAsync("userRole", decoded["custom:role"] || "");
      }
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