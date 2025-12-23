import React from "react";
import { Dimensions, Image, PixelRatio, StyleSheet, Text, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_WIDTH = 375;
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
const normalizeFontSize = (size: number) => {
    const newSize = scale(size);
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

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
    const scaledLogoSize = moderateScale(logoSize);
    return (
        <View style={styles.container}>
            <Image
                source={require("@/assets/images/empty.png")}
                style={[styles.logo, { width: scaledLogoSize, height: scaledLogoSize }]}
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
        paddingVertical: moderateScale(28),
        paddingHorizontal: "6%",
    },
    logo: {
        marginBottom: moderateScale(18),
        opacity: 0.6,
    },
    message: {
        fontSize: normalizeFontSize(15),
        fontWeight: "600",
        color: "#666",
        textAlign: "center",
        marginBottom: moderateScale(8),
    },
    subMessage: {
        fontSize: normalizeFontSize(13),
        color: "#999",
        textAlign: "center",
        lineHeight: moderateScale(18),
    },
});
