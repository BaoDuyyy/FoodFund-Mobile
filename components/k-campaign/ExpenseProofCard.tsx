import type { ExpenseProof } from "@/types/api/expenseProof";
import React from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PRIMARY = "#ad4e28";
const TEXT = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const ACCENT_BLUE = "#2563eb";

interface ExpenseProofCardProps {
    expenseProofs: ExpenseProof[];
    loading: boolean;
    onImagePress: (url: string) => void;
}

export default function ExpenseProofCard({
    expenseProofs,
    loading,
    onImagePress,
}: ExpenseProofCardProps) {
    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Chứng từ chi tiêu</Text>

            {loading ? (
                <ActivityIndicator color={PRIMARY} size="small" style={{ marginTop: 8 }} />
            ) : expenseProofs.length === 0 ? (
                <Text style={styles.desc}>
                    Chưa có chứng từ chi tiêu nào cho chiến dịch này.
                </Text>
            ) : (
                expenseProofs.map((proof, idx) => (
                    <View
                        key={proof.id || `${proof.requestId}-${idx}`}
                        style={styles.expenseProofBlock}
                    >
                        <View style={styles.expenseHeaderRow}>
                            <Text style={styles.expenseProofTitle}>Chứng từ #{idx + 1}</Text>
                            <Text style={styles.expenseStatus}>{proof.status}</Text>
                        </View>
                        <Text style={styles.expenseProofAmount}>
                            Số tiền: {Number(proof.amount || 0).toLocaleString("vi-VN")} đ
                        </Text>
                        <Text style={styles.expenseProofMeta}>
                            Ngày tạo:{" "}
                            {proof.created_at
                                ? new Date(proof.created_at).toLocaleString("vi-VN")
                                : "—"}
                        </Text>

                        {Array.isArray(proof.media) && proof.media.length > 0 && (
                            <View style={styles.expenseProofImagesRow}>
                                {proof.media.map((url, i) => {
                                    if (typeof url !== "string") return null;
                                    const lower = url.toLowerCase();
                                    const isImage =
                                        lower.endsWith(".jpg") ||
                                        lower.endsWith(".jpeg") ||
                                        lower.endsWith(".png") ||
                                        lower.includes("image");
                                    if (!isImage) return null;

                                    return (
                                        <TouchableOpacity
                                            key={`${proof.id}-img-${i}`}
                                            activeOpacity={0.9}
                                            onPress={() => onImagePress(url)}
                                        >
                                            <Image
                                                source={{ uri: url }}
                                                style={styles.expenseProofImage}
                                                resizeMode="cover"
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {proof.adminNote ? (
                            <Text style={styles.expenseProofNote}>
                                Ghi chú: {proof.adminNote}
                            </Text>
                        ) : null}
                    </View>
                ))
            )}
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
    desc: {
        fontSize: 15,
        color: TEXT,
        lineHeight: 22,
    },
    expenseProofBlock: {
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#ffe7d6",
    },
    expenseHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    expenseProofTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: PRIMARY,
    },
    expenseStatus: {
        fontSize: 11,
        fontWeight: "600",
        color: ACCENT_BLUE,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: "#dbeafe",
    },
    expenseProofAmount: {
        fontSize: 13,
        fontWeight: "700",
        color: TEXT,
        marginTop: 2,
    },
    expenseProofMeta: {
        fontSize: 12,
        color: MUTED,
        marginTop: 1,
    },
    expenseProofNote: {
        fontSize: 12,
        color: "#b45309",
        marginTop: 4,
    },
    expenseProofImagesRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 6,
        gap: 6,
    },
    expenseProofImage: {
        width: 72,
        height: 72,
        borderRadius: 10,
        backgroundColor: "#e5e7eb",
    },
});
