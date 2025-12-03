export const UPDATE_MEAL_BATCH_STATUS = `
  mutation UpdateMealBatchStatus(
    $id: String!
    $input: UpdateMealBatchStatusInput!
  ) {
    updateMealBatchStatus(id: $id, input: $input) {
      id
      status
      cookedDate
      media
    }
  }
`;
