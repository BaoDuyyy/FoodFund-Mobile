export const GET_INGREDIENT_REQUESTS = `
  query GetIngredientRequests($filter: IngredientRequestFilterInput, $limit: Int, $offset: Int) {
    getIngredientRequests(filter: $filter, limit: $limit, offset: $offset) {
      id
      kitchenStaff {
        id
        full_name
      }
      campaignPhase {
        id
        phaseName
        cookingDate
        status
      }
      totalCost
      status
      created_at
    }
  }
`;
