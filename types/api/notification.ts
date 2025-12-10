// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

/** Single notification item */
export interface Notification {
    id: string;
    type: string;
    data: string;
    isRead: boolean;
    created_at: string;
}

/** Input for fetching notifications */
export interface GetNotificationsInput {
    limit?: number;
    cursor?: string;
    isRead?: boolean;
}

/** Paginated notifications result */
export interface PaginatedNotifications {
    notifications: Notification[];
    hasMore: boolean;
    nextCursor: string | null;
}

/** Response from myNotifications query */
export interface MyNotificationsResponse {
    myNotifications: PaginatedNotifications;
}

/** Response from unreadNotificationCount query */
export interface UnreadCountResponse {
    unreadNotificationCount: number;
}

/** Result from markAllNotificationsAsRead mutation */
export interface MarkAllAsReadResult {
    success: boolean;
    count: number;
    message: string;
}

/** Response from markAllNotificationsAsRead mutation */
export interface MarkAllAsReadResponse {
    markAllNotificationsAsRead: MarkAllAsReadResult;
}

/** Result from deleteNotification mutation */
export interface DeleteNotificationResult {
    success: boolean;
    message: string;
}

/** Response from deleteNotification mutation */
export interface DeleteNotificationResponse {
    deleteNotification: DeleteNotificationResult;
}
