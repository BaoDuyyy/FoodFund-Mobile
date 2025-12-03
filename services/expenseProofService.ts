import { getGraphqlUrl } from "@/config/api";
import { CREATE_EXPENSE_PROOF } from "@/graphql/mutation/createExpenseProof";
import { GENERATE_EXPENSE_PROOF_UPLOAD_URLS } from "@/graphql/mutation/generateExpenseProofUploadUrls";
import { GET_EXPENSE_PROOFS } from "@/graphql/query/getExpenseProofs";
import { GET_MY_EXPENSE_PROOFS } from "@/graphql/query/getMyExpenseProofs";
import AuthService from "./authService";

// Các fileType phổ biến
export const COMMON_EXPENSE_FILE_TYPES = ["jpg", "png", "mp4"] as const;
export type ExpenseProofFileType = (typeof COMMON_EXPENSE_FILE_TYPES)[number];

type GenerateExpenseProofUploadUrlsInput = {
  requestId: string;
  fileCount: number;
  fileTypes: ExpenseProofFileType[];
};

export type ExpenseProofUploadUrl = {
  uploadUrl: string;
  fileKey: string;
  cdnUrl: string;
  expiresAt: string;
  fileType: string;
};

type GenerateExpenseProofUploadUrlsPayload = {
  generateExpenseProofUploadUrls: {
    success: boolean;
    uploadUrls: ExpenseProofUploadUrl[];
    instructions?: string | null;
  };
};

// Shape đúng với mutation createExpenseProof / query getMyExpenseProofs
export type ExpenseProof = {
  id: string;
  requestId: string;
  media?: string[] | null;
  amount: string;
  status: string;
  adminNote?: string | null;
  created_at: string;
  updated_at?: string;
};

type CreateExpenseProofInput = {
  requestId: string;
  mediaFileKeys: string[];
  amount: string;
};

type CreateExpenseProofPayload = {
  createExpenseProof: ExpenseProof;
};

type GetMyExpenseProofsPayload = {
  getMyExpenseProofs: ExpenseProof[];
};

type GetExpenseProofsPayload = {
  getExpenseProofs: ExpenseProof[];
};

type GetExpenseProofsVars = {
  filter?: any; // ExpenseProofFilterInput – có thể tạo type riêng sau
  limit?: number;
  offset?: number;
};

const ExpenseProofService = {
  /**
   * Step 1: Lấy danh sách signed upload URLs cho chứng từ chi tiêu.
   */
  async generateExpenseProofUploadUrls(
    input: GenerateExpenseProofUploadUrlsInput,
    overrideUrl?: string
  ): Promise<ExpenseProofUploadUrl[]> {
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
          query: GENERATE_EXPENSE_PROOF_UPLOAD_URLS,
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

    const payload: GenerateExpenseProofUploadUrlsPayload | undefined = json.data;
    if (!payload || !payload.generateExpenseProofUploadUrls) {
      throw new Error("Empty or invalid generateExpenseProofUploadUrls response");
    }
    if (!payload.generateExpenseProofUploadUrls.success) {
      throw new Error("Failed to generate expense proof upload URLs");
    }

    return payload.generateExpenseProofUploadUrls.uploadUrls;
  },

  /**
   * Step 2: Tạo expense proof sau khi upload file xong.
   */
  async createExpenseProof(
    input: CreateExpenseProofInput,
    overrideUrl?: string
  ): Promise<ExpenseProof> {
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
          query: CREATE_EXPENSE_PROOF,
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

    const expenseProof: ExpenseProof | undefined = json.data?.createExpenseProof;
    if (!expenseProof) {
      throw new Error("Empty or invalid createExpenseProof response");
    }

    return expenseProof;
  },

  /**
   * Lấy danh sách expense proofs của current user,
   * có thể filter theo requestId (optional).
   */
  async getMyExpenseProofs(
    requestId?: string,
    overrideUrl?: string
  ): Promise<ExpenseProof[]> {
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();
    const variables = { requestId };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: GET_MY_EXPENSE_PROOFS,
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

    const payload: GetMyExpenseProofsPayload | undefined = json.data;
    if (!payload || !Array.isArray(payload.getMyExpenseProofs)) {
      throw new Error("Empty or invalid getMyExpenseProofs response");
    }

    return payload.getMyExpenseProofs;
  },

  /**
   * Admin / tổng quan: lấy danh sách tất cả expense proofs với filter + paging.
   */
  async getExpenseProofs(
    vars: GetExpenseProofsVars = {},
    overrideUrl?: string
  ): Promise<ExpenseProof[]> {
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();
    const variables = vars;

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: GET_EXPENSE_PROOFS,
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

    const payload: GetExpenseProofsPayload | undefined = json.data;
    if (!payload || !Array.isArray(payload.getExpenseProofs)) {
      throw new Error("Empty or invalid getExpenseProofs response");
    }

    return payload.getExpenseProofs;
  },
};

export default ExpenseProofService;