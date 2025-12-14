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
}

export const CAMPAIGN_STATUS_OPTIONS: StatusOption[] = [
    { key: 'ALL', label: 'All Status', backendStatus: null },
    { key: 'ACTIVE', label: 'Active', backendStatus: 'ACTIVE' },
    { key: 'COMPLETED', label: 'Completed', backendStatus: 'COMPLETED' },
    { key: 'PROCESSING', label: 'Processing', backendStatus: 'PROCESSING' },
    { key: 'APPROVED', label: 'Approved', backendStatus: 'APPROVED' },
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
}

export const CAMPAIGN_SORT_OPTIONS: SortOption[] = [
    { key: 'MOST_DONATED', label: 'Most Donated' },
    { key: 'LEAST_DONATED', label: 'Least Donated' },
    { key: 'NEWEST_FIRST', label: 'Newest First' },
    { key: 'OLDEST_FIRST', label: 'Oldest First' },
    { key: 'TARGET_AMOUNT_ASC', label: 'Target Amount (Low to High)' },
    { key: 'TARGET_AMOUNT_DESC', label: 'Target Amount (High to Low)' },
];

// ============================================================================
// DEFAULTS
// ============================================================================

export const DEFAULT_STATUS: CampaignStatusKey = 'ACTIVE';
export const DEFAULT_SORT: CampaignSortKey = 'MOST_DONATED';
