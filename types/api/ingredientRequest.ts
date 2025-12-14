export interface IngredientRequestItemInput {
  ingredientName: string;
  quantity: string;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotalPrice: number;
  supplier: string;
  plannedIngredientId: string | null;
}

export interface CreateIngredientRequestInput {
  campaignPhaseId: string;
  totalCost: string;
  items: IngredientRequestItemInput[];
}

export interface IngredientRequestItem {
  id: string;
  ingredientName: string;
  quantity: string;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotalPrice: number;
  supplier: string;
  plannedIngredientId: string | null;
}

export interface CreateIngredientRequestPayload {
  id: string;
  campaignPhaseId: string;
  kitchenStaffId: string;
  totalCost: string;
  status: string;
  created_at: string;
  items: IngredientRequestItem[];
}

// ❯❯ loại "simple types" cho getMyIngredientRequests ra đây thay vì để trong service
export interface MyIngredientRequestItem {
  id: string;
  ingredientName: string;
  quantity: string;
  unit?: string;
  estimatedTotalPrice: number;
  plannedIngredientId?: string | null;
}

export interface MyIngredientRequest {
  id: string;
  campaignPhaseId: string;
  totalCost: string;
  status: string;
  created_at: string;
  items: MyIngredientRequestItem[];
}

// Pagination options for getMyIngredientRequests
export interface GetMyIngredientRequestsOptions {
  limit?: number;
  offset?: number;
}

// Filter input for getIngredientRequests
export interface IngredientRequestFilterInput {
  campaignPhaseId?: string;
  status?: string;
  sortBy?: string;
}

// Variables for getIngredientRequests query
export interface GetIngredientRequestsVars {
  filter?: IngredientRequestFilterInput;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Types for getIngredientRequests query response
// ============================================================================

/** Item type for getIngredientRequests query */
export interface IngredientRequestListItem {
  id: string;
  ingredientName: string;
  quantity: string;
  unit: string;
  estimatedTotalPrice: number;
  supplier?: string;
}

/** Kitchen staff info in ingredient request */
export interface IngredientRequestKitchenStaff {
  id: string;
  full_name: string;
}

/** Campaign phase info in ingredient request */
export interface IngredientRequestCampaignPhase {
  id: string;
  phaseName: string;
  cookingDate: string;
  status: string;
}

/** Full ingredient request type for list query */
export interface IngredientRequestListResponse {
  id: string;
  kitchenStaff: IngredientRequestKitchenStaff;
  campaignPhase: IngredientRequestCampaignPhase;
  totalCost: string;
  status: string;
  created_at: string;
  items: IngredientRequestListItem[];
}

// ============================================================================
// GraphQL response wrapper types
// ============================================================================

export interface CreateIngredientRequestResponse {
  createIngredientRequest: CreateIngredientRequestPayload;
}

export interface GetMyIngredientRequestsResponse {
  getMyIngredientRequests: MyIngredientRequest[];
}

export interface GetIngredientRequestsResponse {
  getIngredientRequests: IngredientRequestListResponse[];
}

