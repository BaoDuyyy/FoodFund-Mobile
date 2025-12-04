import { getGraphqlUrl } from "@/config/api";
import { UPDATE_DELIVERY_TASK_STATUS } from "@/graphql/mutation/updateDeliveryTaskStatus";
import { GET_DELIVERY_TASK } from "@/graphql/query/getDeliveryTask";
import { MY_DELIVERY_TASKS } from "@/graphql/query/myDeliveryTasks";
import type {
  DeliveryTask,
  DeliveryTaskDetail,
  GetDeliveryTaskResponse,
  MyDeliveryTasksResponse,
} from "@/types/api/delivery";
import AuthService from "./authService";

type UpdateDeliveryTaskStatusInput = {
  taskId: string;
  status: string;
};

type UpdateDeliveryTaskStatusPayload = {
  updateDeliveryTaskStatus: {
    id: string;
    status: string;
    updated_at: string;
  };
};

const DeliveryService = {
  async listMyDeliveryTasks(
    params: { limit?: number; offset?: number } = {},
    overrideUrl?: string
  ): Promise<DeliveryTask[]> {
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();

    const variables = {
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: MY_DELIVERY_TASKS,
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

    const payload: MyDeliveryTasksResponse | undefined = json.data;
    if (!payload || !Array.isArray(payload.myDeliveryTasks)) {
      throw new Error("Empty or invalid myDeliveryTasks response");
    }

    return payload.myDeliveryTasks;
  },

  async updateDeliveryTaskStatus(
    input: UpdateDeliveryTaskStatusInput,
    overrideUrl?: string
  ): Promise<UpdateDeliveryTaskStatusPayload["updateDeliveryTaskStatus"]> {
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();
    const variables = { input };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: UPDATE_DELIVERY_TASK_STATUS,
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

    const payload: UpdateDeliveryTaskStatusPayload | undefined = json.data;
    if (!payload || !payload.updateDeliveryTaskStatus) {
      throw new Error("Empty or invalid updateDeliveryTaskStatus response");
    }

    return payload.updateDeliveryTaskStatus;
  },

  async getDeliveryTaskById(
    id: string,
    overrideUrl?: string
  ): Promise<DeliveryTaskDetail> {
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();
    const variables = { id };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: GET_DELIVERY_TASK,
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

    const payload: GetDeliveryTaskResponse | undefined = json.data;
    if (!payload || !payload.deliveryTask) {
      throw new Error("Empty or invalid deliveryTask response");
    }

    return payload.deliveryTask;
  },
};

export default DeliveryService;
