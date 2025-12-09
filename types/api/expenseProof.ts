export type ExpenseProofUploadUrl = {
  uploadUrl: string;
  fileKey: string;
  cdnUrl: string;
  expiresAt: string;
  fileType: string;
};

export type GenerateExpenseProofUploadUrlsInput = {
  requestId: string;
  fileCount: number;
  fileTypes: string[]; // service can narrow this with union if cần
};

export type GenerateExpenseProofUploadUrlsResponse = {
  success: boolean;
  uploadUrls: ExpenseProofUploadUrl[];
};

export type CreateExpenseProofInput = {
  requestId: string;
  mediaFileKeys: string[];
  amount: string;
};

export type CreateExpenseProofResponse = {
  id: string;
  requestId: string;
  media: any;
  amount: string;
  status: string;
  created_at: string;
};

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

// File type constants
export const COMMON_EXPENSE_FILE_TYPES = ["jpg", "png", "mp4"] as const;
export type ExpenseProofFileType = (typeof COMMON_EXPENSE_FILE_TYPES)[number];

// GraphQL response wrapper types
export type GenerateExpenseProofUploadUrlsPayload = {
  generateExpenseProofUploadUrls: {
    success: boolean;
    uploadUrls: ExpenseProofUploadUrl[];
  };
};

export type CreateExpenseProofPayload = {
  createExpenseProof: ExpenseProof;
};

export type GetMyExpenseProofsPayload = {
  getMyExpenseProofs: ExpenseProof[];
};

export type GetExpenseProofsPayload = {
  getExpenseProofs: ExpenseProof[];
};

// Filter input for getExpenseProofs query
export type ExpenseProofFilterInput = {
  requestId?: string;
  status?: string;
  // Add more filter fields as needed
};

export type GetExpenseProofsVars = {
  filter?: ExpenseProofFilterInput;
  limit?: number;
  offset?: number;
};
