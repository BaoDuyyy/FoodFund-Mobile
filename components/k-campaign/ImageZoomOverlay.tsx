import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PRIMARY = "#ad4e28";

interface ImageZoomOverlayProps {
    imageUrl: string | null;
    onClose: () => void;
}

export default function ImageZoomOverlay({
    imageUrl,
    onClose,
}: ImageZoomOverlayProps) {
    if (!imageUrl) return null;

    return (
        <View style={styles.zoomOverlay}>
            <TouchableOpacity
                style={styles.zoomBackdrop}
                activeOpacity={1}
                onPress={onClose}
            />
            <View style={styles.zoomContent}>
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.zoomImage}
                    resizeMode="contain"
                />
                <TouchableOpacity style={styles.zoomCloseBtn} onPress={onClose}>
                    <Text style={styles.zoomCloseText}>Đóng</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    zoomOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 30,
    },
    zoomBackdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.75)",
    },
    zoomContent: {
        width: "90%",
        height: "70%",
        justifyContent: "center",
        alignItems: "center",
    },
    zoomImage: {
        width: "100%",
        height: "100%",
        borderRadius: 12,
        backgroundColor: "#000",
    },
    zoomCloseBtn: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "#ffffff",
    },
    zoomCloseText: {
        color: PRIMARY,
        fontWeight: "700",
    },
});
