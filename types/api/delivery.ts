// Filter input for deliveryTasks query
export type DeliveryTaskFilterInput = {
  campaignId?: string | null;
  campaignPhaseId?: string | null;
  mealBatchId?: string | null;
  deliveryStaffId?: string | null;
  status?: string | null;
  limit?: number;
  offset?: number;
};

// Delivery staff info in task
export type DeliveryTaskStaffInfo = {
  id: string;
  full_name?: string | null;
};

export type DeliveryTaskMealBatchSummary = {
  id: string;
  foodName: string;
  quantity: number;
  status: string;
  cookedDate: string;
};

export type DeliveryTask = {
  id: string;
  mealBatch: DeliveryTaskMealBatchSummary;
  status: string;
  created_at: string;
};

// DeliveryTask with staff info (from deliveryTasks query)
export type DeliveryTaskWithStaff = {
  id: string;
  deliveryStaff?: DeliveryTaskStaffInfo | null;
  mealBatch?: DeliveryTaskMealBatchSummary | null;
  mealBatchId?: string | null;
  status: string;
  created_at: string;
};

export type DeliveryTasksResponse = {
  deliveryTasks: DeliveryTaskWithStaff[];
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

// Input types for mutations
export type UpdateDeliveryTaskStatusInput = {
  taskId: string;
  status: string;
  note?: string | null;
};

// Response types for mutations
export type UpdateDeliveryTaskStatusPayload = {
  updateDeliveryTaskStatus: {
    id: string;
    status: string;
    updated_at: string;
  };
};
