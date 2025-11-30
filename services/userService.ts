import { getGraphqlUrl } from "../config/api";
import { GET_MY_PROFILE_QUERY } from "../graphql/query/getMyProfile";
import type { GetMyProfileResponse } from "../types/api/user";

export const UserService = {
  async getMyProfile(overrideUrl?: string) {
    const url = getGraphqlUrl(overrideUrl);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
};

export default UserService;
