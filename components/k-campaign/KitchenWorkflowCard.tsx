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
    AWAITING_COOKING_DISBURSEMENT: "Chờ giải ngân chi phí nấu và vận chuyển",
    COOKING: "Đang nấu ăn",
    AWAITING_DELIVERY_DISBURSEMENT: "Chờ cập nhật suất ăn",
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

        // Get plannedIngredients from chosen phase
        const chosenPhase = phases.find(p => p.id === selectedPhaseId);
        const plannedIngredients = chosenPhase?.plannedIngredients || [];

        router.push({
            pathname: "/ingredientRequestForm",
            params: {
                phases: JSON.stringify(phases),
                ingredientFundsAmount:
                    ingredientFundsAmount != null ? String(ingredientFundsAmount) : "",
                campaignPhaseId: selectedPhaseId,
                plannedIngredients: JSON.stringify(plannedIngredients),
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

        // Get plannedMeals from chosen phase
        const chosenPhase = phases.find(p => p.id === selectedPhaseId);
        const plannedMeals = chosenPhase?.plannedMeals || [];

        router.push({
            pathname: "/mealbatch",
            params: {
                campaignId: campaignId,
                campaignPhaseId: selectedPhaseId,
                campaignPhaseName: selectedPhaseName,
                plannedMeals: JSON.stringify(plannedMeals),
            },
        });
    };

    // Determine current workflow step based on phase status
    const getCurrentWorkflowStep = (status?: string | null): 1 | 2 | 3 => {
        if (!status) return 1;
        const s = status.toUpperCase().trim();

        // Step 3: Delivery related or cooking done
        if (
            s === "AWAITING_DELIVERY_DISBURSEMENT" ||
            s === "DELIVERY" ||
            s === "COMPLETED"
        ) {
            return 3;
        }

        // Step 2: Disbursement related
        if (
            s === "AWAITING_COOKING_DISBURSEMENT" ||
            s === "COOKING" ||
            s === "AWAITING_AUDIT"
        ) {
            return 2;
        }

        // Step 1: Ingredient related (default)
        return 1;
    };

    const currentWorkflowStep = getCurrentWorkflowStep(currentPhase?.status);

    // Get box style based on current workflow step
    const getCurrentPhaseBoxStyle = () => {
        switch (currentWorkflowStep) {
            case 3:
                return styles.currentPhaseBoxGreen;
            case 2:
                return styles.currentPhaseBoxBlue;
            default:
                return styles.currentPhaseBoxPrimary;
        }
    };

    return (
        <View style={styles.workflowCard}>
            <Text style={styles.workflowTitle}>Quy trình nấu ăn</Text>

            {/* Current Phase Info */}
            {currentPhase && (
                <View style={[styles.currentPhaseBox, getCurrentPhaseBoxStyle()]}>
                    <Text style={styles.currentPhaseLabel}>Giai đoạn hiện tại</Text>
                    <Text style={styles.currentPhaseName}>{currentPhase.phaseName}</Text>
                    <Text style={[
                        styles.currentPhaseStatus,
                        currentWorkflowStep === 3 && { color: ACCENT_GREEN },
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
                    style={[styles.workflowStep, styles.workflowStepBlue]}
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
                <TouchableOpacity style={[styles.workflowStep, styles.workflowStepGreen]} onPress={handleMealBatch}>
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
        backgroundColor: "#e5e7eb",
        marginLeft: 17,
    },
});
