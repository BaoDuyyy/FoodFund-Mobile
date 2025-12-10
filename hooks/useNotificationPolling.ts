import { useCallback, useEffect, useRef, useState } from "react";
import NotificationService from "../services/notificationService";
import type { Notification, PaginatedNotifications } from "../types/api/notification";

// =============================================================================
// TYPES
// =============================================================================

export interface UseNotificationPollingReturn {
    /** Number of unread notifications */
    unreadCount: number;
    /** List of notifications */
    notifications: Notification[];
    /** Whether there are more notifications to load */
    hasMore: boolean;
    /** Cursor for pagination */
    nextCursor: string | null;
    /** Whether notifications are loading */
    loading: boolean;
    /** Error message if any */
    error: string | null;
    /** Refresh notifications and unread count */
    refresh: () => Promise<void>;
    /** Load more notifications (pagination) */
    loadMore: () => Promise<void>;
    /** Mark all notifications as read */
    markAllAsRead: () => Promise<void>;
    /** Delete a notification */
    deleteNotification: (id: string) => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Custom hook for notification polling.
 * Polls unread count every `intervalMs` milliseconds and provides notification management.
 *
 * @param intervalMs - Polling interval in milliseconds (default: 30000 = 30 seconds)
 * @param limit - Number of notifications to fetch per page (default: 20)
 *
 * @example
 * ```tsx
 * function Header() {
 *   const { unreadCount, refresh } = useNotificationPolling();
 *
 *   return (
 *     <TouchableOpacity onPress={() => router.push('/notifications')}>
 *       <Ionicons name="notifications" size={24} />
 *       {unreadCount > 0 && <Badge count={unreadCount} />}
 *     </TouchableOpacity>
 *   );
 * }
 * ```
 */
export function useNotificationPolling(
    intervalMs = 30000,
    limit = 20
): UseNotificationPollingReturn {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // -------------------------------------------------------------------------
    // Fetch unread count
    // -------------------------------------------------------------------------
    const fetchUnreadCount = useCallback(async () => {
        try {
            const count = await NotificationService.getUnreadCount();
            setUnreadCount(count);
            setError(null);
        } catch (err) {
            // Silently fail - don't break the app if notification API fails
            console.log("Failed to fetch unread count:", err);
        }
    }, []);

    // -------------------------------------------------------------------------
    // Fetch notifications
    // -------------------------------------------------------------------------
    const fetchNotifications = useCallback(
        async (cursor?: string) => {
            setLoading(true);
            setError(null);

            try {
                const result: PaginatedNotifications = await NotificationService.getNotifications({
                    limit,
                    cursor,
                });

                if (cursor) {
                    // Append to existing notifications (load more)
                    setNotifications((prev) => [...prev, ...result.notifications]);
                } else {
                    // Replace notifications (initial load or refresh)
                    setNotifications(result.notifications);
                }

                setHasMore(result.hasMore);
                setNextCursor(result.nextCursor);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                setError(message);
                console.log("Failed to fetch notifications:", message);
            } finally {
                setLoading(false);
            }
        },
        [limit]
    );

    // -------------------------------------------------------------------------
    // Refresh both unread count and notifications
    // -------------------------------------------------------------------------
    const refresh = useCallback(async () => {
        await Promise.all([fetchUnreadCount(), fetchNotifications()]);
    }, [fetchUnreadCount, fetchNotifications]);

    // -------------------------------------------------------------------------
    // Load more notifications (pagination)
    // -------------------------------------------------------------------------
    const loadMore = useCallback(async () => {
        if (!hasMore || loading || !nextCursor) return;
        await fetchNotifications(nextCursor);
    }, [hasMore, loading, nextCursor, fetchNotifications]);

    // -------------------------------------------------------------------------
    // Mark all as read
    // -------------------------------------------------------------------------
    const markAllAsRead = useCallback(async () => {
        try {
            await NotificationService.markAllAsRead();
            setUnreadCount(0);
            // Update local state to mark all as read
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, []);

    // -------------------------------------------------------------------------
    // Delete notification
    // -------------------------------------------------------------------------
    const deleteNotification = useCallback(async (id: string) => {
        try {
            await NotificationService.deleteNotification(id);
            // Remove from local state
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            // Refresh unread count
            await fetchUnreadCount();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, [fetchUnreadCount]);

    // -------------------------------------------------------------------------
    // Start polling on mount
    // -------------------------------------------------------------------------
    useEffect(() => {
        // Initial fetch
        fetchUnreadCount();
        fetchNotifications();

        // Start polling
        intervalRef.current = setInterval(fetchUnreadCount, intervalMs);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchUnreadCount, fetchNotifications, intervalMs]);

    return {
        unreadCount,
        notifications,
        hasMore,
        nextCursor,
        loading,
        error,
        refresh,
        loadMore,
        markAllAsRead,
        deleteNotification,
    };
}

export default useNotificationPolling;
