import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const PRIMARY = "#ad4e28";
const ACCENT_BLUE = "#2563eb";
const ACCENT_GREEN = "#16a34a";

interface CampaignCoverCardProps {
    coverImage?: string | null;
    title?: string | null;
    status?: string | null;
}

export default function CampaignCoverCard({
    coverImage,
    title,
    status,
}: CampaignCoverCardProps) {
    const getStatusColor = () => {
        const s = (status || "").toLowerCase();
        if (s.includes("đang") || s.includes("active")) return ACCENT_BLUE;
        if (s.includes("hoàn") || s.includes("done")) return ACCENT_GREEN;
        if (s.includes("hủy") || s.includes("cancel")) return "#f97316";
        return PRIMARY;
    };

    return (
        <View style={styles.coverCard}>
            {coverImage ? (
                <Image
                    source={{ uri: coverImage }}
                    style={styles.coverImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.coverImage, { backgroundColor: "#e5e7eb" }]} />
            )}

            <View style={styles.coverOverlay}>
                <Text style={styles.campaignTitle}>{title || "Chiến dịch"}</Text>
                <View style={[styles.statusPill, { backgroundColor: "#fff" }]}>
                    <View
                        style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
                    />
                    <Text style={[styles.statusPillText, { color: getStatusColor() }]}>
                        {status}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    coverCard: {
        marginTop: 4,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 4,
    },
    coverImage: {
        width: "100%",
        height: 200,
    },
    coverOverlay: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: "rgba(0,0,0,0.35)",
        flexDirection: "row",
        alignItems: "center",
    },
    campaignTitle: {
        flex: 1,
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
    },
    statusPill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 4,
    },
    statusPillText: {
        fontSize: 12,
        fontWeight: "700",
    },
});
