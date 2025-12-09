
export const GET_MEAL_BATCH = `
  query GetMealBatch($id: String!) {
    getMealBatch(id: $id) {
      id
      campaignPhaseId
      foodName
      quantity
      media
      status
      cookedDate
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
