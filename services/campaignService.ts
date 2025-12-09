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
  SearchCampaignInput,
} from "../types/api/campaign";
import type { GraphQLResponse } from "../types/graphql";
import AuthService from "./authService";

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_LIST_VARS: ListCampaignsVars = {
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract error messages from GraphQL errors array
 */
function extractErrorMessage(errors: Array<{ message?: string }>): string {
  return errors.map((e) => e.message || JSON.stringify(e)).join("; ");
}

/**
 * Generic GraphQL request handler with authentication
 */
async function graphqlRequest<T>(options: {
  query: string;
  variables?: Record<string, any>;
  overrideUrl?: string;
}): Promise<GraphQLResponse<T>> {
  const { query, variables, overrideUrl } = options;
  const url = getGraphqlUrl(overrideUrl);
  const token = await AuthService.getAccessToken();

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

/**
 * Merge list vars with defaults, preserving filter object
 */
function mergeListVars(vars?: Partial<ListCampaignsVars>): ListCampaignsVars {
  return {
    ...DEFAULT_LIST_VARS,
    ...(vars || {}),
    filter: {
      ...(DEFAULT_LIST_VARS.filter as any),
      ...(vars?.filter as any),
    },
  };
}

// ============================================================================
// CAMPAIGN SERVICE
// ============================================================================

export const CampaignService = {
  /**
   * List campaigns with optional filters
   */
  async listCampaigns(
    vars?: Partial<ListCampaignsVars>,
    overrideUrl?: string
  ): Promise<CampaignItem[]> {
    const variables = mergeListVars(vars);

    const response = await graphqlRequest<ListCampaignsResponse>({
      query: LIST_CAMPAIGNS_QUERY,
      variables,
      overrideUrl,
    });

    const campaigns = response.data?.campaigns;
    if (!Array.isArray(campaigns)) {
      throw new Error("Empty or invalid campaigns response");
    }

    return campaigns;
  },

  /**
   * Get a single campaign by ID
   */
  async getCampaign(
    id: string,
    overrideUrl?: string
  ): Promise<CampaignDetail> {
    if (!id) {
      throw new Error("Campaign id is required");
    }

    const response = await graphqlRequest<{ campaign: CampaignDetail }>({
      query: GET_CAMPAIGN_QUERY,
      variables: { id },
      overrideUrl,
    });

    const campaign = response.data?.campaign;
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    return campaign;
  },

  /**
   * Search campaigns with advanced filters
   */
  async searchCampaigns(
    input: SearchCampaignInput,
    overrideUrl?: string
  ): Promise<CampaignItem[]> {
    const response = await graphqlRequest<{
      searchCampaigns: { items: CampaignItem[] };
    }>({
      query: SEARCH_CAMPAIGNS_QUERY,
      variables: { input },
      overrideUrl,
    });

    const items = response.data?.searchCampaigns?.items;
    if (!Array.isArray(items)) {
      throw new Error("Empty or invalid searchCampaigns response");
    }

    return items;
  },

  /**
   * Get donation statement for a campaign
   */
  async getCampaignDonationStatement(
    campaignId: string,
    overrideUrl?: string
  ): Promise<CampaignDonationStatement> {
    if (!campaignId) {
      throw new Error("Campaign id is required");
    }

    const response = await graphqlRequest<{
      getCampaignDonationStatement: CampaignDonationStatement;
    }>({
      query: GET_CAMPAIGN_DONATION_STATEMENT,
      variables: { campaignId },
      overrideUrl,
    });

    const statement = response.data?.getCampaignDonationStatement;
    if (!statement) {
      throw new Error("Empty or invalid getCampaignDonationStatement response");
    }

    return statement;
  },
};

export default CampaignService;