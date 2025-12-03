export type OperationRequestUser = {
  id: string;
  full_name: string;
};

export type OperationRequestCampaignPhase = {
  id: string;
  phaseName: string;
};

export type OperationRequest = {
  id: string;
  title: string;
  totalCost: number | string;
  expenseType: string;
  status: string;
  created_at: string;
  user?: OperationRequestUser | null;
  campaignPhase?: OperationRequestCampaignPhase | null;
};

// Input cho mutation CreateOperationRequest
export type CreateOperationRequestInput = {
  title: string;
  totalCost: number | string;
  expenseType: string;
  campaignPhaseId: string;
  // thêm các field khác nếu schema có (ví dụ: description, notes, ...)
};

// Kết quả của mutation CreateOperationRequest
export type CreateOperationRequestResponse = OperationRequest;
