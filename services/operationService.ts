import { getGraphqlUrl } from "@/config/api";
import { CREATE_OPERATION_REQUEST } from "@/graphql/mutation/createOperationRequest";
import { MY_OPERATION_REQUESTS } from "@/graphql/query/myOperationRequests";
import type {
  CreateOperationRequestInput,
  CreateOperationRequestPayload,
  ListOperationRequestsOptions,
  MyOperationRequestsPayload,
  OperationRequest,
} from "@/types/api/operationRequest";
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
 * Generic GraphQL request handler for OperationService
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
// OPERATION SERVICE
// =============================================================================

const OperationService = {
  /**
   * Create a new operation request
   */
  async createOperationRequest(
    input: CreateOperationRequestInput,
    overrideUrl?: string
  ): Promise<OperationRequest> {
    const response = await graphqlRequest<CreateOperationRequestPayload>(
      CREATE_OPERATION_REQUEST,
      { input },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.createOperationRequest;
    if (!payload) {
      throw new Error("Empty or invalid createOperationRequest response");
    }

    return payload;
  },

  /**
   * Get operation requests for the current user with pagination
   */
  async listMyOperationRequests(
    params: ListOperationRequestsOptions = {},
    overrideUrl?: string
  ): Promise<OperationRequest[]> {
    const variables = {
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
      sortBy: params.sortBy ?? "NEWEST_FIRST",
    };

    const response = await graphqlRequest<MyOperationRequestsPayload>(
      MY_OPERATION_REQUESTS,
      variables,
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.myOperationRequests;
    if (!Array.isArray(payload)) {
      throw new Error("Empty or invalid myOperationRequests response");
    }

    return payload;
  },
};

export default OperationService;
