export type ListCampaignsVars = {
  filter?: any;
  search?: string | null;
  sortBy?: any;
  limit?: number | null;
  offset?: number | null;
};

export type SearchCampaignInput = {
  creatorId?: string | null;
  categoryId?: string | null;
  status?: string | null;
  search?: string | null;
  sortBy?: string | null;
  limit?: number;
  page?: number;
};

export type CampaignItem = {
  id: string;
  title?: string | null;
  coverImage?: string | null;
  status?: string | null;
  targetAmount?: number | string | null;
  donationCount?: number | null;
  receivedAmount?: number | string | null;
  fundraisingStartDate?: string | null;
  fundraisingEndDate?: string | null;
  fundingProgress?: number | null;
  daysRemaining?: number | null;
  creator?: {
    id: string;
    full_name?: string | null;
  } | null;
  category?: {
    id: string;
    title?: string | null;
  } | null;
  organization?: {
    id: string;
    name?: string | null;
  } | null;
};

export type ListCampaignsResponse = {
  campaigns: CampaignItem[];
};

// Detailed campaign types
export type PlannedIngredient = {
  id: string;
  name?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
};

export type PlannedMeal = {
  id: string;
  name?: string | null;
  quantity?: number | string | null;
};

export type Phase = {
  id: string;
  phaseName?: string | null;
  location?: string | null;
  ingredientPurchaseDate?: string | null;
  cookingDate?: string | null;
  deliveryDate?: string | null;
  ingredientBudgetPercentage?: number | string | null;
  cookingBudgetPercentage?: number | string | null;
  deliveryBudgetPercentage?: number | string | null;
  ingredientFundsAmount?: number | string | null;
  cookingFundsAmount?: number | string | null;
  deliveryFundsAmount?: number | string | null;
  status?: string | null;
  plannedIngredients?: PlannedIngredient[] | null;
  plannedMeals?: PlannedMeal[] | null;
};

export type CampaignDetail = {
  id: string;
  title?: string | null;
  description?: string | null;
  coverImage?: string | null;
  status?: string | null;
  fundraisingStartDate?: string | null;
  fundraisingEndDate?: string | null;
  fundingProgress?: number | null;
  daysActive?: number | null;
  daysRemaining?: number | null;
  totalPhases?: number | null;
  targetAmount?: number | string | null;
  donationCount?: number | null;
  receivedAmount?: number | string | null;
  created_at?: string | null;
  category?: {
    title?: string | null;
    description?: string | null;
  } | null;
  creator?: {
    id: string;
    full_name?: string | null;
  } | null;
  organization?: {
    id: string;
    name?: string | null;
  } | null;
  phases?: Phase[] | null;
};

export type CampaignDonationStatementTransaction = {
  donationId: string;
  transactionDateTime: string | null;
  donorName: string | null;
  amount: string;
  receivedAmount: string;
  transactionStatus: string;
  paymentStatus: string;
  gateway: string | null;
  orderCode: string;
  bankAccountNumber: string | null;
  bankName: string | null;
  description: string | null;
};

export type CampaignDonationStatement = {
  campaignId: string;
  campaignTitle: string;
  totalReceived: string;
  totalDonations: number;
  generatedAt: string;
  transactions: CampaignDonationStatementTransaction[];
};
