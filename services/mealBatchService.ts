import { getGraphqlUrl } from "@/config/api";
import { CREATE_MEAL_BATCH } from "@/graphql/mutation/createMealBatch";
import { GENERATE_MEAL_BATCH_MEDIA_UPLOAD_URLS } from "@/graphql/mutation/generateMealBatchMediaUploadUrls";
import { UPDATE_MEAL_BATCH_STATUS } from "@/graphql/mutation/updateMealBatchStatus";
import { GET_MEAL_BATCH } from "@/graphql/query/getMealBatch";
import { GET_MEAL_BATCHES } from "@/graphql/query/getMealBatches";
import type { GetMealBatchResponse, MealBatch, MealBatchStatus } from "@/types/api/mealBatch";
import AuthService from "./authService";

export const COMMON_MEAL_BATCH_FILE_TYPES = ["jpg", "png", "mp4"] as const;
export type MealBatchFileType = (typeof COMMON_MEAL_BATCH_FILE_TYPES)[number];

type GenerateMealBatchMediaUploadUrlsInputInternal = {
  campaignPhaseId: string;
  fileCount: number;
  fileTypes: MealBatchFileType[];
};

type MealBatchUploadUrl = {
  uploadUrl: string;
  fileKey: string;
  cdnUrl: string;
  expiresAt: string;
  fileType: string;
};

type GenerateMealBatchMediaUploadUrlsPayloadInternal = {
  generateMealBatchMediaUploadUrls: {
    success: boolean;
    uploadUrls: MealBatchUploadUrl[];
  };
};

type CreateMealBatchServiceInput = {
  campaignPhaseId: string;
  foodName: string;
  quantity: number;
  ingredientIds: string[];
  files: {
    uri: string;   // local uri từ image picker
    type: string;  // mime type, vd: "image/jpeg" | "video/mp4"
    name: string;  // file name
  }[];
};

type CreateMealBatchMutationInput = {
  campaignPhaseId: string;
  foodName: string;
  quantity: number;
  mediaFileKeys: string[];
  ingredientIds: string[];
};

type CreateMealBatchPayload = {
  createMealBatch: MealBatch;
};

type GetMealBatchesFilter = {
  campaignId?: string | null;
  status?: string | null;
};

type GetMealBatchesPayload = {
  getMealBatches: MealBatch[];
};

type UpdateMealBatchStatusInputInternal = {
  status: MealBatchStatus;
};

type UpdateMealBatchStatusPayload = {
  updateMealBatchStatus: MealBatch;
};

const MealBatchService = {
  async generateMealBatchUploadUrls(
    input: GenerateMealBatchMediaUploadUrlsInputInternal,
    overrideUrl?: string
  ): Promise<MealBatchUploadUrl[]> {
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();

    const variables = {
      input: {
        campaignPhaseId: input.campaignPhaseId,
        fileCount: input.fileCount,
        fileTypes: input.fileTypes,
      },
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
          query: GENERATE_MEAL_BATCH_MEDIA_UPLOAD_URLS,
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

    const payload: GenerateMealBatchMediaUploadUrlsPayloadInternal | undefined =
      json.data;
    if (!payload || !payload.generateMealBatchMediaUploadUrls) {
      throw new Error("Empty generateMealBatchMediaUploadUrls response");
    }
    if (!payload.generateMealBatchMediaUploadUrls.success) {
      throw new Error("Failed to generate meal batch upload URLs");
    }

    return payload.generateMealBatchMediaUploadUrls.uploadUrls;
  },

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

  async createMealBatchWithMedia(
    params: CreateMealBatchServiceInput,
    overrideUrl?: string
  ): Promise<MealBatch> {
    // 1. generate upload urls
    const uploadUrls = await this.generateMealBatchUploadUrls(
      {
        campaignPhaseId: params.campaignPhaseId,
        fileCount: params.files.length,
        fileTypes: params.files.map((f) =>
          f.type?.includes("mp4")
            ? ("mp4" as MealBatchFileType)
            : ("jpg" as MealBatchFileType)
        ),
      },
      overrideUrl
    );

    // 2. upload files
    const mediaFileKeys = await this.uploadFilesToPresignedUrls(
      params.files,
      uploadUrls
    );

    // 3. call CreateMealBatch
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();

    const input: CreateMealBatchMutationInput = {
      campaignPhaseId: params.campaignPhaseId,
      foodName: params.foodName,
      quantity: params.quantity,
      mediaFileKeys,
      ingredientIds: params.ingredientIds,
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
          query: CREATE_MEAL_BATCH,
          variables: { input },
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

    const payload: CreateMealBatchPayload | undefined = json.data;
    if (!payload || !payload.createMealBatch) {
      throw new Error("Empty createMealBatch response");
    }

    return payload.createMealBatch;
  },

  /**
   * Lấy chi tiết 1 meal batch theo id.
   */
  async getMealBatchById(id: string, overrideUrl?: string): Promise<MealBatch> {
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
          query: GET_MEAL_BATCH,
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

    const payload: GetMealBatchResponse | undefined = json.data;
    if (!payload || !payload.getMealBatch) {
      throw new Error("Empty or invalid getMealBatch response");
    }

    return payload.getMealBatch;
  },

  /**
   * Lấy danh sách meal batches theo campaignId, status = null (không filter status).
   * filter gửi lên:
   * {
   *   campaignId: campaignId,
   *   status: null
   * }
   */
  async getMealBatchesByCampaign(
    campaignId: string,
    overrideUrl?: string
  ): Promise<MealBatch[]> {
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();

    const filter: GetMealBatchesFilter = {
      campaignId,
      status: null,
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
          query: GET_MEAL_BATCHES,
          variables: { filter },
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

    const payload: GetMealBatchesPayload | undefined = json.data;
    if (!payload || !Array.isArray(payload.getMealBatches)) {
      throw new Error("Empty or invalid getMealBatches response");
    }

    return payload.getMealBatches;
  },

  /**
   * Update trạng thái của một meal batch.
   * Mặc định cập nhật sang READY, có thể override status nếu cần.
   */
  async updateMealBatchStatusToReady(
    id: string,
    options?: {
      overrideStatus?: MealBatchStatus; // optional nếu sau này muốn dùng COOKING / PENDING
    },
    overrideUrl?: string
  ): Promise<MealBatch> {
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();

    const input: UpdateMealBatchStatusInputInternal = {
      status: options?.overrideStatus ?? "READY",
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
          query: UPDATE_MEAL_BATCH_STATUS,
          variables: { id, input },
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

    const payload: UpdateMealBatchStatusPayload | undefined = json.data;
    if (!payload || !payload.updateMealBatchStatus) {
      throw new Error("Empty or invalid updateMealBatchStatus response");
    }

    return payload.updateMealBatchStatus;
  },
};

export default MealBatchService;
