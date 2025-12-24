import { getGraphqlUrl } from "@/config/api";
import { UPDATE_DELIVERY_TASK_STATUS } from "@/graphql/mutation/updateDeliveryTaskStatus";
import { DELIVERY_TASKS } from "@/graphql/query/deliveryTasks";
import { GET_DELIVERY_TASK } from "@/graphql/query/getDeliveryTask";
import { MY_DELIVERY_TASKS } from "@/graphql/query/myDeliveryTasks";
import type {
  DeliveryTask,
  DeliveryTaskDetail,
  DeliveryTaskFilterInput,
  DeliveryTasksResponse,
  DeliveryTaskWithStaff,
  GetDeliveryTaskResponse,
  MyDeliveryTasksResponse,
  UpdateDeliveryTaskStatusInput,
  UpdateDeliveryTaskStatusPayload,
} from "@/types/api/delivery";
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
 * Generic GraphQL request handler for DeliveryService
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
// DELIVERY SERVICE
// =============================================================================

const DeliveryService = {
  /**
   * Fetch the current user's delivery tasks with pagination
   */
  async listMyDeliveryTasks(
    params: { limit?: number; offset?: number } = {},
    overrideUrl?: string
  ): Promise<DeliveryTask[]> {
    const variables = {
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
    };

    const response = await graphqlRequest<MyDeliveryTasksResponse>(
      MY_DELIVERY_TASKS,
      variables,
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.myDeliveryTasks;
    if (!Array.isArray(payload)) {
      throw new Error("Empty or invalid myDeliveryTasks response");
    }

    return payload;
  },

  /**
   * Fetch delivery tasks with filter (campaignId, campaignPhaseId, etc.)
   */
  async listDeliveryTasks(
    filter: DeliveryTaskFilterInput,
    overrideUrl?: string
  ): Promise<DeliveryTaskWithStaff[]> {
    const response = await graphqlRequest<DeliveryTasksResponse>(
      DELIVERY_TASKS,
      { filter },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.deliveryTasks;
    if (!Array.isArray(payload)) {
      throw new Error("Empty or invalid deliveryTasks response");
    }

    return payload;
  },

  /**
   * Update the status of a delivery task
   */
  async updateDeliveryTaskStatus(
    input: UpdateDeliveryTaskStatusInput,
    overrideUrl?: string
  ): Promise<UpdateDeliveryTaskStatusPayload["updateDeliveryTaskStatus"]> {
    const response = await graphqlRequest<UpdateDeliveryTaskStatusPayload>(
      UPDATE_DELIVERY_TASK_STATUS,
      { input },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.updateDeliveryTaskStatus;
    if (!payload) {
      throw new Error("Empty or invalid updateDeliveryTaskStatus response");
    }

    return payload;
  },

  /**
   * Fetch a single delivery task by ID with full details
   */
  async getDeliveryTaskById(
    id: string,
    overrideUrl?: string
  ): Promise<DeliveryTaskDetail> {
    const response = await graphqlRequest<GetDeliveryTaskResponse>(
      GET_DELIVERY_TASK,
      { id },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.deliveryTask;
    if (!payload) {
      throw new Error("Empty or invalid deliveryTask response");
    }

    return payload;
  },
};

export default DeliveryService;
