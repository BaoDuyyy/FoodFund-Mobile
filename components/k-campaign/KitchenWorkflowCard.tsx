import type { Phase } from "@/types/api/campaign";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PRIMARY = "#ad4e28";
const TEXT = "#111827";
const MUTED = "#6b7280";
const ACCENT_GREEN = "#16a34a";
const ACCENT_BLUE = "#2563eb";

// Map phase status code -> Vietnamese label
const phaseStatusLabels: Record<string, string> = {
    PLANNING: "Đang lên kế hoạch",
    AWAITING_INGREDIENT_DISBURSEMENT: "Chờ giải ngân nguyên liệu",
    INGREDIENT_PURCHASE: "Đang mua nguyên liệu",
    AWAITING_AUDIT: "Chờ kiểm tra chứng từ",
    AWAITING_COOKING_DISBURSEMENT: "Chờ giải ngân chi phí nấu ăn",
    COOKING: "Đang nấu ăn",
    AWAITING_DELIVERY_DISBURSEMENT: "Chờ giải ngân chi phí vận chuyển",
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

interface KitchenWorkflowCardProps {
    campaignId: string;
    phases: Phase[];
}

export default function KitchenWorkflowCard({
    campaignId,
    phases,
}: KitchenWorkflowCardProps) {
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
            .map((p) => ({ phase: p, date: parseDate(p.ingredientPurchaseDate) }))
            .filter((x) => x.date && x.date >= now)
            .sort((a, b) => a.date!.getTime() - b.date!.getTime());

        return futureOrToday[0]?.phase ?? phases[0];
    };

    const currentPhase = getCurrentPhase();

    const handleIngredientRequest = () => {
        let selectedPhaseId = "";
        let ingredientFundsAmount: number | string | null = null;

        if (phases.length > 0) {
            const now = new Date();
            const parseDate = (val: any) => {
                if (!val) return null;
                const d = new Date(val);
                return isNaN(d.getTime()) ? null : d;
            };
            const futureOrToday = phases
                .map((p) => ({ phase: p, date: parseDate(p.ingredientPurchaseDate) }))
                .filter((x) => x.date && x.date >= now)
                .sort((a, b) => a.date!.getTime() - b.date!.getTime());
            const chosen = futureOrToday[0]?.phase ?? phases[0];
            selectedPhaseId = chosen.id;
            ingredientFundsAmount = chosen.ingredientFundsAmount ?? null;
        }

        router.push({
            pathname: "/ingredientRequestForm",
            params: {
                phases: JSON.stringify(phases),
                ingredientFundsAmount:
                    ingredientFundsAmount != null ? String(ingredientFundsAmount) : "",
                campaignPhaseId: selectedPhaseId,
            },
        });
    };

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

    const handleMealBatch = () => {
        let selectedPhaseId = "";
        let selectedPhaseName = "";

        if (phases.length > 0) {
            const now = new Date();
            const parseDate = (val: any) => {
                if (!val) return null;
                const d = new Date(val);
                return isNaN(d.getTime()) ? null : d;
            };
            const futureOrToday = phases
                .map((p) => ({ phase: p, date: parseDate(p.ingredientPurchaseDate) }))
                .filter((x) => x.date && x.date >= now)
                .sort((a, b) => a.date!.getTime() - b.date!.getTime());
            const chosen = futureOrToday[0]?.phase ?? phases[0];
            selectedPhaseId = chosen.id;
            selectedPhaseName = chosen.phaseName ?? "";
        }

        router.push({
            pathname: "/mealbatch",
            params: {
                campaignId: campaignId,
                campaignPhaseId: selectedPhaseId,
                campaignPhaseName: selectedPhaseName,
            },
        });
    };

    return (
        <View style={styles.workflowCard}>
            <Text style={styles.workflowTitle}>Quy trình nấu ăn</Text>

            {/* Current Phase Info */}
            {currentPhase && (
                <View style={styles.currentPhaseBox}>
                    <Text style={styles.currentPhaseLabel}>Giai đoạn hiện tại</Text>
                    <Text style={styles.currentPhaseName}>{currentPhase.phaseName}</Text>
                    <Text style={styles.currentPhaseStatus}>
                        {getPhaseStatusLabel(currentPhase.status)}
                    </Text>
                </View>
            )}

            {/* Workflow Steps */}
            <View style={styles.workflowSteps}>
                {/* Step 1 */}
                <TouchableOpacity
                    style={styles.workflowStep}
                    onPress={handleIngredientRequest}
                >
                    <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Yêu cầu nguyên liệu</Text>
                        <Text style={styles.stepDesc}>Gửi danh sách nguyên liệu cần mua</Text>
                    </View>
                    <Text style={styles.stepArrow}>›</Text>
                </TouchableOpacity>

                <View style={styles.stepConnector} />

                {/* Step 2 */}
                <TouchableOpacity
                    style={styles.workflowStep}
                    onPress={handleDisbursement}
                >
                    <View style={[styles.stepNumber, styles.stepNumberSecondary]}>
                        <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Giải ngân</Text>
                        <Text style={styles.stepDesc}>Yêu cầu giải ngân chi phí</Text>
                    </View>
                    <Text style={styles.stepArrow}>›</Text>
                </TouchableOpacity>

                <View style={styles.stepConnector} />

                {/* Step 3 */}
                <TouchableOpacity style={styles.workflowStep} onPress={handleMealBatch}>
                    <View style={[styles.stepNumber, styles.stepNumberTertiary]}>
                        <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Cập nhật suất ăn</Text>
                        <Text style={styles.stepDesc}>Ghi nhận suất ăn đã nấu</Text>
                    </View>
                    <Text style={styles.stepArrow}>›</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    workflowCard: {
        backgroundColor: "#fff7ed",
        borderRadius: 18,
        padding: 18,
        marginTop: 16,
        borderWidth: 1,
        borderColor: "#fed7aa",
    },
    workflowTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: PRIMARY,
        marginBottom: 12,
    },
    currentPhaseBox: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#fde68a",
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
    workflowSteps: {
        gap: 0,
    },
    workflowStep: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#e5e7eb",
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
        backgroundColor: "#e5e7eb",
        marginLeft: 17,
    },
});
