export const CREATE_OPERATION_REQUEST = `
mutation CreateOperationRequest($input: CreateOperationRequestInput!) {
  createOperationRequest(input: $input) {
    id
    title
    totalCost
    expenseType
    status
    created_at
    user {
      id
      full_name
    }
    campaignPhase {
      id
      phaseName
    }
  }
}
`;
