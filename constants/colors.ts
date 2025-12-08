/**
 * App Color Palette
 * 
 * Centralized color definitions for consistent styling across the app.
 * Import colors from here instead of defining locally in each file.
 * 
 * Usage:
 * import { Colors } from '@/constants/colors';
 * // or
 * import { PRIMARY, BG } from '@/constants/colors';
 */

// ============================================================================
// BRAND COLORS
// ============================================================================

/** Primary brand color - warm orange/brown for CTAs and highlights */
export const PRIMARY = "#ad4e28";

/** Primary dark variant */
export const PRIMARY_DARK = "#8b3d1f";

/** Primary light variant */
export const PRIMARY_LIGHT = "#c96a42";

// ============================================================================
// BACKGROUND COLORS
// ============================================================================

/** Main background - light neutral */
export const BG = "#f5f7fb";

/** Alternative background - warm cream */
export const BG_WARM = "#f8f6f4";

/** Light warm background */
export const BG_CREAM = "#fff7f2";

/** Auth screens background */
export const BG_AUTH = "#fbefe6";

/** Card/surface background */
export const CARD_BG = "#ffffff";

// ============================================================================
// ACCENT COLORS
// ============================================================================

/** Accent orange */
export const ACCENT = "#f97316";

/** Success/positive - green */
export const ACCENT_GREEN = "#45b69c";

/** Strong success green */
export const SUCCESS = "#16a34a";

/** Info - blue */
export const ACCENT_BLUE = "#4f8cff";

/** Strong info blue */
export const INFO = "#2563eb";

/** Purple accent */
export const ACCENT_PURPLE = "#7c3aed";

// ============================================================================
// TEXT COLORS
// ============================================================================

/** Strong/heading text - near black */
export const STRONG_TEXT = "#111827";

/** Regular body text */
export const TEXT = "#222222";

/** Muted/secondary text */
export const MUTED_TEXT = "#6b7280";

/** Placeholder text */
export const PLACEHOLDER = "#9ca3af";

// ============================================================================
// UTILITY COLORS
// ============================================================================

/** Border color */
export const BORDER = "#e5e7eb";

/** Light border */
export const BORDER_LIGHT = "#f0e4da";

/** Danger/error - red */
export const DANGER = "#ef4444";

/** Warning - amber */
export const WARNING = "#f59e0b";

// ============================================================================
// EXPORT AS OBJECT (for convenience)
// ============================================================================

export const Colors = {
    // Brand
    primary: PRIMARY,
    primaryDark: PRIMARY_DARK,
    primaryLight: PRIMARY_LIGHT,

    // Background
    bg: BG,
    bgWarm: BG_WARM,
    bgCream: BG_CREAM,
    bgAuth: BG_AUTH,
    cardBg: CARD_BG,

    // Accent
    accent: ACCENT,
    accentGreen: ACCENT_GREEN,
    success: SUCCESS,
    accentBlue: ACCENT_BLUE,
    info: INFO,
    accentPurple: ACCENT_PURPLE,

    // Text
    strongText: STRONG_TEXT,
    text: TEXT,
    mutedText: MUTED_TEXT,
    placeholder: PLACEHOLDER,

    // Utility
    border: BORDER,
    borderLight: BORDER_LIGHT,
    danger: DANGER,
    warning: WARNING,
} as const;

export default Colors;
