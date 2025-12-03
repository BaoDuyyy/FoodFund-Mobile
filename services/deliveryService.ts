import { getGraphqlUrl } from "@/config/api";
import { MY_DELIVERY_TASKS } from "@/graphql/query/myDeliveryTasks";
import type {
    DeliveryTask,
    MyDeliveryTasksResponse,
} from "@/types/api/delivery";
import AuthService from "./authService";

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
};

export default DeliveryService;
