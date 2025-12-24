import React from "react";
import { StyleSheet, Text, View } from "react-native";

const PRIMARY = "#ad4e28";
const TEXT = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

interface FundingProgressCardProps {
    receivedAmount?: string | number | null;
    targetAmount?: string | number | null;
    fundingProgress?: number | null;
    donationCount?: number | null;
    fundraisingStartDate?: string | null;
    fundraisingEndDate?: string | null;
}

export default function FundingProgressCard({
    receivedAmount,
    targetAmount,
    fundingProgress,
    donationCount,
    fundraisingStartDate,
    fundraisingEndDate,
}: FundingProgressCardProps) {
    const progress = Math.max(0, Math.min(100, Number(fundingProgress || 0)));

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Tiến độ gây quỹ</Text>

            <View style={styles.progressRow}>
                <View style={styles.progressNumbers}>
                    <Text style={styles.amountText}>
                        {Number(receivedAmount || 0).toLocaleString("vi-VN")} / {Number(targetAmount || 0).toLocaleString("vi-VN")} đ
                    </Text>
                    <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                </View>

                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>

                <View style={styles.progressMetaRow}>
                    <View style={styles.progressMetaItem}>
                        <Text style={styles.smallMetaLabel}>Lượt quyên góp</Text>
                        <Text style={styles.smallMetaValue}>{donationCount || 0}</Text>
                    </View>
                    <View style={styles.progressMetaItem}>
                        <Text style={styles.smallMetaLabel}>Thời gian gây quỹ</Text>
                        <Text style={styles.smallMetaValue}>
                            {fundraisingStartDate
                                ? new Date(fundraisingStartDate).toLocaleDateString("vi-VN")
                                : "—"}{" "}
                            -{" "}
                            {fundraisingEndDate
                                ? new Date(fundraisingEndDate).toLocaleDateString("vi-VN")
                                : "—"}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 14,
        marginTop: 14,
        borderWidth: 1,
        borderColor: BORDER,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: PRIMARY,
        marginBottom: 8,
    },
    progressRow: {
        marginTop: 4,
    },
    progressNumbers: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 6,
    },
    amountText: {
        fontSize: 16,
        fontWeight: "700",
        color: PRIMARY,
    },
    progressPercent: {
        fontSize: 18,
        fontWeight: "800",
        color: TEXT,
    },
    progressBarBg: {
        height: 9,
        borderRadius: 999,
        backgroundColor: "#e5e7eb",
        overflow: "hidden",
        marginBottom: 8,
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: PRIMARY,
    },
    progressMetaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    progressMetaItem: {
        flex: 1,
    },
    smallMetaLabel: {
        fontSize: 13,
        color: MUTED,
    },
    smallMetaValue: {
        fontSize: 14,
        color: TEXT,
        fontWeight: "600",
        marginTop: 2,
    },
});
