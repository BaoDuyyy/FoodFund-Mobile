/**
 * Ingredient Request Status Constants
 * 
 * Centralized status definitions for ingredient requests with Vietnamese translations.
 * Import from here for consistent status handling across all ingredient request-related pages.
 * 
 * Usage:
 * import { INGREDIENT_REQUEST_STATUS, getIngredientRequestStatusLabel } from '@/constants/ingredientRequestStatus';
 */

import { StatusColors } from './deliveryStatus';

// ============================================================================
// INGREDIENT REQUEST STATUS ENUM VALUES
// ============================================================================

export const INGREDIENT_REQUEST_STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    DISBURSED: "DISBURSED",
} as const;

export type IngredientRequestStatusType = typeof INGREDIENT_REQUEST_STATUS[keyof typeof INGREDIENT_REQUEST_STATUS];

// ============================================================================
// VIETNAMESE LABELS
// ============================================================================

/** Map of status to Vietnamese label */
export const INGREDIENT_REQUEST_STATUS_LABELS: Record<string, string> = {
    [INGREDIENT_REQUEST_STATUS.PENDING]: "Chờ duyệt",
    [INGREDIENT_REQUEST_STATUS.APPROVED]: "Đã duyệt",
    [INGREDIENT_REQUEST_STATUS.REJECTED]: "Từ chối",
    [INGREDIENT_REQUEST_STATUS.DISBURSED]: "Đã giải ngân",
};

// ============================================================================
// STATUS COLORS
// ============================================================================

/** Map of status to color scheme (background + text) */
export const INGREDIENT_REQUEST_STATUS_COLORS: Record<string, StatusColors> = {
    [INGREDIENT_REQUEST_STATUS.PENDING]: { bg: "#fff4e0", text: "#b26a00" },     // Orange/Amber - waiting
    [INGREDIENT_REQUEST_STATUS.APPROVED]: { bg: "#e5f7ec", text: "#1b873f" },    // Green - approved
    [INGREDIENT_REQUEST_STATUS.REJECTED]: { bg: "#ffe5e5", text: "#c82333" },    // Red - rejected
    [INGREDIENT_REQUEST_STATUS.DISBURSED]: { bg: "#ccfbf1", text: "#0f766e" },   // Teal - disbursed
};

/** Default color for unknown statuses */
const DEFAULT_STATUS_COLORS: StatusColors = { bg: "#f2f2f2", text: "#999" };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Vietnamese label for an ingredient request status
 * @param status - The status string (case-insensitive)
 * @returns Vietnamese label or original status if not found
 */
export function getIngredientRequestStatusLabel(status?: string | null): string {
    if (!status) return "Không xác định";
    const key = status.toUpperCase();
    return INGREDIENT_REQUEST_STATUS_LABELS[key] || status;
}

/**
 * Get color scheme for an ingredient request status
 * @param status - The status string (case-insensitive)
 * @returns Object with bg and text colors
 */
export function getIngredientRequestStatusColors(status?: string | null): StatusColors {
    if (!status) return DEFAULT_STATUS_COLORS;
    const key = status.toUpperCase();
    return INGREDIENT_REQUEST_STATUS_COLORS[key] || DEFAULT_STATUS_COLORS;
}

// ============================================================================
// FILTER OPTIONS (for UI)
// ============================================================================

export type IngredientRequestStatusFilter = "ALL" | IngredientRequestStatusType;

export const INGREDIENT_REQUEST_STATUS_FILTER_OPTIONS: { key: IngredientRequestStatusFilter; label: string }[] = [
    { key: "ALL", label: "Tất cả" },
    { key: INGREDIENT_REQUEST_STATUS.PENDING, label: "Chờ duyệt" },
    { key: INGREDIENT_REQUEST_STATUS.APPROVED, label: "Đã duyệt" },
    { key: INGREDIENT_REQUEST_STATUS.REJECTED, label: "Từ chối" },
    { key: INGREDIENT_REQUEST_STATUS.DISBURSED, label: "Đã giải ngân" },
];

// ============================================================================
// EXPORT AS OBJECT (for convenience)
// ============================================================================

export const IngredientRequestStatusConstants = {
    STATUS: INGREDIENT_REQUEST_STATUS,
    LABELS: INGREDIENT_REQUEST_STATUS_LABELS,
    COLORS: INGREDIENT_REQUEST_STATUS_COLORS,
    FILTER_OPTIONS: INGREDIENT_REQUEST_STATUS_FILTER_OPTIONS,
    getLabel: getIngredientRequestStatusLabel,
    getColors: getIngredientRequestStatusColors,
} as const;

export default IngredientRequestStatusConstants;
