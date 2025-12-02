import { getGraphqlUrl } from "../config/api";
import { CAMPAIGN_CATEGORIES_STATS_QUERY } from "../graphql/query/campaignCategoriesStats";
import type { Category } from "../types/api/category";

export const CategoryService = {
  async listCategories(overrideUrl?: string): Promise<Category[]> {
    const url = getGraphqlUrl(overrideUrl);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: CAMPAIGN_CATEGORIES_STATS_QUERY,
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
    const payload = json.data?.campaignCategoriesStats;
    if (!Array.isArray(payload)) throw new Error("No categories found");
    return payload;
  },
};

export default CategoryService;
