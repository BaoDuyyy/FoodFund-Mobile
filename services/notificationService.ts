import { getGraphqlUrl } from "../config/api";
import {
    DELETE_NOTIFICATION_MUTATION,
    MARK_ALL_AS_READ_MUTATION,
} from "../graphql/mutation/notifications";
import {
    MY_NOTIFICATIONS_QUERY,
    UNREAD_COUNT_QUERY,
} from "../graphql/query/notifications";
import type {
    DeleteNotificationResponse,
    GetNotificationsInput,
    MarkAllAsReadResponse,
    MyNotificationsResponse,
    UnreadCountResponse
} from "../types/api/notification";
import type { GraphQLResponse } from "../types/graphql";
import AuthService from "./authService";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract error message from GraphQL errors array
 */
function extractErrorMessage(
    errors: Array<{ message?: string }> | undefined
): string | null {
    if (!errors || errors.length === 0) return null;
    return errors.map((e) => e.message || JSON.stringify(e)).join("; ");
}

/**
 * Generic GraphQL request handler for NotificationService
 * Includes authentication token in requests
 */
async function graphqlRequest<T>(
    query: string,
    variables: Record<string, unknown> = {},
    overrideUrl?: string
): Promise<GraphQLResponse<T>> {
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();

    let res: Response;
    try {
        res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ query, variables }),
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Cannot connect to server: ${message}`);
    }

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Network error ${res.status}: ${text}`);
    }

    const json = await res.json().catch(() => null);
    if (!json) {
        throw new Error("Invalid JSON from server");
    }

    return json as GraphQLResponse<T>;
}

// =============================================================================
// NOTIFICATION SERVICE
// =============================================================================

export const NotificationService = {
    /**
     * Get notifications with pagination support
     * @param input - Optional filters (limit, cursor, isRead)
     * @returns Paginated notifications with hasMore and nextCursor
     */
    async getNotifications(
        input: GetNotificationsInput = {},
        overrideUrl?: string
    ) {
        const response = await graphqlRequest<MyNotificationsResponse>(
            MY_NOTIFICATIONS_QUERY,
            {
                limit: input.limit,
                cursor: input.cursor,
                isRead: input.isRead,
            },
            overrideUrl
        );

        const errorMsg = extractErrorMessage(response.errors);
        if (errorMsg) {
            throw new Error(errorMsg);
        }

        const payload = response.data?.myNotifications;
        if (!payload) {
            throw new Error("Empty or invalid notifications response");
        }

        return payload;
    },

    /**
     * Get the count of unread notifications
     * @returns Number of unread notifications
     */
    async getUnreadCount(overrideUrl?: string): Promise<number> {
        const response = await graphqlRequest<UnreadCountResponse>(
            UNREAD_COUNT_QUERY,
            {},
            overrideUrl
        );

        const errorMsg = extractErrorMessage(response.errors);
        if (errorMsg) {
            throw new Error(errorMsg);
        }

        const count = response.data?.unreadNotificationCount;
        if (count === undefined || count === null) {
            throw new Error("Empty or invalid unread count response");
        }

        return count;
    },

    /**
     * Mark all notifications as read
     * @returns Result with success status, count of marked notifications, and message
     */
    async markAllAsRead(overrideUrl?: string) {
        const response = await graphqlRequest<MarkAllAsReadResponse>(
            MARK_ALL_AS_READ_MUTATION,
            {},
            overrideUrl
        );

        const errorMsg = extractErrorMessage(response.errors);
        if (errorMsg) {
            throw new Error(errorMsg);
        }

        const payload = response.data?.markAllNotificationsAsRead;
        if (!payload) {
            throw new Error("Empty markAllNotificationsAsRead response");
        }

        return payload;
    },

    /**
     * Delete a specific notification
     * @param notificationId - ID of the notification to delete
     * @returns Result with success status and message
     */
    async deleteNotification(notificationId: string, overrideUrl?: string) {
        const response = await graphqlRequest<DeleteNotificationResponse>(
            DELETE_NOTIFICATION_MUTATION,
            { notificationId },
            overrideUrl
        );

        const errorMsg = extractErrorMessage(response.errors);
        if (errorMsg) {
            throw new Error(errorMsg);
        }

        const payload = response.data?.deleteNotification;
        if (!payload) {
            throw new Error("Empty deleteNotification response");
        }

        return payload;
    },
};

export default NotificationService;
