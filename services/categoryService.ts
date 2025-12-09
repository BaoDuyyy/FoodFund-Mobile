import { getGraphqlUrl } from "../config/api";
import { CAMPAIGN_CATEGORIES_STATS_QUERY } from "../graphql/query/campaignCategoriesStats";
import type { Category } from "../types/api/category";
import type { GraphQLResponse } from "../types/graphql";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract error message from GraphQL errors array
 */
function extractErrorMessage(errors: Array<{ message?: string }> | undefined): string | null {
  if (!errors || errors.length === 0) return null;
  return errors.map((e) => e.message || JSON.stringify(e)).join("; ");
}

/**
 * Generic GraphQL request handler for CategoryService
 * Similar to the pattern used in campaignService and authService
 */
async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  overrideUrl?: string
): Promise<GraphQLResponse<T>> {
  const url = getGraphqlUrl(overrideUrl);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Cannot connect to server: ${message}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Network error ${res.status}: ${text}`);
  }

  const json = await res.json().catch(() => null);
  if (!json) {
    throw new Error("Invalid JSON from server");
  }

  return json as GraphQLResponse<T>;
}

// =============================================================================
// CATEGORY SERVICE
// =============================================================================

type CampaignCategoriesStatsResponse = {
  campaignCategoriesStats: Category[];
};

export const CategoryService = {
  /**
   * Fetch all campaign categories with stats
   */
  async listCategories(overrideUrl?: string): Promise<Category[]> {
    const response = await graphqlRequest<CampaignCategoriesStatsResponse>(
      CAMPAIGN_CATEGORIES_STATS_QUERY,
      {},
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.campaignCategoriesStats;
    if (!Array.isArray(payload)) {
      throw new Error("No categories found");
    }

    return payload;
  },
};

export default CategoryService;

