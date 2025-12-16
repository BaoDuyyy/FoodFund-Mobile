export const MY_DELIVERY_TASKS = `
query MyTasks($limit: Int, $offset: Int) { 
  myDeliveryTasks(limit: $limit, offset: $offset) { 
    id 
    mealBatch {
      id
      foodName
      quantity
      status
      cookedDate
    }
    status 
    created_at 
  } 
}
`;
