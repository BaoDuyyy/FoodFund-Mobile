export const MY_OPERATION_REQUESTS = `
query MyRequests($limit: Int, $offset: Int) { 
  myOperationRequests(limit: $limit, offset: $offset) { 
    id 
    title 
    expenseType 
    status 
    totalCost 
    created_at 
  } 
}
`;
