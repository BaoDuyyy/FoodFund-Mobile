import { getGraphqlUrl } from "../config/api";
import { GET_CAMPAIGN_QUERY } from "../graphql/query/getCampaign";
import { GET_CAMPAIGN_DONATION_STATEMENT } from "../graphql/query/getCampaignDonationStatement";
import { LIST_CAMPAIGNS_QUERY } from "../graphql/query/listCampaigns";
import { SEARCH_CAMPAIGNS_QUERY } from "../graphql/query/searchCampaigns";
import type {
  CampaignDetail,
  CampaignDonationStatement,
  CampaignItem,
  ListCampaignsResponse,
  ListCampaignsVars,
} from "../types/api/campaign";
import AuthService from "./authService";

const DEFAULT_VARS: ListCampaignsVars = {
  filter: {
    status: ["ACTIVE"],
    creatorId: null,
    categoryId: null,
  },
  search: "",
  sortBy: "MOST_DONATED",
  limit: 10,
  offset: 0,
};

type GetCampaignDonationStatementPayload = {
  getCampaignDonationStatement: CampaignDonationStatement;
};

export const CampaignService = {
  async listCampaigns(
    vars?: Partial<ListCampaignsVars>,
    overrideUrl?: string
  ): Promise<CampaignItem[]> {
    const variables: ListCampaignsVars = {
      ...DEFAULT_VARS,
      ...(vars || {}),
      // merge filter object specially so defaults are preserved
      filter: { ...(DEFAULT_VARS.filter as any), ...(vars?.filter as any) },
    };

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
          query: LIST_CAMPAIGNS_QUERY,
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

    const payload: ListCampaignsResponse | undefined = json.data;
    if (!payload || !Array.isArray(payload.campaigns)) {
      throw new Error("Empty or invalid campaigns response");
    }

    return payload.campaigns;
  },

  /**
   * Fetch a single campaign by id.
   * Returns CampaignDetail or throws on error.
   */
  async getCampaign(id: string, overrideUrl?: string): Promise<CampaignDetail> {
    if (!id) throw new Error("campaign id is required");
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
          query: GET_CAMPAIGN_QUERY,
          variables: { id },
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

    const campaign: CampaignDetail | undefined = json.data?.campaign;
    if (!campaign) throw new Error("Campaign not found");

    return campaign;
  },

  async searchCampaigns(
    input: any, // input.creatorId should now be cognito_id
    overrideUrl?: string
  ): Promise<CampaignItem[]> {
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
          query: SEARCH_CAMPAIGNS_QUERY,
          variables: { input },
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
    const payload = json.data?.searchCampaigns;
    if (!payload || !Array.isArray(payload.items)) {
      throw new Error("Empty or invalid searchCampaigns response");
    }
    return payload.items;
  },

  async getCampaignDonationStatement(
    campaignId: string,
    overrideUrl?: string
  ): Promise<CampaignDonationStatement> {
    if (!campaignId) throw new Error("campaignId is required");

    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: GET_CAMPAIGN_DONATION_STATEMENT,
          variables: { campaignId },
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

    const payload: GetCampaignDonationStatementPayload | undefined = json.data;
    if (!payload || !payload.getCampaignDonationStatement) {
      throw new Error("Empty or invalid getCampaignDonationStatement response");
    }

    return payload.getCampaignDonationStatement;
  },
};

export default CampaignService;