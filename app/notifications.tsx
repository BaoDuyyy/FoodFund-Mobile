import EmptyState from "@/components/EmptyState";
import { useNotificationPolling } from "@/hooks";
import type { Notification } from "@/types/api/notification";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    PixelRatio,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Base width for scaling (based on standard phone width ~375px)
const BASE_WIDTH = 375;

// Responsive scaling functions
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Normalize font size based on pixel ratio for consistency across devices
const normalizeFontSize = (size: number) => {
    const newSize = scale(size);
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Colors
const PRIMARY = "#d97706";
const BG = "#fef7ed";

// Notification type icons and colors
const NOTIFICATION_CONFIG: Record<
    string,
    { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }
> = {
    DONATION: { icon: "heart", color: "#dc2626", bgColor: "#fef2f2" },
    CAMPAIGN: { icon: "megaphone", color: "#2563eb", bgColor: "#eff6ff" },
    SYSTEM: { icon: "information-circle", color: "#6b7280", bgColor: "#f3f4f6" },
    DEFAULT: { icon: "notifications", color: PRIMARY, bgColor: "#fff7ed" },
};

function getNotificationConfig(type: string) {
    return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.DEFAULT;
}

function formatTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
}

function parseNotificationData(data: any): { title?: string; message?: string } {
    // If data is null or undefined
    if (!data) {
        return { message: "Bạn có thông báo mới" };
    }

    // If data is already an object
    if (typeof data === 'object') {
        // Extract meaningful fields for display
        const title = data.postTitle || data.campaignTitle || data.title || undefined;
        const message = data.postPreview || data.message || data.description || undefined;
        return { title, message };
    }

    // If data is a string, try to parse as JSON
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            if (typeof parsed === 'object' && parsed !== null) {
                const title = parsed.postTitle || parsed.campaignTitle || parsed.title || undefined;
                const message = parsed.postPreview || parsed.message || parsed.description || undefined;
                return { title, message };
            }
            return { message: String(parsed) };
        } catch {
            // If JSON parse fails, use the string directly
            return { message: data };
        }
    }

    return { message: String(data) };
}

export default function NotificationsScreen() {
    const router = useRouter();
    const {
        notifications,
        unreadCount,
        loading,
        hasMore,
        refresh,
        loadMore,
        markAllAsRead,
        deleteNotification,
    } = useNotificationPolling(30000, 20);

    const [refreshing, setRefreshing] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    const handleMarkAllAsRead = useCallback(async () => {
        try {
            await markAllAsRead();
        } catch (err) {
            // Failed to mark all as read
        }
    }, [markAllAsRead]);

    const handleDelete = useCallback(
        async (id: string) => {
            setDeletingId(id);
            try {
                await deleteNotification(id);
            } catch (err) {
                // Failed to delete notification
            } finally {
                setDeletingId(null);
            }
        },
        [deleteNotification]
    );

    const renderNotificationItem = useCallback(
        ({ item }: { item: Notification }) => {
            const config = getNotificationConfig(item.type);
            const parsedData = parseNotificationData(item.data);
            const isDeleting = deletingId === item.id;

            return (
                <View
                    style={[
                        styles.notificationItem,
                        !item.isRead && styles.notificationItemUnread,
                    ]}
                >
                    <View style={[styles.iconWrap, { backgroundColor: config.bgColor }]}>
                        <Ionicons name={config.icon} size={22} color={config.color} />
                    </View>

                    <View style={styles.contentWrap}>
                        <Text style={styles.notificationTitle} numberOfLines={1}>
                            {parsedData.title || item.type}
                        </Text>
                        <Text style={styles.notificationMessage} numberOfLines={2}>
                            {parsedData.message || "Bạn có thông báo mới"}
                        </Text>
                        <Text style={styles.notificationTime}>
                            {formatTimeAgo(item.created_at)}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(item.id)}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color="#9ca3af" />
                        ) : (
                            <Ionicons name="trash-outline" size={20} color="#9ca3af" />
                        )}
                    </TouchableOpacity>
                </View>
            );
        },
        [deletingId, handleDelete]
    );

    const renderEmptyState = useCallback(() => {
        if (loading) return null;

        return (
            <EmptyState
                message="Không có thông báo"
                subMessage="Bạn sẽ nhận được thông báo khi có cập nhật mới"
            />
        );
    }, [loading]);

    const renderFooter = useCallback(() => {
        if (!hasMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color={PRIMARY} />
            </View>
        );
    }, [hasMore]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#222" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Thông báo</Text>

                {unreadCount > 0 && (
                    <TouchableOpacity
                        style={styles.markAllBtn}
                        onPress={handleMarkAllAsRead}
                    >
                        <Text style={styles.markAllText}>Đánh dấu đã đọc</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            {loading && notifications.length === 0 ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={PRIMARY} />
                    <Text style={styles.loadingText}>Đang tải thông báo...</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotificationItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[PRIMARY]}
                            tintColor={PRIMARY}
                        />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListEmptyComponent={renderEmptyState}
                    ListFooterComponent={renderFooter}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: "4%",
        paddingVertical: moderateScale(10),
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    backBtn: {
        padding: moderateScale(4),
        marginRight: moderateScale(10),
        minHeight: moderateScale(36), // Ensure minimum touch target
    },
    headerTitle: {
        flex: 1,
        fontSize: normalizeFontSize(17),
        fontWeight: "800",
        color: "#222",
    },
    markAllBtn: {
        paddingHorizontal: moderateScale(10),
        paddingVertical: moderateScale(6),
        backgroundColor: "#fff7ed",
        borderRadius: moderateScale(14),
        borderWidth: 1,
        borderColor: "#fed7aa",
        minHeight: moderateScale(32), // Ensure minimum touch target
    },
    markAllText: {
        fontSize: normalizeFontSize(11),
        fontWeight: "600",
        color: PRIMARY,
    },

    // Loading
    loadingWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: moderateScale(10),
        fontSize: normalizeFontSize(13),
        color: "#6b7280",
    },

    // List
    listContent: {
        paddingVertical: moderateScale(8),
        flexGrow: 1,
    },

    // Notification Item
    notificationItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#fff",
        marginHorizontal: "3%",
        marginVertical: moderateScale(4),
        padding: moderateScale(12),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: "#f3f4f6",
    },
    notificationItemUnread: {
        backgroundColor: "#fffbeb",
        borderColor: "#fde68a",
    },
    iconWrap: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(10),
        justifyContent: "center",
        alignItems: "center",
        marginRight: moderateScale(10),
    },
    contentWrap: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: normalizeFontSize(13),
        fontWeight: "700",
        color: "#222",
        marginBottom: moderateScale(2),
    },
    notificationMessage: {
        fontSize: normalizeFontSize(12),
        color: "#6b7280",
        lineHeight: moderateScale(17),
        marginBottom: moderateScale(4),
    },
    notificationTime: {
        fontSize: normalizeFontSize(10),
        color: "#9ca3af",
    },
    deleteBtn: {
        padding: moderateScale(8),
        marginLeft: moderateScale(4),
        minHeight: moderateScale(36), // Ensure minimum touch target
    },

    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: "10%",
        paddingBottom: moderateScale(70),
    },
    emptyStateTitle: {
        fontSize: normalizeFontSize(17),
        fontWeight: "700",
        color: "#374151",
        marginTop: moderateScale(14),
    },
    emptyStateSubtitle: {
        fontSize: normalizeFontSize(13),
        color: "#6b7280",
        textAlign: "center",
        marginTop: moderateScale(8),
    },

    // Footer
    footer: {
        paddingVertical: moderateScale(14),
        alignItems: "center",
    },
});
