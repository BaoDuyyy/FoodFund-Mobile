export const GET_EXPENSE_PROOFS = `
query GetExpenseProofs($filter: ExpenseProofFilterInput, $limit: Int, $offset: Int) { 
  getExpenseProofs(filter: $filter, limit: $limit, offset: $offset) { 
    id 
    requestId 
    media 
    amount 
    status 
    adminNote 
    created_at 
  } 
}
`;
