import type { Phase } from "@/types/api/campaign";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PRIMARY = "#ad4e28";

interface DeliveryBottomBarProps {
    campaignId: string;
    phases: Phase[];
}

export default function DeliveryBottomBar({
    campaignId,
    phases,
}: DeliveryBottomBarProps) {
    const router = useRouter();

    const handleDisbursement = () => {
        router.push({
            pathname: "/operationRequest",
            params: {
                phases: JSON.stringify(
                    phases.map((p) => ({
                        id: p.id,
                        phaseName: p.phaseName,
                        cookingFundsAmount: p.cookingFundsAmount,
                        deliveryFundsAmount: p.deliveryFundsAmount,
                    }))
                ),
            },
        });
    };

    const handleDeliveryOrders = () => {
        router.push({
            pathname: "/deliveryOrders",
            params: { campaignId: campaignId },
        });
    };

    return (
        <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleDisbursement}>
                <Text style={styles.secondaryText}>Giải ngân</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1.2 }]}
                onPress={handleDeliveryOrders}
            >
                <Text style={styles.primaryText}>Xem đơn giao hàng</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    bottomBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
        backgroundColor: "#ffffff",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 6,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    primaryBtn: {
        flex: 1.4,
        backgroundColor: PRIMARY,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
    },
    primaryText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
    },
    secondaryBtn: {
        flex: 1,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: PRIMARY,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        backgroundColor: "#fff",
    },
    secondaryText: {
        color: PRIMARY,
        fontSize: 13,
        fontWeight: "600",
    },
});
