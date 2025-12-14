import { getGraphqlUrl } from "@/config/api";
import { CREATE_INGREDIENT_REQUEST_MUTATION } from "@/graphql/mutation/createIngredientRequest";
import { GET_INGREDIENT_REQUESTS } from "@/graphql/query/getIngredientRequests";
import { GET_MY_INGREDIENT_REQUESTS_QUERY } from "@/graphql/query/getMyIngredientRequests";
import type {
  CreateIngredientRequestInput,
  CreateIngredientRequestPayload,
  CreateIngredientRequestResponse,
  GetIngredientRequestsResponse,
  GetIngredientRequestsVars,
  GetMyIngredientRequestsOptions,
  GetMyIngredientRequestsResponse,
  IngredientRequestListResponse,
  MyIngredientRequest,
} from "@/types/api/ingredientRequest";
import type { GraphQLResponse } from "@/types/graphql";
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
 * Generic GraphQL request handler for IngredientService
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
// INGREDIENT SERVICE
// =============================================================================

export const IngredientService = {
  /**
   * Create a new ingredient request for a campaign phase
   */
  async createIngredientRequest(
    input: CreateIngredientRequestInput,
    overrideUrl?: string
  ): Promise<CreateIngredientRequestPayload> {
    const response = await graphqlRequest<CreateIngredientRequestResponse>(
      CREATE_INGREDIENT_REQUEST_MUTATION,
      { input },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.createIngredientRequest;
    if (!payload) {
      throw new Error("Empty createIngredientRequest response");
    }

    return payload;
  },

  /**
   * Get ingredient requests for the current user with pagination
   */
  async getMyIngredientRequests(
    options: GetMyIngredientRequestsOptions = {}
  ): Promise<MyIngredientRequest[]> {
    const { limit = 10, offset = 0 } = options;

    const response = await graphqlRequest<GetMyIngredientRequestsResponse>(
      GET_MY_INGREDIENT_REQUESTS_QUERY,
      { limit, offset }
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.getMyIngredientRequests;
    if (!Array.isArray(payload)) {
      throw new Error("Empty or invalid getMyIngredientRequests response");
    }

    return payload;
  },

  /**
   * Get all ingredient requests with filtering and pagination (admin/overview)
   * Returns requests with kitchenStaff, campaignPhase, and items details
   */
  async getIngredientRequests(
    params: GetIngredientRequestsVars = {}
  ): Promise<IngredientRequestListResponse[]> {
    const variables = {
      filter: params.filter || {},
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
    };

    const response = await graphqlRequest<GetIngredientRequestsResponse>(
      GET_INGREDIENT_REQUESTS,
      variables
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.getIngredientRequests;
    if (!Array.isArray(payload)) {
      throw new Error("Empty or invalid getIngredientRequests response");
    }

    return payload;
  },
};

export default IngredientService;
