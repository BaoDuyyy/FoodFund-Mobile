export const phaseStatusLabels: Record<string, string> = {
  PLANNING: "Đang chờ yêu cầu nguyên liệu",
  AWAITING_INGREDIENT_DISBURSEMENT: "Chờ giải ngân tiền nguyên liệu",
  INGREDIENT_PURCHASE: "Đang mua nguyên liệu",
  AWAITING_AUDIT: "Chờ kiểm tra chứng từ",
  AWAITING_COOKING_DISBURSEMENT: "Chờ giải ngân chi phí nấu ăn",
  COOKING: "Đang nấu ăn",
  AWAITING_DELIVERY_DISBURSEMENT: "Chờ giải ngân chi phí vận chuyển",
  DELIVERY: "Đang vận chuyển",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  FAILED: "Thất bại",
  NULL: "Chưa xác định",
  DEFAULT: "Không xác định",
};

export function getPhaseStatusLabel(status?: string | null): string {
  if (!status) return "Không xác định";
  const key = status.toUpperCase().trim();
  return phaseStatusLabels[key] || "Không xác định";
}
