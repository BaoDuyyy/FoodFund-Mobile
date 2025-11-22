export const GET_CAMPAIGN_QUERY = `
query GetCampaign($id: String!) {
  campaign(id: $id) {
    id
    title
    description
    coverImage
    status
    fundraisingStartDate
    fundraisingEndDate
    fundingProgress
    daysActive
    daysRemaining
    totalPhases
    targetAmount
    donationCount
    receivedAmount
    created_at
    category {
      title
      description
    }
    creator {
      id
      full_name
    }
    phases {
      id
      phaseName
      location
      ingredientPurchaseDate
      cookingDate
      deliveryDate
      ingredientBudgetPercentage
      cookingBudgetPercentage
      deliveryBudgetPercentage
      ingredientFundsAmount
      cookingFundsAmount
      deliveryFundsAmount
      status
    }
  }
}
`;
