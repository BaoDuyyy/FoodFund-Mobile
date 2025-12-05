export interface IngredientRequestItemInput {
  ingredientName: string;
  quantity: string;
  estimatedUnitPrice: number;
  estimatedTotalPrice: number;
  supplier: string;
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
  estimatedUnitPrice: number;
  estimatedTotalPrice: number;
  supplier: string;
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

// ❯❯ loại “simple types” cho getMyIngredientRequests ra đây thay vì để trong service
export interface MyIngredientRequestItem {
  id: string;
  ingredientName: string;
  quantity: string;
  estimatedTotalPrice: number;
}

export interface MyIngredientRequest {
  id: string;
  campaignPhaseId: string;
  totalCost: string;
  status: string;
  created_at: string;
  items: MyIngredientRequestItem[];
}
