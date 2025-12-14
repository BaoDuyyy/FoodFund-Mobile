export const CREATE_MEAL_BATCH = `
  mutation CreateMealBatch($input: CreateMealBatchInput!) {
    createMealBatch(input: $input) {
      id
      foodName
      quantity
      media
      status
      plannedMealId
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
