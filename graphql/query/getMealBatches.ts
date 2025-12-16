export const GET_MEAL_BATCHES = `
  query GetMealBatches($filter: MealBatchFilterInput) {
    getMealBatches(filter: $filter) {
      id
      campaignPhaseId
      plannedMealId
      foodName
      quantity
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
