export const MY_OPERATION_REQUESTS = `
query MyRequests($limit: Int, $offset: Int, $sortBy: OperationRequestSortOrder) { 
  myOperationRequests(limit: $limit, offset: $offset, sortBy: $sortBy) { 
    id 
    title 
    expenseType 
    status 
    totalCost 
    created_at 
  } 
}
`;
