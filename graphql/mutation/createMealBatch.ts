export const CREATE_MEAL_BATCH = `
  mutation CreateMealBatch($input: CreateMealBatchInput!) {
    createMealBatch(input: $input) {
      id
      foodName
      quantity
      media
      status
      kitchenStaff {
        id
        full_name
      }
      ingredientUsages {
        ingredientItem {
          ingredientName
          quantity
        }
      }
    }
  }
`;
