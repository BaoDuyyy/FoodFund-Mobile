/**
 * Delivery Task Status Constants
 * 
 * Centralized status definitions for delivery tasks with Vietnamese translations.
 * Import from here for consistent status handling across all delivery-related pages.
 * 
 * Usage:
 * import { DELIVERY_STATUS, getDeliveryStatusLabel, getDeliveryStatusColors } from '@/constants/deliveryStatus';
 */

// ============================================================================
// DELIVERY STATUS ENUM VALUES
// ============================================================================

export const DELIVERY_STATUS = {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    REJECTED: "REJECTED",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
} as const;

export type DeliveryStatusType = typeof DELIVERY_STATUS[keyof typeof DELIVERY_STATUS];

// ============================================================================
// VIETNAMESE LABELS
// ============================================================================

/** Map of status to Vietnamese label */
export const DELIVERY_STATUS_LABELS: Record<string, string> = {
    [DELIVERY_STATUS.PENDING]: "Chờ nhận",
    [DELIVERY_STATUS.ACCEPTED]: "Đã nhận",
    [DELIVERY_STATUS.REJECTED]: "Đã từ chối",
    [DELIVERY_STATUS.OUT_FOR_DELIVERY]: "Đang giao",
    [DELIVERY_STATUS.COMPLETED]: "Hoàn thành",
    [DELIVERY_STATUS.FAILED]: "Thất bại",
};

// ============================================================================
// STATUS COLORS
// ============================================================================

export interface StatusColors {
    bg: string;
    text: string;
}

/** Map of status to color scheme (background + text) */
export const DELIVERY_STATUS_COLORS: Record<string, StatusColors> = {
    [DELIVERY_STATUS.PENDING]: { bg: "#f3e8ff", text: "#6d28d9" },    // Purple
    [DELIVERY_STATUS.ACCEPTED]: { bg: "#fef9c3", text: "#b45309" },   // Yellow/Amber
    [DELIVERY_STATUS.REJECTED]: { bg: "#fee2e2", text: "#b91c1c" },   // Red
    [DELIVERY_STATUS.OUT_FOR_DELIVERY]: { bg: "#e0f2fe", text: "#0369a1" }, // Blue
    [DELIVERY_STATUS.COMPLETED]: { bg: "#dcfce7", text: "#15803d" },  // Green
    [DELIVERY_STATUS.FAILED]: { bg: "#fee2e2", text: "#b91c1c" },     // Red
};

/** Default color for unknown statuses */
const DEFAULT_STATUS_COLORS: StatusColors = { bg: "#e5e7eb", text: "#374151" };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Vietnamese label for a delivery status
 * @param status - The status string (case-insensitive)
 * @returns Vietnamese label or original status if not found
 */
export function getDeliveryStatusLabel(status?: string | null): string {
    if (!status) return "Không xác định";
    const key = status.toUpperCase();
    return DELIVERY_STATUS_LABELS[key] || status;
}

/**
 * Get color scheme for a delivery status
 * @param status - The status string (case-insensitive)
 * @returns Object with bg and text colors
 */
export function getDeliveryStatusColors(status?: string | null): StatusColors {
    if (!status) return DEFAULT_STATUS_COLORS;
    const key = status.toUpperCase();
    return DELIVERY_STATUS_COLORS[key] || DEFAULT_STATUS_COLORS;
}

// ============================================================================
// EXPORT AS OBJECT (for convenience)
// ============================================================================

export const DeliveryStatusConstants = {
    STATUS: DELIVERY_STATUS,
    LABELS: DELIVERY_STATUS_LABELS,
    COLORS: DELIVERY_STATUS_COLORS,
    getLabel: getDeliveryStatusLabel,
    getColors: getDeliveryStatusColors,
} as const;

export default DeliveryStatusConstants;
