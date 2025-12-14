/**
 * Meal Batch Status Constants
 * 
 * Centralized status definitions for meal batches with Vietnamese translations.
 * Import from here for consistent status handling across all meal batch-related pages.
 * 
 * Usage:
 * import { MEAL_BATCH_STATUS, getMealBatchStatusLabel, getMealBatchStatusColors } from '@/constants/mealBatchStatus';
 */

import type { StatusColors } from "./deliveryStatus";

// ============================================================================
// MEAL BATCH STATUS ENUM VALUES
// ============================================================================

export const MEAL_BATCH_STATUS = {
    PREPARING: "PREPARING",
    READY: "READY",
    DELIVERED: "DELIVERED",
} as const;

export type MealBatchStatusType = typeof MEAL_BATCH_STATUS[keyof typeof MEAL_BATCH_STATUS];

// ============================================================================
// VIETNAMESE LABELS
// ============================================================================

/** Map of status to Vietnamese label */
export const MEAL_BATCH_STATUS_LABELS: Record<string, string> = {
    [MEAL_BATCH_STATUS.PREPARING]: "Đang chuẩn bị",
    [MEAL_BATCH_STATUS.READY]: "Sẵn sàng",
    [MEAL_BATCH_STATUS.DELIVERED]: "Đã giao",
};

// ============================================================================
// STATUS COLORS
// ============================================================================

/** Map of status to color scheme (background + text) */
export const MEAL_BATCH_STATUS_COLORS: Record<string, StatusColors> = {
    [MEAL_BATCH_STATUS.PREPARING]: { bg: "#fef3c7", text: "#b45309" },  // Amber/Orange
    [MEAL_BATCH_STATUS.READY]: { bg: "#dcfce7", text: "#15803d" },      // Green
    [MEAL_BATCH_STATUS.DELIVERED]: { bg: "#e0f2fe", text: "#0369a1" }, // Blue
};

/** Default color for unknown statuses */
const DEFAULT_STATUS_COLORS: StatusColors = { bg: "#e5e7eb", text: "#374151" };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Vietnamese label for a meal batch status
 * @param status - The status string (case-insensitive)
 * @returns Vietnamese label or original status if not found
 */
export function getMealBatchStatusLabel(status?: string | null): string {
    if (!status) return "Không xác định";
    const key = status.toUpperCase();
    return MEAL_BATCH_STATUS_LABELS[key] || status;
}

/**
 * Get color scheme for a meal batch status
 * @param status - The status string (case-insensitive)
 * @returns Object with bg and text colors
 */
export function getMealBatchStatusColors(status?: string | null): StatusColors {
    if (!status) return DEFAULT_STATUS_COLORS;
    const key = status.toUpperCase();
    return MEAL_BATCH_STATUS_COLORS[key] || DEFAULT_STATUS_COLORS;
}

// ============================================================================
// EXPORT AS OBJECT (for convenience)
// ============================================================================

export const MealBatchStatusConstants = {
    STATUS: MEAL_BATCH_STATUS,
    LABELS: MEAL_BATCH_STATUS_LABELS,
    COLORS: MEAL_BATCH_STATUS_COLORS,
    getLabel: getMealBatchStatusLabel,
    getColors: getMealBatchStatusColors,
} as const;

export default MealBatchStatusConstants;
