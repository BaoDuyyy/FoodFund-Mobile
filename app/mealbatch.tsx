import IngredientService, {
    MyIngredientRequest,
    MyIngredientRequestItem,
} from "@/services/ingredientService";
import MealBatchService from "@/services/mealBatchService";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Palette tươi sáng, phù hợp app thiện nguyện
const PRIMARY = "#ad4e28";       // Cam ấm cho CTA
const PRIMARY_DARK = "#ad4e28";
const BG = "#f5f7fb";            // Nền chung rất nhẹ
const CARD_BG = "#ffffff";       // Nền thẻ
const ACCENT_GREEN = "#45b69c";  // Xanh lá dịu
const ACCENT_BLUE = "#4f8cff";   // Xanh dương info
const MUTED_TEXT = "#6b7280";    // Xám chữ phụ
const STRONG_TEXT = "#111827";   // Xám đậm
const BORDER = "#e5e7eb";
const DANGER = "#ef4444";

type CampaignPhase = {
    id: string;
    name: string;
};

type SelectedFile = {
    uri: string;
    type: "jpg" | "png" | "mp4"; // giống bên expenseProof (dùng cho service)
    name: string;
};

export default function MealBatchPage() {
    const router = useRouter();
    const { campaignId, campaignPhaseId, campaignPhaseName } =
        useLocalSearchParams<{
            campaignId?: string;
            campaignPhaseId?: string;
            campaignPhaseName?: string;
        }>();

    const [loadingRequests, setLoadingRequests] = useState(false);
    const [loadingCreate, setLoadingCreate] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requests, setRequests] = useState<MyIngredientRequest[]>([]);
    const [phases, setPhases] = useState<CampaignPhase[]>([]);
    const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

    const [foodName, setFoodName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [selectedIngredientIds, setSelectedIngredientIds] = useState<
        Set<string>
    >(new Set());
    const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

    // Lấy ingredient requests
    useEffect(() => {
        let mounted = true;
        const fetchReqs = async () => {
            setLoadingRequests(true);
            setError(null);
            try {
                const data = await IngredientService.getMyIngredientRequests();
                if (mounted) setRequests(data);
            } catch (e: any) {
                if (mounted) setError(e?.message || "Có lỗi xảy ra");
            } finally {
                if (mounted) setLoadingRequests(false);
            }
        };
        fetchReqs();
        return () => {
            mounted = false;
        };
    }, []);

    // Lấy phase từ params: chỉ hiển thị phaseName, dùng id khi gửi query
    useEffect(() => {
        if (!campaignId || !campaignPhaseId) return;
        let mounted = true;
        const initPhases = () => {
            const phase: CampaignPhase = {
                id: campaignPhaseId,
                name: campaignPhaseName || "Giai đoạn chiến dịch",
            };
            if (mounted) {
                setPhases([phase]);
                setSelectedPhaseId(phase.id);
            }
        };
        initPhases();
        return () => {
            mounted = false;
        };
    }, [campaignId, campaignPhaseId, campaignPhaseName]);

    const currentItems: MyIngredientRequestItem[] = useMemo(
        () => requests[0]?.items || [],
        [requests]
    );

    const toggleIngredient = (id: string) => {
        setSelectedIngredientIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const detectTypeFromUri = (uri: string): SelectedFile["type"] => {
        const lower = uri.toLowerCase();
        if (lower.endsWith(".png")) return "png";
        if (lower.endsWith(".mp4")) return "mp4";
        return "jpg";
    };

    const handlePickFiles = async () => {
        try {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
                Alert.alert(
                    "Quyền truy cập",
                    "Ứng dụng cần quyền truy cập thư viện để chọn ảnh / video."
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsMultipleSelection: true,
                quality: 0.8,
            });

            if (result.canceled) return;

            const assets = result.assets.slice(0, 5);
            const files: SelectedFile[] = assets.map((asset) => ({
                uri: asset.uri,
                type: detectTypeFromUri(asset.fileName || asset.uri),
                name: asset.fileName || asset.uri.split("/").pop() || "file",
            }));

            setSelectedFiles(files);
        } catch (err: any) {
            console.error("pick files error:", err);
            Alert.alert("Lỗi", "Không chọn được file, vui lòng thử lại.");
        }
    };

    const onCreateMealBatch = async () => {
        if (!selectedPhaseId) {
            Alert.alert("Thiếu thông tin", "Vui lòng chọn phase của chiến dịch.");
            return;
        }
        if (!foodName.trim()) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập tên suất ăn.");
            return;
        }
        const qtyNum = Number(quantity);
        if (!qtyNum || qtyNum <= 0) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập số lượng hợp lệ.");
            return;
        }
        if (selectedIngredientIds.size === 0) {
            Alert.alert(
                "Thiếu nguyên liệu",
                "Vui lòng chọn ít nhất một nguyên liệu từ danh sách."
            );
            return;
        }

        try {
            setLoadingCreate(true);
            await MealBatchService.createMealBatchWithMedia({
                campaignPhaseId: selectedPhaseId!,
                foodName: foodName.trim(),
                quantity: qtyNum,
                ingredientIds: Array.from(selectedIngredientIds),
                files: selectedFiles.map((f) => ({
                    uri: f.uri,
                    // map sang mime type giống bên expenseProof
                    type:
                        f.type === "mp4"
                            ? "video/mp4"
                            : f.type === "png"
                                ? "image/png"
                                : "image/jpeg",
                    name: f.name,
                })),
            });

            Alert.alert("Thành công", "Đã tạo suất ăn.", [
                {
                    text: "OK",
                    onPress: () => {
                        router.back();
                    },
                },
            ]);
        } catch (e: any) {
            Alert.alert(
                "Lỗi",
                e?.message || "Không thể tạo suất ăn, vui lòng thử lại sau."
            );
        } finally {
            setLoadingCreate(false);
        }
    };

    const renderIngredientItem = ({ item }: { item: MyIngredientRequestItem }) => {
        const selected = selectedIngredientIds.has(item.id);
        return (
            <TouchableOpacity
                onPress={() => toggleIngredient(item.id)}
                style={[
                    styles.itemRow,
                    selected && styles.itemRowSelected,
                ]}
            >
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.ingredientName}</Text>
                    <Text style={styles.itemQuantity}>{item.quantity}</Text>
                </View>
                <View style={styles.itemRight}>
                    <Text style={styles.itemPrice}>
                        {item.estimatedTotalPrice.toLocaleString("vi-VN")} đ
                    </Text>
                    {selected && (
                        <View style={styles.selectedBadge}>
                            <Text style={styles.selectedBadgeText}>Đã chọn</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header có gradient nhẹ */}
            <View style={styles.headerWrapper}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.headerBackBtn}
                    >
                        <Text style={styles.headerBackText}>‹</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTextWrapper}>
                        <Text style={styles.headerTitle}>Cập nhật suất ăn</Text>
                        <Text style={styles.headerSubtitle}>
                            Gắn kết yêu thương qua từng phần ăn
                        </Text>
                    </View>
                    <View style={{ width: 32 }} />
                </View>

                {/* Info chips trên header */}
                <View style={styles.headerChipsRow}>
                    <View style={[styles.chip, { backgroundColor: "#fef3c7" }]}>
                        <View style={styles.chipDot} />
                        <Text style={styles.chipText} numberOfLines={1}>
                            Chiến dịch: {campaignId || "Không xác định"}
                        </Text>
                    </View>
                    <View style={[styles.chip, { backgroundColor: "#e0f2fe" }]}>
                        <View
                            style={[styles.chipDot, { backgroundColor: ACCENT_BLUE }]}
                        />
                        <Text style={styles.chipText}>
                            Bước: Tạo suất ăn
                        </Text>
                    </View>
                </View>
            </View>

            {/* BODY + FOOTER FIXED */}
            <View style={styles.contentWrapper}>
                <ScrollView
                    style={styles.body}
                    contentContainerStyle={{ paddingBottom: 32 }}
                >
                    {/* Card Phase */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Giai đoạn chiến dịch</Text>
                        <Text style={styles.sectionDescription}>
                            Chọn phase tương ứng để hệ thống gắn suất ăn với đúng tiến độ.
                        </Text>

                        {phases.length === 0 ? (
                            <Text style={styles.emptyText}>Chưa có phase nào.</Text>
                        ) : (
                            <View style={{ marginTop: 10 }}>
                                {phases.map((phase) => {
                                    const active = phase.id === selectedPhaseId;
                                    return (
                                        <TouchableOpacity
                                            key={phase.id}
                                            onPress={() => setSelectedPhaseId(phase.id)}
                                            style={[
                                                styles.phaseItem,
                                                active && styles.phaseItemActive,
                                            ]}
                                        >
                                            <View style={styles.phaseLeft}>
                                                <View
                                                    style={[
                                                        styles.phaseDot,
                                                        active && { backgroundColor: PRIMARY },
                                                    ]}
                                                />
                                                <Text
                                                    style={[
                                                        styles.phaseName,
                                                        active && { color: PRIMARY_DARK },
                                                    ]}
                                                >
                                                    {phase.name}
                                                </Text>
                                            </View>
                                            {active && (
                                                <Text style={styles.phaseTag}>Đang chọn</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* Card Form */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Thông tin suất ăn</Text>
                        <Text style={styles.sectionDescription}>
                            Thông tin này sẽ hiển thị trong báo cáo minh bạch tới nhà tài trợ.
                        </Text>

                        <View style={{ marginTop: 14 }}>
                            <Text style={styles.label}>
                                Tên suất ăn <Text style={styles.labelRequired}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={foodName}
                                onChangeText={setFoodName}
                                placeholder="Ví dụ: Cơm gà từ thiện"
                                placeholderTextColor={MUTED_TEXT}
                            />
                        </View>

                        <View style={{ marginTop: 12 }}>
                            <Text style={styles.label}>
                                Số lượng suất ăn <Text style={styles.labelRequired}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={quantity}
                                onChangeText={setQuantity}
                                keyboardType="number-pad"
                                placeholder="Ví dụ: 100"
                                placeholderTextColor={MUTED_TEXT}
                            />
                            <Text style={styles.helperText}>
                                Con số này sẽ hỗ trợ thống kê chi phí trên mỗi suất ăn.
                            </Text>
                        </View>

                        {/* Upload media giống expenseProof */}
                        <View style={{ marginTop: 16 }}>
                            <Text style={styles.label}>Hình ảnh / video minh chứng</Text>
                            <TouchableOpacity
                                style={styles.pickBtn}
                                onPress={handlePickFiles}
                            >
                                <Text style={styles.pickBtnText}>
                                    Chọn ảnh / video từ thiết bị
                                </Text>
                            </TouchableOpacity>

                            {selectedFiles.length > 0 ? (
                                <View style={{ marginTop: 8 }}>
                                    {selectedFiles.map((f, idx) => (
                                        <View key={idx} style={styles.fileChip}>
                                            <Text style={styles.fileChipIndex}>#{idx + 1}</Text>
                                            <Text style={styles.fileChipName} numberOfLines={1}>
                                                {f.name}
                                            </Text>
                                            <Text style={styles.fileChipType}>
                                                {f.type.toUpperCase()}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Text style={styles.uploadText}>
                                        Chưa chọn file nào. Bạn có thể thêm ảnh / video nấu ăn để
                                        minh chứng cho mẻ suất ăn này.
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Card nguyên liệu */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.sectionTitle}>Nguyên liệu đã được duyệt</Text>
                            <Text style={styles.sectionDescription}>
                                Chọn những nguyên liệu đã sử dụng cho mẻ suất ăn này.
                            </Text>
                        </View>

                        {/* pill nổi ở góc trên-phải */}
                        <View style={styles.badgeCount}>
                            <Text style={styles.badgeCountText}>
                                {selectedIngredientIds.size} đã chọn
                            </Text>
                        </View>

                        {loadingRequests && (
                            <View style={{ marginTop: 12 }}>
                                <ActivityIndicator color={PRIMARY} />
                            </View>
                        )}

                        {error && <Text style={styles.errorText}>{error}</Text>}

                        {!loadingRequests && !error && (
                            <>
                                {currentItems.length === 0 ? (
                                    <Text style={styles.emptyText}>
                                        Chưa có yêu cầu nguyên liệu nào.
                                    </Text>
                                ) : (
                                    <FlatList
                                        scrollEnabled={false}
                                        data={currentItems}
                                        keyExtractor={(item) => item.id}
                                        renderItem={renderIngredientItem}
                                        contentContainerStyle={{ paddingTop: 8 }}
                                    />
                                )}
                            </>
                        )}
                    </View>
                </ScrollView>

                {/* Footer: nút tạo + xem danh sách suất ăn (cố định đáy) */}
                <View style={styles.footerActions}>
                    <TouchableOpacity
                        style={[styles.submitBtn, loadingCreate && { opacity: 0.7 }]}
                        onPress={onCreateMealBatch}
                        disabled={loadingCreate}
                    >
                        {loadingCreate ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>Tạo suất ăn</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() =>
                            router.push({
                                pathname: "/mealbatchList",
                                params: {
                                    campaignId: campaignId || "",
                                    campaignPhaseId: campaignPhaseId || "",
                                },
                            })
                        }
                    >
                        <Text style={styles.secondaryBtnText}>
                            Xem danh sách suất ăn
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },

    // HEADER
    headerWrapper: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 8,
        backgroundColor: "#fff7ed", // cam rất nhạt
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: BORDER,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerBackBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#fed7aa",
        alignItems: "center",
        justifyContent: "center",
    },
    headerBackText: {
        color: PRIMARY_DARK,
        fontSize: 20,
        fontWeight: "800",
        marginTop: -2,
    },
    headerTextWrapper: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        color: STRONG_TEXT,
        fontSize: 18,
        fontWeight: "700",
    },
    headerSubtitle: {
        marginTop: 2,
        color: MUTED_TEXT,
        fontSize: 12,
    },
    headerChipsRow: {
        flexDirection: "row",
        marginTop: 12,
        gap: 8,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    chipDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: PRIMARY,
        marginRight: 6,
    },
    chipText: {
        fontSize: 11,
        color: STRONG_TEXT,
        maxWidth: 220,
    },

    // BODY
    body: {
        paddingHorizontal: 16,
        flex: 1,
    },

    // 👉 bọc body + footer để footer cố định ở đáy
    contentWrapper: {
        flex: 1,
        paddingBottom: 0,
    },

    // CARD
    card: {
        position: "relative",            // ✨ để đặt badge absolute
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 14,
        marginTop: 14,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    cardHeaderRow: {
        // không cần space-between nữa
        alignItems: "flex-start",
    },

    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: STRONG_TEXT,
    },
    sectionDescription: {
        marginTop: 4,
        fontSize: 12,
        color: MUTED_TEXT,
    },

    label: {
        fontSize: 13,
        fontWeight: "600",
        color: STRONG_TEXT,
    },
    labelRequired: {
        color: DANGER,
    },
    helperText: {
        marginTop: 4,
        fontSize: 11,
        color: MUTED_TEXT,
    },

    input: {
        marginTop: 6,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 9,
        backgroundColor: "#f9fafb",
        fontSize: 14,
        color: STRONG_TEXT,
    },

    uploadPlaceholder: {
        // giữ lại block cũ nếu có, hoặc dùng lại style đã có
        marginTop: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "#cbd5f5",
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#eff6ff",
    },
    uploadText: {
        fontSize: 11,
        color: ACCENT_BLUE,
    },
    pickBtn: {
        marginTop: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: PRIMARY,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    pickBtnText: {
        color: PRIMARY,
        fontWeight: "700",
        fontSize: 14,
    },
    fileChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff7ed",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 6,
    },
    fileChipIndex: {
        fontWeight: "700",
        color: PRIMARY,
        marginRight: 6,
    },
    fileChipName: {
        flex: 1,
        fontSize: 12,
        color: STRONG_TEXT,
    },
    fileChipType: {
        marginLeft: 8,
        fontSize: 11,
        fontWeight: "600",
        color: PRIMARY,
    },

    // INGREDIENTS
    emptyText: {
        marginTop: 10,
        color: MUTED_TEXT,
        fontSize: 12,
    },
    errorText: {
        marginTop: 8,
        color: DANGER,
        fontSize: 12,
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: BORDER,
    },
    itemRowSelected: {
        backgroundColor: "#f0fdf4",
        borderRadius: 10,
        marginHorizontal: -8,
        paddingHorizontal: 8,
    },
    itemName: {
        fontSize: 14,
        color: STRONG_TEXT,
        fontWeight: "600",
    },
    itemQuantity: {
        fontSize: 12,
        color: MUTED_TEXT,
        marginTop: 3,
    },
    itemRight: {
        alignItems: "flex-end",
        gap: 4,
    },
    itemPrice: {
        fontSize: 13,
        color: ACCENT_GREEN,
        fontWeight: "600",
    },
    selectedBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: "#bbf7d0",
    },
    selectedBadgeText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#166534",
    },

    badgeCount: {
        position: "absolute",
        top: 10,
        right: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "#e0f2fe",
    },
    badgeCountText: {
        fontSize: 11,
        color: "#4f8cff",
        fontWeight: "600",
    },

    // PHASE
    phaseItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "#f9fafb",
        marginBottom: 8,
    },
    phaseItemActive: {
        borderColor: PRIMARY,
        backgroundColor: "#fff7ed",
    },
    phaseLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    phaseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: MUTED_TEXT,
    },
    phaseName: {
        fontSize: 14,
        color: STRONG_TEXT,
    },
    phaseTag: {
        fontSize: 11,
        fontWeight: "600",
        color: PRIMARY_DARK,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: "#fed7aa",
    },

    // SUBMIT
    submitBtn: {
        borderRadius: 999,
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: PRIMARY,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: PRIMARY_DARK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 3,
    },
    submitText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },

    // 👇 footer cố định đáy (2 nút)
    footerActions: {
        flexDirection: "column",
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 12,
        backgroundColor: "#ffffff",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: BORDER,
    },

    // 👇 nút phụ xem danh sách suất ăn
    secondaryBtn: {
        borderRadius: 999,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: PRIMARY,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    secondaryBtnText: {
        color: PRIMARY,
        fontSize: 14,
        fontWeight: "700",
    },
});
