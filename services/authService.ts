import { getGraphqlUrl } from "../config/api";
import { LOGIN_MUTATION } from "../graphql/mutation/login";
import { SIGNUP_MUTATION } from "../graphql/mutation/signup";
import {
  SignInInput,
  SignInPayload,
  SignUpInput,
  SignUpPayload,
} from "../types/api/auth";

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
};

export default AuthService;