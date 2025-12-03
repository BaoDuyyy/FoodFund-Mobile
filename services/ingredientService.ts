import { getGraphqlUrl } from '@/config/api';
import { CREATE_INGREDIENT_REQUEST_MUTATION } from '@/graphql/mutation/createIngredientRequest';
import { GET_MY_INGREDIENT_REQUESTS_QUERY } from '@/graphql/query/getMyIngredientRequests';
import type { CreateIngredientRequestInput, CreateIngredientRequestPayload } from '@/types/api/ingredientRequest';
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


  async getMyIngredientRequests({ limit = 10, offset = 0 } = {}) {
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
    return payload;
  },
};

export default IngredientService;
