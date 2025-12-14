import { useCallback, useEffect, useRef, useState } from "react";
import GuestMode from "../services/guestMode";
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
    /** Whether the user is in guest mode */
    isGuest: boolean;
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
    const [isGuest, setIsGuest] = useState(true); // Default to true to prevent initial API call

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // -------------------------------------------------------------------------
    // Fetch unread count
    // -------------------------------------------------------------------------
    const fetchUnreadCount = useCallback(async () => {
        // Skip if in guest mode
        if (isGuest) return;

        try {
            const count = await NotificationService.getUnreadCount();
            setUnreadCount(count);
            setError(null);
        } catch (err) {
            // Silently fail - don't break the app if notification API fails
        }
    }, [isGuest]);

    // -------------------------------------------------------------------------
    // Fetch notifications
    // -------------------------------------------------------------------------
    const fetchNotifications = useCallback(
        async (cursor?: string) => {
            // Skip if in guest mode
            if (isGuest) return;

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
            } finally {
                setLoading(false);
            }
        },
        [limit, isGuest]
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
        // Check guest mode first
        GuestMode.isGuest().then((guest) => {
            setIsGuest(guest);
            if (!guest) {
                // Only fetch if not guest
                fetchUnreadCount();
                fetchNotifications();
            }
        });

        // Start polling only if not guest
        const startPolling = async () => {
            const guest = await GuestMode.isGuest();
            if (!guest) {
                intervalRef.current = setInterval(fetchUnreadCount, intervalMs);
            }
        };
        startPolling();

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
        isGuest, // Export isGuest so components can hide notification UI
        refresh,
        loadMore,
        markAllAsRead,
        deleteNotification,
    };
}

export default useNotificationPolling;
