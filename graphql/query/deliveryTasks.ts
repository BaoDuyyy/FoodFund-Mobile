export const DELIVERY_TASKS = `
query Tasks($filter: DeliveryTaskFilterInput!) {
  deliveryTasks(filter: $filter) {
    id
    deliveryStaff {
      id
      full_name
    }
    mealBatch {
      id
      foodName
      quantity
      cookedDate
      status
    }
    mealBatchId
    status
    created_at
  }
}
`;
