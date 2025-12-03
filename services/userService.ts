import { getGraphqlUrl } from "../config/api";
import { GENERATE_AVATAR_UPLOAD_URL } from "../graphql/mutation/generateAvatarUploadUrl";
import { UPDATE_MY_PROFILE } from "../graphql/mutation/updateMyProfile";
import { GET_MY_PROFILE_QUERY } from "../graphql/query/getMyProfile";
import type {
  GenerateAvatarUploadUrlInput,
  GenerateAvatarUploadUrlResult,
  GetMyProfileResponse,
  UpdateMyProfileInput,
  UpdateMyProfileResult
} from "../types/api/user";
import AuthService from "./authService";

// helper payload types for GraphQL responses
type GenerateAvatarUploadUrlPayload = {
  generateAvatarUploadUrl: GenerateAvatarUploadUrlResult;
};

type UpdateMyProfilePayload = {
  updateMyProfile: UpdateMyProfileResult;
};

export const UserService = {
  async getMyProfile(overrideUrl?: string) {
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
        body: JSON.stringify({ query: GET_MY_PROFILE_QUERY }),
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

    const payload: GetMyProfileResponse | undefined = json.data;
    if (!payload || !payload.getMyProfile?.userProfile) {
      throw new Error("Empty or invalid profile response");
    }

    return payload.getMyProfile.userProfile;
  },

  async generateAvatarUploadUrl(
    input: GenerateAvatarUploadUrlInput,
    overrideUrl?: string
  ): Promise<GenerateAvatarUploadUrlResult> {
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();
    const variables = { input };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: GENERATE_AVATAR_UPLOAD_URL,
          variables,
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
      const errMsg = json.errors
        .map((e: any) => e.message || JSON.stringify(e))
        .join("; ");
      throw new Error(errMsg);
    }

    const payload: GenerateAvatarUploadUrlPayload | undefined = json.data;
    if (!payload || !payload.generateAvatarUploadUrl) {
      throw new Error("Empty generateAvatarUploadUrl response");
    }

    return payload.generateAvatarUploadUrl;
  },

  async updateMyProfile(
    input: UpdateMyProfileInput,
    overrideUrl?: string
  ): Promise<UpdateMyProfileResult> {
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();
    const variables = { input };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: UPDATE_MY_PROFILE,
          variables,
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
      const errMsg = json.errors
        .map((e: any) => e.message || JSON.stringify(e))
        .join("; ");
      throw new Error(errMsg);
    }

    const payload: UpdateMyProfilePayload | undefined = json.data;
    if (!payload || !payload.updateMyProfile) {
      throw new Error("Empty updateMyProfile response");
    }

    return payload.updateMyProfile;
  },
};

export default UserService;
