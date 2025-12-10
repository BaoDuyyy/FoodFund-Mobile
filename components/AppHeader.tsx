import { useNotificationPolling } from "@/hooks";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PRIMARY = "#ad4e28";

interface AppHeaderProps {
    /** Optional title to display next to logo */
    title?: string;
    /** Show search button (default: true) */
    showSearch?: boolean;
    /** Show notification button (default: true) */
    showNotification?: boolean;
    /** Show profile button (default: true) */
    showProfile?: boolean;
}

/**
 * Shared header component with logo on left and action buttons on right.
 * Used across home, campaign, and organization screens.
 */
export default function AppHeader({
    title,
    showSearch = true,
    showNotification = true,
    showProfile = true,
}: AppHeaderProps) {
    const router = useRouter();
    const { unreadCount } = useNotificationPolling();

    return (
        <View style={styles.container}>
            {/* Left: Logo + optional title */}
            <View style={styles.leftSection}>
                <Image
                    source={require("@/assets/images/icon.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
                {title && <Text style={styles.title}>{title}</Text>}
            </View>

            {/* Right: Action buttons */}
            <View style={styles.rightSection}>
                {showSearch && (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => router.push("/search" as any)}
                    >
                        <Feather name="search" size={20} color={PRIMARY} />
                    </TouchableOpacity>
                )}

                {showNotification && (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => router.push("/notifications" as any)}
                    >
                        <Ionicons name="notifications-outline" size={20} color={PRIMARY} />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}

                {showProfile && (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => router.push("/profile" as any)}
                    >
                        <FontAwesome name="user-circle" size={20} color={PRIMARY} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f3f3f3",
    },
    leftSection: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    logo: {
        width: 48,
        height: 48,
        marginRight: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: "800",
        color: "#222",
    },
    rightSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#f7f7f7",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: "#f3f3f3",
    },
    badge: {
        position: "absolute",
        top: 2,
        right: 2,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#dc2626",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 3,
    },
    badgeText: {
        color: "#fff",
        fontSize: 9,
        fontWeight: "700",
    },
});
