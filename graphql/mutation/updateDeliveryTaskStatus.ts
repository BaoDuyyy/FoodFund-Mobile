export const UPDATE_DELIVERY_TASK_STATUS = `
  mutation UpdateStatus($input: UpdateDeliveryTaskStatusInput!) {
    updateDeliveryTaskStatus(input: $input) {
      id
      status
      updated_at
    }
  }
`;
