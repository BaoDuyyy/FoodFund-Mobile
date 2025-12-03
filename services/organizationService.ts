import { getGraphqlUrl } from "../config/api";
import { GET_ORGANIZATION_BY_ID_QUERY } from "../graphql/query/getOrganizationById";
import { LIST_ACTIVE_ORGANIZATIONS_QUERY } from "../graphql/query/listActiveOrganizations";
import type {
  GetOrganizationByIdResponse,
  ListActiveOrganizationsResponse,
} from "../types/api/organization";
import AuthService from "./authService";

export const OrganizationService = {
  async getOrganizationById(id: string, overrideUrl?: string) {
    if (!id) throw new Error("organization id is required");
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
          query: GET_ORGANIZATION_BY_ID_QUERY,
          variables: { getOrganizationByIdId: id },
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
    const payload: GetOrganizationByIdResponse | undefined = json.data;
    if (!payload || !payload.getOrganizationById) {
      throw new Error("Organization not found");
    }
    return payload.getOrganizationById;
  },

  async listActiveOrganizations(overrideUrl?: string) {
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
          query: LIST_ACTIVE_ORGANIZATIONS_QUERY,
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
    const payload: ListActiveOrganizationsResponse | undefined = json.data;
    if (!payload || !Array.isArray(payload.listActiveOrganizations?.organizations)) {
      throw new Error("Empty or invalid organizations response");
    }
    return payload.listActiveOrganizations.organizations;
  },

  async getMyOrganizationId(overrideUrl?: string) {
    const organizations = await OrganizationService.listActiveOrganizations(overrideUrl);
    const userInfo = await AuthService.getUserInfo();
    const myEmail = userInfo.email;
    if (!myEmail) throw new Error("User email not found in SecureStore");

    for (const org of organizations) {
      if (Array.isArray(org.members)) {
        for (const m of org.members) {
          if (m?.member?.email === myEmail) {
            // Trả về user id của người đại diện (chủ sở hữu) organization này
            return org.representative?.id || null;
          }
        }
      }
    }
    throw new Error("No organization found for current user");
  },
};

export default OrganizationService;
