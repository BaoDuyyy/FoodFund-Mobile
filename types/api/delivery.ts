export type DeliveryTask = {
  id: string;
  mealBatchId: string;
  status: string;
  created_at: string;
};

export type MyDeliveryTasksResponse = {
  myDeliveryTasks: DeliveryTask[];
};

// Detailed types for GetTask query
export type DeliveryTaskStaff = {
  id: string;
  full_name: string;
};

export type DeliveryTaskMealBatch = {
  id: string;
  foodName: string;
  quantity: number;
};

export type DeliveryTaskStatusLog = {
  id: string;
  status: string;
  note: string | null;
  changedBy: string;
  createdAt: string;
};

export type DeliveryTaskDetail = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  deliveryStaff?: DeliveryTaskStaff | null;
  mealBatch?: DeliveryTaskMealBatch | null;
  statusLogs?: DeliveryTaskStatusLog[] | null;
};

export type GetDeliveryTaskResponse = {
  deliveryTask: DeliveryTaskDetail;
};
