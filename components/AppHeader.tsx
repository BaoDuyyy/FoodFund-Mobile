import { useNotificationPolling } from "@/hooks";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Image, PixelRatio, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Responsive scaling functions
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_WIDTH = 375;
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
const normalizeFontSize = (size: number) => {
    const newSize = scale(size);
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

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
    const { unreadCount, isGuest } = useNotificationPolling();

    // Hide notification when in guest mode
    const shouldShowNotification = showNotification && !isGuest;

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
                        <Feather name="search" size={moderateScale(18)} color={PRIMARY} />
                    </TouchableOpacity>
                )}

                {shouldShowNotification && (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => router.push("/notifications" as any)}
                    >
                        <Ionicons name="notifications-outline" size={moderateScale(18)} color={PRIMARY} />
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
                        <FontAwesome name="user-circle" size={moderateScale(18)} color={PRIMARY} />
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
        paddingHorizontal: "4%",
        paddingVertical: moderateScale(10),
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
        width: moderateScale(44),
        height: moderateScale(44),
        marginRight: moderateScale(10),
    },
    title: {
        fontSize: normalizeFontSize(17),
        fontWeight: "800",
        color: "#222",
    },
    rightSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: moderateScale(8),
    },
    iconButton: {
        width: moderateScale(38),
        height: moderateScale(38),
        borderRadius: moderateScale(10),
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
        minHeight: moderateScale(38), // Ensure minimum touch target
    },
    badge: {
        position: "absolute",
        top: moderateScale(2),
        right: moderateScale(2),
        minWidth: moderateScale(14),
        height: moderateScale(14),
        borderRadius: moderateScale(7),
        backgroundColor: "#dc2626",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: moderateScale(3),
    },
    badgeText: {
        color: "#fff",
        fontSize: normalizeFontSize(8),
        fontWeight: "700",
    },
});
