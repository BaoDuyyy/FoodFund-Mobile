// Các type dùng cho MealBatch và mutation liên quan

export type MealBatchStatus = "PENDING" | "COOKING" | "READY"; // chỉnh lại enum theo backend nếu khác

export interface MealBatchKitchenStaff {
  id: string;
  full_name: string;
}

export interface MealBatchIngredientItem {
  ingredientName: string;
  quantity: number;
}

export interface MealBatchIngredientUsage {
  ingredientItem: MealBatchIngredientItem;
}

export interface MealBatch {
  id: string;
  campaignPhaseId?: string; // thêm để khớp với query getMealBatch
  foodName: string;
  quantity: number;
  media: string[] | null; // hoặc string, tùy backend
  status: MealBatchStatus;
  plannedMealId?: string | null;
  kitchenStaff?: MealBatchKitchenStaff | null;
  ingredientUsages?: MealBatchIngredientUsage[] | null;
  cookedDate?: string | null;
}

// ----- Input types cho các mutation -----

export interface CreateMealBatchInput {
  foodName: string;
  quantity: number;
  media?: string[]; // các fileKey đã upload xong
  // bổ sung field khác nếu backend yêu cầu, ví dụ: campaignId, kitchenStaffId, ...
  // campaignId?: string;
}

export interface UpdateMealBatchStatusInput {
  status: MealBatchStatus;
  cookedDate?: string; // ISO string nếu backend trả như vậy
  media?: string[]; // nếu khi update status có thể bổ sung media
}

export type MediaFileType = "IMAGE" | "VIDEO"; // chỉnh lại nếu backend định nghĩa khác

export interface GenerateMealBatchMediaUploadUrlsFileInput {
  fileType: MediaFileType;
  fileName: string;
}

export interface GenerateMealBatchMediaUploadUrlsInput {
  mealBatchId?: string; // có thể null khi tạo mới, tuỳ backend
  files: GenerateMealBatchMediaUploadUrlsFileInput[];
}

// ----- Response types tương ứng với mutation -----

export interface GenerateMealBatchMediaUploadUrlItem {
  uploadUrl: string;
  fileKey: string;
  cdnUrl: string;
  expiresAt: string;
  fileType: MediaFileType;
}

export interface GenerateMealBatchMediaUploadUrlsPayload {
  success: boolean;
  uploadUrls: GenerateMealBatchMediaUploadUrlItem[];
}

export interface CreateMealBatchPayload extends MealBatch { }

export interface UpdateMealBatchStatusPayload {
  id: string;
  status: MealBatchStatus;
  cookedDate?: string | null;
  media: string[] | null;
}

// ----- Query payloads -----

export interface GetMealBatchResponse {
  getMealBatch: MealBatch;
}

// File type constants
export const COMMON_MEAL_BATCH_FILE_TYPES = ["jpg", "png", "mp4"] as const;
export type MealBatchFileType = (typeof COMMON_MEAL_BATCH_FILE_TYPES)[number];

// Upload URL types
export interface MealBatchUploadUrl {
  uploadUrl: string;
  fileKey: string;
  cdnUrl: string;
  expiresAt: string;
  fileType: string;
}

// Input for generating upload URLs
export interface GenerateMealBatchUploadUrlsInput {
  campaignPhaseId: string;
  fileCount: number;
  fileTypes: MealBatchFileType[];
}

// File input for createMealBatchWithMedia
export interface MealBatchFileInput {
  uri: string;   // local uri from image picker
  type: string;  // mime type, e.g. "image/jpeg" | "video/mp4"
  name: string;  // file name
}

// Input for createMealBatchWithMedia service method
export interface CreateMealBatchServiceInput {
  campaignPhaseId: string;
  foodName: string;
  quantity: number;
  ingredientIds: string[];
  plannedMealId?: string | null;
  files: MealBatchFileInput[];
}

// Input for createMealBatch mutation
export interface CreateMealBatchMutationInput {
  campaignPhaseId: string;
  foodName: string;
  quantity: number;
  mediaFileKeys: string[];
  ingredientIds: string[];
  plannedMealId?: string | null;
}

// Filter for getMealBatches query
export interface GetMealBatchesFilter {
  campaignId?: string | null;
  status?: string | null;
}

// Options for updateMealBatchStatus
export interface UpdateMealBatchStatusOptions {
  overrideStatus?: MealBatchStatus;
}

// GraphQL response wrapper types
export interface GenerateMealBatchMediaUploadUrlsResponse {
  generateMealBatchMediaUploadUrls: {
    success: boolean;
    uploadUrls: MealBatchUploadUrl[];
  };
}

export interface CreateMealBatchResponse {
  createMealBatch: MealBatch;
}

export interface GetMealBatchesResponse {
  getMealBatches: MealBatch[];
}

export interface UpdateMealBatchStatusResponse {
  updateMealBatchStatus: MealBatch;
}

// Internal input type for update mutation
export interface UpdateMealBatchStatusMutationInput {
  status: MealBatchStatus;
}
