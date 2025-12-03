export type DeliveryTask = {
  id: string;
  mealBatchId: string;
  status: string;
  created_at: string;
};

export type MyDeliveryTasksResponse = {
  myDeliveryTasks: DeliveryTask[];
};
