export const GET_MY_INGREDIENT_REQUESTS_QUERY = `
  query GetMyIngredientRequests($limit: Int, $offset: Int) {
    getMyIngredientRequests(limit: $limit, offset: $offset) {
      id
      campaignPhaseId
      totalCost
      status
      created_at
      items {
        id
        ingredientName
        quantity
        estimatedTotalPrice
      }
    }
  }
`;
