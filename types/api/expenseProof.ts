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
  instructions: string;
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
