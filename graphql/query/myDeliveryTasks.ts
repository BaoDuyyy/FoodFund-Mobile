export const MY_DELIVERY_TASKS = `
query MyTasks($limit: Int, $offset: Int) { 
  myDeliveryTasks(limit: $limit, offset: $offset) { 
    id 
    mealBatchId 
    status 
    created_at 
  } 
}
`;
