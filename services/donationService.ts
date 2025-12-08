import { getGraphqlUrl } from "../config/api";
import { CREATE_DONATION_MUTATION } from "../graphql/mutation/createDonation";
import { GET_MY_DONATIONS } from "../graphql/query/getMyDonations";
import { SEARCH_DONATION_STATEMENTS_QUERY } from "../graphql/query/searchDonationStatements";
import type {
  CreateDonationInput,
  CreateDonationResult,
  GetMyDonationsOptions,
  GetMyDonationsResponse,
  GetMyDonationsResult,
  SearchDonationStatementsInput,
  SearchDonationStatementsResponse,
  SearchDonationStatementsResult,
} from "../types/api/donation";
import type { GraphQLResponse } from "../types/graphql";
import AuthService from "./authService";

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
 * Generic GraphQL request handler for DonationService
 * Includes authentication token in requests
 */
async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  overrideUrl?: string
): Promise<GraphQLResponse<T>> {
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
// DONATION SERVICE
// =============================================================================

type CreateDonationResponse = {
  createDonation: CreateDonationResult;
};

export const DonationService = {
  /**
   * Create a new donation for a campaign
   */
  async createDonation(
    input: CreateDonationInput,
    overrideUrl?: string
  ): Promise<CreateDonationResult> {
    const response = await graphqlRequest<CreateDonationResponse>(
      CREATE_DONATION_MUTATION,
      { input },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const result = response.data?.createDonation;
    if (!result) {
      throw new Error("Empty createDonation response");
    }

    return result;
  },

  /**
   * Search donation statements for a campaign with filtering and pagination
   */
  async listDonationStatements(
    input: SearchDonationStatementsInput,
    overrideUrl?: string
  ): Promise<SearchDonationStatementsResult> {
    const response = await graphqlRequest<SearchDonationStatementsResponse>(
      SEARCH_DONATION_STATEMENTS_QUERY,
      { searchDonationStatementsInput2: input },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.searchDonationStatements;
    if (!payload) {
      throw new Error("No donation statements found");
    }

    return payload;
  },

  /**
   * Get donation history for the current authenticated user
   */
  async getMyDonations(
    overrideUrl?: string,
    options: GetMyDonationsOptions = {}
  ): Promise<GetMyDonationsResult> {
    const skip = options.skip ?? 0;
    const take = options.take ?? 10;

    const response = await graphqlRequest<GetMyDonationsResponse>(
      GET_MY_DONATIONS,
      { skip, take },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.getMyDonations;
    if (!payload) {
      throw new Error("Empty getMyDonations response");
    }

    return payload;
  },
};

export default DonationService;