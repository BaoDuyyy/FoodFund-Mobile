export const GET_MY_EXPENSE_PROOFS = `
query GetMyExpenseProofs($requestId: String) { 
    getMyExpenseProofs(requestId: $requestId) { 
        id 
        requestId 
        media 
        amount 
        status 
        adminNote 
        created_at 
        updated_at 
    } 
}
`;
