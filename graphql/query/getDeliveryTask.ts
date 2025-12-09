export const GET_DELIVERY_TASK = `
  query GetTask($id: String!) {
    deliveryTask(id: $id) {
      id
      status
      created_at
      updated_at
      deliveryStaff {
        id
        full_name
      }
      mealBatch {
        id
        foodName
        quantity
      }
      statusLogs {
        id
        status
        note
        changedBy
        createdAt
      }
    }
  }
`;
