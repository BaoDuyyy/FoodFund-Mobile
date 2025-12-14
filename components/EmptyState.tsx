import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface EmptyStateProps {
    /** Custom message to display (default: "Không có dữ liệu") */
    message?: string;
    /** Optional sub-message for additional context */
    subMessage?: string;
    /** Size of the logo (default: 120) */
    logoSize?: number;
}

/**
 * Empty state component with logo image.
 * Used when there's no data to display.
 */
export default function EmptyState({
    message = "Không có dữ liệu",
    subMessage,
    logoSize = 120,
}: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <Image
                source={require("@/assets/images/empty.png")}
                style={[styles.logo, { width: logoSize, height: logoSize }]}
                resizeMode="contain"
            />
            <Text style={styles.message}>{message}</Text>
            {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    logo: {
        marginBottom: 20,
        opacity: 0.6,
    },
    message: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666",
        textAlign: "center",
        marginBottom: 8,
    },
    subMessage: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
        lineHeight: 20,
    },
});
