import { getGraphqlUrl } from "../config/api";
import { GET_CAMPAIGN_QUERY } from "../graphql/query/getCampaign";
import { LIST_CAMPAIGNS_QUERY } from "../graphql/query/listCampaigns";
import type {
  CampaignDetail,
  CampaignItem,
  ListCampaignsResponse,
  ListCampaignsVars,
} from "../types/api/campaign";

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

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
};

export default CampaignService;