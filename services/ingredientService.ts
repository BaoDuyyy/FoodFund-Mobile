import { getGraphqlUrl } from '@/config/api';
import { CREATE_INGREDIENT_REQUEST_MUTATION } from '@/graphql/mutation/createIngredientRequest';
import { GET_INGREDIENT_REQUESTS } from '@/graphql/query/getIngredientRequests';
import { GET_MY_INGREDIENT_REQUESTS_QUERY } from '@/graphql/query/getMyIngredientRequests';
import type {
  CreateIngredientRequestInput,
  CreateIngredientRequestPayload,
  MyIngredientRequest,
} from '@/types/api/ingredientRequest';
import AuthService from "./authService";

export const IngredientService = {
  async createIngredientRequest(
    input: CreateIngredientRequestInput,
    overrideUrl?: string
  ): Promise<CreateIngredientRequestPayload> {
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();   // 👈 Lấy access token

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}), // 👈 Gửi kèm
        },
        body: JSON.stringify({
          query: CREATE_INGREDIENT_REQUEST_MUTATION,
          variables: { input },
        }),
      });
    } catch (err: any) {
      throw new Error(`Cannot connect to server: ${err?.message || err}`);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Network error ${res.status}: ${text}`);
    }

    const json = await res.json().catch(() => null);
    if (!json) throw new Error('Invalid JSON from server');

    if (json.errors?.length) {
      const errMsg = json.errors
        .map((e: any) => e.message || JSON.stringify(e))
        .join('; ');
      throw new Error(errMsg);
    }

    const payload: CreateIngredientRequestPayload | undefined =
      json.data?.createIngredientRequest;
    if (!payload) throw new Error('Empty createIngredientRequest response');
    return payload;
  },


  async getMyIngredientRequests(
    { limit = 10, offset = 0 } = {}
  ): Promise<MyIngredientRequest[]> {
    const url = getGraphqlUrl();
    const token = await AuthService.getAccessToken();
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: GET_MY_INGREDIENT_REQUESTS_QUERY,
          variables: { limit, offset },
        }),
      });
    } catch (err: any) {
      throw new Error(`Cannot connect to server: ${err?.message || err}`);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Network error ${res.status}: ${text}`);
    }
    const json = await res.json().catch(() => null);
    if (!json) throw new Error('Invalid JSON from server');
    if (json.errors?.length) {
      const errMsg = json.errors.map((e: any) => e.message || JSON.stringify(e)).join('; ');
      throw new Error(errMsg);
    }
    const payload = json.data?.getMyIngredientRequests;
    if (!Array.isArray(payload)) {
      throw new Error('Empty or invalid getMyIngredientRequests response');
    }
    return payload as MyIngredientRequest[];
  },

  async getIngredientRequests(
    params: {
      filter?: {
        campaignPhaseId?: string;
        status?: string;
        sortBy?: string;
      };
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<any[]> {
    const url = getGraphqlUrl();
    const token = await AuthService.getAccessToken();
    const variables = {
      filter: params.filter || {},
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: GET_INGREDIENT_REQUESTS,
          variables,
        }),
      });
    } catch (err: any) {
      throw new Error(`Cannot connect to server: ${err?.message || err}`);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Network error ${res.status}: ${text}`);
    }
    const json = await res.json().catch(() => null);
    if (!json) throw new Error('Invalid JSON from server');
    if (json.errors?.length) {
      const errMsg = json.errors.map((e: any) => e.message || JSON.stringify(e)).join('; ');
      throw new Error(errMsg);
    }
    const payload = json.data?.getIngredientRequests;
    if (!Array.isArray(payload)) {
      throw new Error('Empty or invalid getIngredientRequests response');
    }
    return payload;
  },
};

export default IngredientService;
