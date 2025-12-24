import { getGraphqlUrl } from "../config/api";
import { GET_MY_ORGANIZATION } from "../graphql/query/getMyOrganization";
import { GET_ORGANIZATION_BY_ID_QUERY } from "../graphql/query/getOrganizationById";
import { LIST_ACTIVE_ORGANIZATIONS_QUERY } from "../graphql/query/listActiveOrganizations";
import { MY_ORGANIZATION } from "../graphql/query/myOrganization";
import type {
  GetMyOrganizationResponse,
  GetOrganizationByIdResponse,
  ListActiveOrganizationsResponse,
  MyOrganizationResponse,
  Organization
} from "../types/api/organization";
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
 * Generic GraphQL request handler for OrganizationService
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
// ORGANIZATION SERVICE
// =============================================================================

export const OrganizationService = {
  /**
   * Get a single organization by ID
   */
  async getOrganizationById(id: string, overrideUrl?: string): Promise<Organization> {
    if (!id) {
      throw new Error("organization id is required");
    }

    const response = await graphqlRequest<GetOrganizationByIdResponse>(
      GET_ORGANIZATION_BY_ID_QUERY,
      { getOrganizationByIdId: id },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.getOrganizationById;
    if (!payload) {
      throw new Error("Organization not found");
    }

    return payload;
  },

  /**
   * List all active organizations
   */
  async listActiveOrganizations(overrideUrl?: string): Promise<Organization[]> {
    const response = await graphqlRequest<ListActiveOrganizationsResponse>(
      LIST_ACTIVE_ORGANIZATIONS_QUERY,
      {},
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.listActiveOrganizations?.organizations;
    if (!Array.isArray(payload)) {
      throw new Error("Empty or invalid organizations response");
    }

    return payload;
  },

  /**
   * Get the representative ID of the organization the current user belongs to
   */
  async getMyOrganizationId(overrideUrl?: string): Promise<string | null> {
    const organizations = await OrganizationService.listActiveOrganizations(overrideUrl);
    const userInfo = await AuthService.getUserInfo();
    const myEmail = userInfo.email;

    if (!myEmail) {
      throw new Error("User email not found in SecureStore");
    }

    for (const org of organizations) {
      if (Array.isArray(org.members)) {
        for (const m of org.members) {
          if (m?.member?.email === myEmail) {
            // Return the user id of the representative (owner) of this organization
            return org.representative?.id || null;
          }
        }
      }
    }

    throw new Error("No organization found for current user");
  },

  /**
   * Get the current user's organization with full member details
   */
  async getMyOrganization(overrideUrl?: string): Promise<Organization> {
    const response = await graphqlRequest<MyOrganizationResponse>(
      MY_ORGANIZATION,
      {},
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.myOrganization;
    if (!payload) {
      throw new Error("Organization not found for current user");
    }

    return payload;
  },

  /**
   * Get organization for staff (kitchen/delivery) with full member details
   * Uses getMyOrganization query - different from myOrganization
   * Includes cognito_id for filtering delivery tasks
   */
  async getStaffOrganization(overrideUrl?: string): Promise<Organization> {
    const response = await graphqlRequest<GetMyOrganizationResponse>(
      GET_MY_ORGANIZATION,
      {},
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.getMyOrganization;
    if (!payload) {
      throw new Error("Organization not found for staff user");
    }

    return payload;
  },
};

export default OrganizationService;
