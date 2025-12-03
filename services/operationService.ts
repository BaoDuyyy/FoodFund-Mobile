import { getGraphqlUrl } from "@/config/api";
import { CREATE_OPERATION_REQUEST } from "@/graphql/mutation/createOperationRequest";
import type {
    CreateOperationRequestInput,
    OperationRequest,
} from "@/types/api/operationRequest";
import AuthService from "./authService";

type CreateOperationRequestPayload = {
  createOperationRequest: OperationRequest;
};

const OperationService = {
  async createOperationRequest(
    input: CreateOperationRequestInput,
    overrideUrl?: string
  ): Promise<OperationRequest> {
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
          query: CREATE_OPERATION_REQUEST,
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

    const payload: CreateOperationRequestPayload | undefined = json.data;
    if (!payload || !payload.createOperationRequest) {
      throw new Error("Empty or invalid createOperationRequest response");
    }

    return payload.createOperationRequest;
  },
};

export default OperationService;
