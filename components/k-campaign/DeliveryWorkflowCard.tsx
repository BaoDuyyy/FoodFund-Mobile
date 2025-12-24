import {
    INFO as ACCENT_BLUE,
    SUCCESS as ACCENT_GREEN,
    MUTED_TEXT as MUTED,
    PRIMARY,
    STRONG_TEXT as TEXT
} from "@/constants/colors";
import type { Phase } from "@/types/api/campaign";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Map phase status code -> Vietnamese label
const phaseStatusLabels: Record<string, string> = {
    PLANNING: "Đang lên kế hoạch",
    AWAITING_INGREDIENT_DISBURSEMENT: "Chờ giải ngân tiền nguyên liệu",
    INGREDIENT_PURCHASE: "Đang mua nguyên liệu",
    AWAITING_AUDIT: "Chờ kiểm tra chứng từ",
    AWAITING_COOKING_DISBURSEMENT: "Chờ giải ngân chi phí",
    COOKING: "Đang nấu ăn",
    AWAITING_DELIVERY_DISBURSEMENT: "Chờ giải ngân chi phí",
    DELIVERY: "Đang vận chuyển",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    FAILED: "Thất bại",
    NULL: "Chưa xác định",
    DEFAULT: "Không xác định",
};

function getPhaseStatusLabel(status?: string | null): string {
    if (!status) return "Không xác định";
    const key = status.toUpperCase().trim();
    return phaseStatusLabels[key] || "Không xác định";
}

interface DeliveryWorkflowCardProps {
    campaignId: string;
    phases: Phase[];
}

export default function DeliveryWorkflowCard({
    campaignId,
    phases,
}: DeliveryWorkflowCardProps) {
    const router = useRouter();

    // Get current phase
    const getCurrentPhase = () => {
        if (phases.length === 0) return null;

        const now = new Date();
        const parseDate = (val: any) => {
            if (!val) return null;
            const d = new Date(val);
            return isNaN(d.getTime()) ? null : d;
        };

        const futureOrToday = phases
            .map((p) => ({ phase: p, date: parseDate(p.deliveryDate) }))
            .filter((x) => x.date && x.date >= now)
            .sort((a, b) => a.date!.getTime() - b.date!.getTime());

        return futureOrToday[0]?.phase ?? phases[0];
    };

    const currentPhase = getCurrentPhase();

    // Step 1: Giải ngân chi phí vận chuyển
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
                expenseType: "DELIVERY",
            },
        });
    };

    // Step 2: Xem đơn giao hàng
    const handleDeliveryOrders = () => {
        router.push({
            pathname: "/deliveryOrders",
            params: { campaignId: campaignId },
        });
    };

    // Determine current workflow step based on phase status
    const getCurrentWorkflowStep = (status?: string | null): 1 | 2 => {
        if (!status) return 1;
        const s = status.toUpperCase().trim();

        // Step 2: Delivery in progress or completed
        if (s === "AWAITING_DELIVERY_DISBURSEMENT" || s === "DELIVERY" || s === "COMPLETED") {
            return 2;
        }

        // Step 1: Earlier stages (still waiting for kitchen)
        return 1;
    };

    const currentWorkflowStep = getCurrentWorkflowStep(currentPhase?.status);

    // Get box style based on current workflow step
    const getCurrentPhaseBoxStyle = () => {
        if (currentWorkflowStep === 2) {
            return styles.currentPhaseBoxBlue;
        }
        return styles.currentPhaseBoxPrimary;
    };

    return (
        <View style={styles.workflowCard}>
            <Text style={styles.workflowTitle}>Quy trình vận chuyển</Text>

            {/* Current Phase Info */}
            {currentPhase && (
                <View style={[styles.currentPhaseBox, getCurrentPhaseBoxStyle()]}>
                    <Text style={styles.currentPhaseLabel}>Giai đoạn hiện tại</Text>
                    <Text style={styles.currentPhaseName}>{currentPhase.phaseName}</Text>
                    <Text style={[
                        styles.currentPhaseStatus,
                        currentWorkflowStep === 2 && { color: ACCENT_BLUE },
                        currentWorkflowStep === 1 && { color: PRIMARY },
                    ]}>
                        {getPhaseStatusLabel(currentPhase.status)}
                    </Text>
                </View>
            )}

            {/* Workflow Steps */}
            <View style={styles.workflowSteps}>
                {/* Step 1 */}
                <TouchableOpacity
                    style={[styles.workflowStep, styles.workflowStepPrimary]}
                    onPress={handleDisbursement}
                >
                    <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Giải ngân</Text>
                        <Text style={styles.stepDesc}>Yêu cầu giải ngân chi phí vận chuyển</Text>
                    </View>
                    <Text style={styles.stepArrow}>›</Text>
                </TouchableOpacity>

                <View style={styles.stepConnector} />

                {/* Step 2 */}
                <TouchableOpacity
                    style={[styles.workflowStep, styles.workflowStepBlue]}
                    onPress={handleDeliveryOrders}
                >
                    <View style={[styles.stepNumber, styles.stepNumberSecondary]}>
                        <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Đơn giao hàng</Text>
                        <Text style={styles.stepDesc}>Xem danh sách đơn cần giao</Text>
                    </View>
                    <Text style={styles.stepArrow}>›</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    workflowCard: {
        backgroundColor: "#eff6ff",
        borderRadius: 18,
        padding: 18,
        marginTop: 16,
        borderWidth: 1,
        borderColor: "#bfdbfe",
    },
    workflowTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: ACCENT_BLUE,
        marginBottom: 12,
    },
    currentPhaseBox: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#bfdbfe",
    },
    currentPhaseLabel: {
        fontSize: 13,
        color: MUTED,
        fontWeight: "600",
    },
    currentPhaseName: {
        fontSize: 18,
        fontWeight: "700",
        color: TEXT,
        marginTop: 4,
    },
    currentPhaseStatus: {
        fontSize: 14,
        color: ACCENT_BLUE,
        fontWeight: "600",
        marginTop: 4,
    },
    currentPhaseBoxPrimary: {
        backgroundColor: "#fff7ed",
        borderColor: PRIMARY,
    },
    currentPhaseBoxBlue: {
        backgroundColor: "#eff6ff",
        borderColor: ACCENT_BLUE,
    },
    currentPhaseBoxGreen: {
        backgroundColor: "#f0fdf4",
        borderColor: ACCENT_GREEN,
    },
    workflowSteps: {
        gap: 0,
    },
    workflowStep: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        borderWidth: 2,
        borderColor: "#e5e7eb",
    },
    workflowStepPrimary: {
        backgroundColor: "#fff7ed",
        borderColor: PRIMARY,
    },
    workflowStepBlue: {
        backgroundColor: "#eff6ff",
        borderColor: ACCENT_BLUE,
    },
    workflowStepGreen: {
        backgroundColor: "#f0fdf4",
        borderColor: ACCENT_GREEN,
    },
    stepNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: PRIMARY,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    stepNumberSecondary: {
        backgroundColor: ACCENT_BLUE,
    },
    stepNumberTertiary: {
        backgroundColor: ACCENT_GREEN,
    },
    stepNumberText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: TEXT,
    },
    stepDesc: {
        fontSize: 14,
        color: MUTED,
        marginTop: 2,
    },
    stepArrow: {
        fontSize: 24,
        color: MUTED,
        fontWeight: "300",
    },
    stepConnector: {
        width: 2,
        height: 12,
        backgroundColor: "#bfdbfe",
        marginLeft: 17,
    },
});
