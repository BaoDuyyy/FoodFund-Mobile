/**
 * Campaign Filter Constants
 * Status and Sort options for campaign listing
 */

// ============================================================================
// STATUS FILTERS
// ============================================================================

export type CampaignStatusKey = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'PROCESSING' | 'APPROVED';

export interface StatusOption {
    key: CampaignStatusKey;
    label: string;
    backendStatus: string | null;
    color: string;
    bgColor: string;
    icon: string;
}

export const CAMPAIGN_STATUS_OPTIONS: StatusOption[] = [
    { key: 'ALL', label: 'Tất cả', backendStatus: null, color: '#6b7280', bgColor: '#f3f4f6', icon: 'apps' },
    { key: 'ACTIVE', label: 'Đang gây quỹ', backendStatus: 'ACTIVE', color: '#16a34a', bgColor: '#dcfce7', icon: 'flame' },
    { key: 'COMPLETED', label: 'Hoàn thành', backendStatus: 'COMPLETED', color: '#2563eb', bgColor: '#dbeafe', icon: 'checkmark-circle' },
    { key: 'PROCESSING', label: 'Đang xử lý', backendStatus: 'PROCESSING', color: '#f59e0b', bgColor: '#fef3c7', icon: 'time' },
    { key: 'APPROVED', label: 'Đã duyệt', backendStatus: 'APPROVED', color: '#8b5cf6', bgColor: '#ede9fe', icon: 'shield-checkmark' },
];

// ============================================================================
// SORT OPTIONS
// ============================================================================

export type CampaignSortKey =
    | 'MOST_DONATED'
    | 'LEAST_DONATED'
    | 'NEWEST_FIRST'
    | 'OLDEST_FIRST'
    | 'TARGET_AMOUNT_ASC'
    | 'TARGET_AMOUNT_DESC';

export interface SortOption {
    key: CampaignSortKey;
    label: string;
    icon: string;
}

export const CAMPAIGN_SORT_OPTIONS: SortOption[] = [
    { key: 'MOST_DONATED', label: 'Được ủng hộ nhiều nhất', icon: 'trending-up' },
    { key: 'LEAST_DONATED', label: 'Được ủng hộ ít nhất', icon: 'trending-down' },
    { key: 'NEWEST_FIRST', label: 'Mới nhất', icon: 'time' },
    { key: 'OLDEST_FIRST', label: 'Cũ nhất', icon: 'calendar' },
    { key: 'TARGET_AMOUNT_ASC', label: 'Mục tiêu thấp đến cao', icon: 'arrow-up' },
    { key: 'TARGET_AMOUNT_DESC', label: 'Mục tiêu cao đến thấp', icon: 'arrow-down' },
];

// ============================================================================
// DEFAULTS
// ============================================================================

export const DEFAULT_STATUS: CampaignStatusKey = 'ALL';
export const DEFAULT_SORT: CampaignSortKey = 'MOST_DONATED';

