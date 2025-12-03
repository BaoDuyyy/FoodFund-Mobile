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
  foodName: string;
  quantity: number;
  media: string[] | null; // hoặc string, tùy backend
  status: MealBatchStatus;
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

export interface CreateMealBatchPayload extends MealBatch {}

export interface UpdateMealBatchStatusPayload {
  id: string;
  status: MealBatchStatus;
  cookedDate?: string | null;
  media: string[] | null;
}
