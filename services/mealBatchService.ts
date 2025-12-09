import { getGraphqlUrl } from "@/config/api";
import { CREATE_MEAL_BATCH } from "@/graphql/mutation/createMealBatch";
import { GENERATE_MEAL_BATCH_MEDIA_UPLOAD_URLS } from "@/graphql/mutation/generateMealBatchMediaUploadUrls";
import { UPDATE_MEAL_BATCH_STATUS } from "@/graphql/mutation/updateMealBatchStatus";
import { GET_MEAL_BATCH } from "@/graphql/query/getMealBatch";
import { GET_MEAL_BATCHES } from "@/graphql/query/getMealBatches";
import type {
  CreateMealBatchMutationInput,
  CreateMealBatchResponse,
  CreateMealBatchServiceInput,
  GenerateMealBatchMediaUploadUrlsResponse,
  GenerateMealBatchUploadUrlsInput,
  GetMealBatchesFilter,
  GetMealBatchesResponse,
  GetMealBatchResponse,
  MealBatch,
  MealBatchFileType,
  MealBatchUploadUrl,
  UpdateMealBatchStatusMutationInput,
  UpdateMealBatchStatusOptions,
  UpdateMealBatchStatusResponse
} from "@/types/api/mealBatch";
import type { GraphQLResponse } from "@/types/graphql";
import AuthService from "./authService";
export { COMMON_MEAL_BATCH_FILE_TYPES } from "@/types/api/mealBatch";
export type { MealBatchFileType, MealBatchUploadUrl } from "@/types/api/mealBatch";

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
 * Generic GraphQL request handler for MealBatchService
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
// MEAL BATCH SERVICE
// =============================================================================

const MealBatchService = {
  /**
   * Generate signed upload URLs for meal batch media files
   */
  async generateMealBatchUploadUrls(
    input: GenerateMealBatchUploadUrlsInput,
    overrideUrl?: string
  ): Promise<MealBatchUploadUrl[]> {
    const response = await graphqlRequest<GenerateMealBatchMediaUploadUrlsResponse>(
      GENERATE_MEAL_BATCH_MEDIA_UPLOAD_URLS,
      { input },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.generateMealBatchMediaUploadUrls;
    if (!payload) {
      throw new Error("Empty generateMealBatchMediaUploadUrls response");
    }

    if (!payload.success) {
      throw new Error("Failed to generate meal batch upload URLs");
    }

    return payload.uploadUrls;
  },

  /**
   * Upload files to presigned S3 URLs
   */
  async uploadFilesToPresignedUrls(
    files: CreateMealBatchServiceInput["files"],
    uploadUrls: MealBatchUploadUrl[]
  ): Promise<string[]> {
    if (files.length !== uploadUrls.length) {
      throw new Error("Number of files does not match number of uploadUrls");
    }

    const mediaFileKeys: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { uploadUrl, fileKey } = uploadUrls[i];

      const fileRes = await fetch(file.uri);
      const blob = await fileRes.blob();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "x-amz-acl": "public-read",
        },
        body: blob,
      });

      if (!putRes.ok) {
        const text = await putRes.text().catch(() => "");
        throw new Error(
          `Failed to upload file ${file.name} (${putRes.status}): ${text}`
        );
      }

      mediaFileKeys.push(fileKey);
    }

    return mediaFileKeys;
  },

  /**
   * Create a meal batch with media upload
   * 1. Generate upload URLs
   * 2. Upload files
   * 3. Create meal batch with file keys
   */
  async createMealBatchWithMedia(
    params: CreateMealBatchServiceInput,
    overrideUrl?: string
  ): Promise<MealBatch> {
    // 1. Generate upload URLs
    const fileTypes: MealBatchFileType[] = params.files.map((f) => {
      if (f.type?.includes("mp4")) return "mp4";
      if (f.type?.includes("png")) return "png";
      return "jpg";
    });

    const uploadUrls = await this.generateMealBatchUploadUrls(
      {
        campaignPhaseId: params.campaignPhaseId,
        fileCount: params.files.length,
        fileTypes,
      },
      overrideUrl
    );

    // 2. Upload files
    const mediaFileKeys = await this.uploadFilesToPresignedUrls(
      params.files,
      uploadUrls
    );

    // 3. Create meal batch
    const input: CreateMealBatchMutationInput = {
      campaignPhaseId: params.campaignPhaseId,
      foodName: params.foodName,
      quantity: params.quantity,
      mediaFileKeys,
      ingredientIds: params.ingredientIds,
    };

    const response = await graphqlRequest<CreateMealBatchResponse>(
      CREATE_MEAL_BATCH,
      { input },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.createMealBatch;
    if (!payload) {
      throw new Error("Empty createMealBatch response");
    }

    return payload;
  },

  /**
   * Get a single meal batch by ID
   */
  async getMealBatchById(id: string, overrideUrl?: string): Promise<MealBatch> {
    const response = await graphqlRequest<GetMealBatchResponse>(
      GET_MEAL_BATCH,
      { id },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.getMealBatch;
    if (!payload) {
      throw new Error("Empty or invalid getMealBatch response");
    }

    return payload;
  },

  /**
   * Get meal batches by campaign ID (no status filter)
   */
  async getMealBatchesByCampaign(
    campaignId: string,
    overrideUrl?: string
  ): Promise<MealBatch[]> {
    const filter: GetMealBatchesFilter = {
      campaignId,
      status: null,
    };

    const response = await graphqlRequest<GetMealBatchesResponse>(
      GET_MEAL_BATCHES,
      { filter },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.getMealBatches;
    if (!Array.isArray(payload)) {
      throw new Error("Empty or invalid getMealBatches response");
    }

    return payload;
  },

  /**
   * Update meal batch status (defaults to READY)
   */
  async updateMealBatchStatusToReady(
    id: string,
    options?: UpdateMealBatchStatusOptions,
    overrideUrl?: string
  ): Promise<MealBatch> {
    const input: UpdateMealBatchStatusMutationInput = {
      status: options?.overrideStatus ?? "READY",
    };

    const response = await graphqlRequest<UpdateMealBatchStatusResponse>(
      UPDATE_MEAL_BATCH_STATUS,
      { id, input },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.updateMealBatchStatus;
    if (!payload) {
      throw new Error("Empty or invalid updateMealBatchStatus response");
    }

    return payload;
  },
};

export default MealBatchService;
