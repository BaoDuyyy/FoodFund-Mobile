import { getGraphqlUrl } from "../config/api";
import { CREATE_DONATION_MUTATION } from "../graphql/mutation/createDonation";
import { SEARCH_DONATION_STATEMENTS_QUERY } from "../graphql/query/searchDonationStatements";
import type { CreateDonationInput, CreateDonationResult } from "../types/api/donation";
import AuthService from "./authService";

export const DonationService = {
  async createDonation(
    input: CreateDonationInput,
    overrideUrl?: string
  ): Promise<CreateDonationResult> {
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
          query: CREATE_DONATION_MUTATION,
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

    const result: CreateDonationResult | undefined = json.data?.createDonation;
    if (!result) throw new Error("Empty createDonation response");

    return result;
  },

  async listDonationStatements(
    input: {
      campaignId: string;
      limit?: number;
      maxAmount?: number | null;
      minAmount?: number | null;
      page?: number;
      query?: string | null;
      sortBy?: string | null;
    },
    overrideUrl?: string
  ) {
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
          query: SEARCH_DONATION_STATEMENTS_QUERY,
          variables: { searchDonationStatementsInput2: input },
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
    const payload = json.data?.searchDonationStatements;
    if (!payload) throw new Error("No donation statements found");
    return payload;
  },
};

export default DonationService;