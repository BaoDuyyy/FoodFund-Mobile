export const CREATE_EXPENSE_PROOF = `
mutation CreateExpenseProof($input: CreateExpenseProofInput!) { 
    createExpenseProof(input: $input) { 
        id 
        requestId 
        media 
        amount 
        status 
        created_at 
    } 
}
`;
