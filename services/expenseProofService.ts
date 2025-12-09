import { getGraphqlUrl } from "@/config/api";
import { CREATE_EXPENSE_PROOF } from "@/graphql/mutation/createExpenseProof";
import { GENERATE_EXPENSE_PROOF_UPLOAD_URLS } from "@/graphql/mutation/generateExpenseProofUploadUrls";
import { GET_EXPENSE_PROOFS } from "@/graphql/query/getExpenseProofs";
import { GET_MY_EXPENSE_PROOFS } from "@/graphql/query/getMyExpenseProofs";
import type {
  CreateExpenseProofInput,
  CreateExpenseProofPayload,
  ExpenseProof,
  ExpenseProofFileType,
  ExpenseProofUploadUrl,
  GenerateExpenseProofUploadUrlsInput,
  GenerateExpenseProofUploadUrlsPayload,
  GetExpenseProofsPayload,
  GetExpenseProofsVars,
  GetMyExpenseProofsPayload,
} from "@/types/api/expenseProof";
import type { GraphQLResponse } from "@/types/graphql";
import AuthService from "./authService";
export { COMMON_EXPENSE_FILE_TYPES } from "@/types/api/expenseProof";
export type { ExpenseProof, ExpenseProofFileType, ExpenseProofUploadUrl } from "@/types/api/expenseProof";

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
 * Generic GraphQL request handler for ExpenseProofService
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
// EXPENSE PROOF SERVICE
// =============================================================================

// Input type using the file type union for better type safety
type GenerateUploadUrlsInput = {
  requestId: string;
  fileCount: number;
  fileTypes: ExpenseProofFileType[];
};

const ExpenseProofService = {
  /**
   * Upload a file to a signed S3 URL
   */
  async uploadFileToSignedUrl(uploadUrl: string, file: Blob | ArrayBuffer): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "x-amz-acl": "public-read",
      },
      body: file,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Upload failed ${res.status}: ${text}`);
    }
  },

  /**
   * Step 1: Generate signed upload URLs for expense proof files
   */
  async generateExpenseProofUploadUrls(
    input: GenerateUploadUrlsInput,
    overrideUrl?: string
  ): Promise<ExpenseProofUploadUrl[]> {
    // Convert to the GraphQL input type
    const graphqlInput: GenerateExpenseProofUploadUrlsInput = {
      requestId: input.requestId,
      fileCount: input.fileCount,
      fileTypes: input.fileTypes,
    };

    const response = await graphqlRequest<GenerateExpenseProofUploadUrlsPayload>(
      GENERATE_EXPENSE_PROOF_UPLOAD_URLS,
      { input: graphqlInput },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.generateExpenseProofUploadUrls;
    if (!payload) {
      throw new Error("Empty or invalid generateExpenseProofUploadUrls response");
    }

    if (!payload.success) {
      throw new Error("Failed to generate expense proof upload URLs");
    }

    return payload.uploadUrls;
  },

  /**
   * Step 2: Create expense proof after uploading files
   */
  async createExpenseProof(
    input: CreateExpenseProofInput,
    overrideUrl?: string
  ): Promise<ExpenseProof> {
    const response = await graphqlRequest<CreateExpenseProofPayload>(
      CREATE_EXPENSE_PROOF,
      { input },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const expenseProof = response.data?.createExpenseProof;
    if (!expenseProof) {
      throw new Error("Empty or invalid createExpenseProof response");
    }

    return expenseProof;
  },

  /**
   * Get expense proofs for the current user, optionally filtered by requestId
   */
  async getMyExpenseProofs(
    requestId?: string,
    overrideUrl?: string
  ): Promise<ExpenseProof[]> {
    const response = await graphqlRequest<GetMyExpenseProofsPayload>(
      GET_MY_EXPENSE_PROOFS,
      { requestId },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.getMyExpenseProofs;
    if (!Array.isArray(payload)) {
      throw new Error("Empty or invalid getMyExpenseProofs response");
    }

    return payload;
  },

  /**
   * Admin: Get all expense proofs with filtering and pagination
   */
  async getExpenseProofs(
    vars: GetExpenseProofsVars = {},
    overrideUrl?: string
  ): Promise<ExpenseProof[]> {
    const response = await graphqlRequest<GetExpenseProofsPayload>(
      GET_EXPENSE_PROOFS,
      vars,
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.getExpenseProofs;
    if (!Array.isArray(payload)) {
      throw new Error("Empty or invalid getExpenseProofs response");
    }

    return payload;
  },
};

export default ExpenseProofService;