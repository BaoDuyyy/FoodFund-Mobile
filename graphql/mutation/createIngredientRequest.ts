export const CREATE_INGREDIENT_REQUEST_MUTATION = /* GraphQL */ `
  mutation CreateIngredientRequest($input: CreateIngredientRequestInput!) {
    createIngredientRequest(input: $input) {
      id
      campaignPhaseId
      kitchenStaffId
      totalCost
      status
      created_at
      items {
        id
        ingredientName
        quantity
        estimatedUnitPrice
        estimatedTotalPrice
        supplier
      }
    }
  }
`;
