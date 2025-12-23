import {
  BG_KITCHEN as BG,
  BORDER,
  CARD_BG,
  MUTED_TEXT,
  PRIMARY,
  STRONG_TEXT
} from "@/constants/colors";
import {
  getMealBatchStatusColors,
  getMealBatchStatusLabel
} from "@/constants/mealBatchStatus";
import MealBatchService from "@/services/mealBatchService";
import type { MealBatch } from "@/types/api/mealBatch";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  PixelRatio,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Base width for scaling (based on standard phone width ~375px)
const BASE_WIDTH = 375;

// Responsive scaling functions
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Normalize font size based on pixel ratio for consistency across devices
const normalizeFontSize = (size: number) => {
  const newSize = scale(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export default function MealBatchListPage() {
  const router = useRouter();
  const { campaignId, campaignPhaseId } = useLocalSearchParams<{
    campaignId?: string;
    campaignPhaseId?: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batches, setBatches] = useState<MealBatch[]>([]);
  const [search, setSearch] = useState("");
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const reload = useCallback(
    async (mountedCheck = true) => {
      if (!campaignId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await MealBatchService.getMealBatchesByCampaign(campaignId);
        if (!mountedCheck) return;
        const filtered = campaignPhaseId
          ? data.filter((b) => (b as any).campaignPhaseId === campaignPhaseId)
          : data;
        setBatches(filtered);
      } catch (e: any) {
        if (mountedCheck) setError(e?.message || "Không tải được danh sách suất ăn.");
      } finally {
        if (mountedCheck) setLoading(false);
      }
    },
    [campaignId, campaignPhaseId]
  );

  useEffect(() => {
    if (!campaignId) return;
    let mounted = true;
    reload(mounted);
    return () => {
      mounted = false;
    };
  }, [campaignId, campaignPhaseId, reload]);

  const handleUpdateStatus = (batch: MealBatch) => {
    Alert.alert(
      "Cập nhật trạng thái",
      `Đánh dấu mẻ "${batch.foodName}" đã sẵn sàng (READY)?`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              setLoadingUpdate(true);
              const updated = await MealBatchService.updateMealBatchStatusToReady(
                batch.id
              );
              // 🔁 Merge để không mất các field mà mutation không trả về
              setBatches((prev) =>
                prev.map((b) =>
                  b.id === updated.id
                    ? ({
                      ...b,
                      status: updated.status,
                      cookedDate: updated.cookedDate,
                      media: updated.media,
                    } as MealBatch)
                    : b
                )
              );
            } catch (e: any) {
              Alert.alert(
                "Lỗi",
                e?.message || "Không cập nhật được trạng thái suất ăn."
              );
            } finally {
              setLoadingUpdate(false);
            }
          },
        },
      ]
    );
  };

  const displayedBatches = useMemo(() => {
    if (!search.trim()) return batches;
    const q = search.trim().toLowerCase();
    return batches.filter((b) => b.foodName.toLowerCase().includes(q));
  }, [batches, search]);

  const renderItem = ({ item }: { item: MealBatch }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/mealbatchDetail",
          params: {
            mealBatchId: item.id,
            campaignId: campaignId || "",
          },
        })
      }
    >
      <View style={styles.card}>
        <View style={styles.cardRowTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.foodName} numberOfLines={1}>
                {item.foodName}
              </Text>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: getMealBatchStatusColors(item.status).bg },
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    { color: getMealBatchStatusColors(item.status).text },
                  ]}
                >
                  {getMealBatchStatusLabel(item.status)}
                </Text>
              </View>
            </View>

            <View style={styles.metaChipsRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Số lượng</Text>
                <Text style={styles.metaChipValue}>{item.quantity}</Text>
              </View>
              {item.cookedDate && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipLabel}>Ngày nấu</Text>
                  <Text style={styles.metaChipValue}>
                    {new Date(item.cookedDate).toLocaleString("vi-VN")}
                  </Text>
                </View>
              )}
            </View>

            {item.kitchenStaff && (
              <Text style={styles.metaText}>
                Bếp phụ trách:{" "}
                <Text style={styles.metaStrong}>{item.kitchenStaff.full_name}</Text>
              </Text>
            )}

            {/* Ingredient Usages */}
            {item.ingredientUsages && item.ingredientUsages.length > 0 && (
              <View style={styles.ingredientsSection}>
                <Text style={styles.ingredientsTitle}>Nguyên liệu:</Text>
                <View style={styles.ingredientsList}>
                  {item.ingredientUsages.map((usage, index) => (
                    <View key={index} style={styles.ingredientChip}>
                      <Text style={styles.ingredientName}>
                        {usage.ingredientItem?.ingredientName || "—"}
                      </Text>
                      <Text style={styles.ingredientQty}>
                        x{usage.ingredientItem?.quantity || 0}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardRowBottom}>
          <TouchableOpacity
            style={styles.updateBtn}
            onPress={() => handleUpdateStatus(item)}
          >
            <Text style={styles.updateBtnText}>Cập nhật trạng thái</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* header với background cong nhẹ giống các màn khác */}
      <View style={styles.headerBg} />
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.headerBackIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách suất ăn</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.body}>
        {/* search bar */}
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên suất ăn..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading && (
          <View style={{ marginTop: 16 }}>
            <ActivityIndicator color={PRIMARY} />
          </View>
        )}

        {loadingUpdate && !loading && (
          <View style={{ marginTop: 8 }}>
            <ActivityIndicator color={PRIMARY} />
            <Text style={{ marginTop: 4, fontSize: 12, color: MUTED_TEXT }}>
              Đang cập nhật trạng thái suất ăn...
            </Text>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && (
          <>
            {batches.length === 0 ? (
              <Text style={styles.emptyText}>
                Chưa có suất ăn nào cho chiến dịch này.
              </Text>
            ) : displayedBatches.length === 0 ? (
              <Text style={styles.emptyText}>
                Không tìm thấy suất ăn phù hợp với từ khóa.
              </Text>
            ) : (
              <FlatList
                data={displayedBatches}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(90),
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: moderateScale(22),
    borderBottomRightRadius: moderateScale(22),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "4%",
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(8),
  },
  headerBackBtn: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: "#fff2e8",
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  headerBackIcon: {
    color: PRIMARY,
    fontSize: normalizeFontSize(18),
    fontWeight: "800",
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: normalizeFontSize(17),
    fontWeight: "700",
    textAlign: "center",
  },

  body: {
    flex: 1,
    paddingHorizontal: "4%",
    paddingTop: moderateScale(10),
  },
  captionText: {
    fontSize: normalizeFontSize(12),
    color: MUTED_TEXT,
    marginBottom: moderateScale(10),
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(8),
    gap: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 999,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: BORDER,
    fontSize: normalizeFontSize(13),
    minHeight: moderateScale(40), // Ensure minimum touch target
  },
  searchCount: {
    fontSize: normalizeFontSize(11),
    color: MUTED_TEXT,
  },

  errorText: {
    marginTop: moderateScale(8),
    color: "#dc2626",
    fontSize: normalizeFontSize(12),
  },
  emptyText: {
    marginTop: moderateScale(14),
    color: MUTED_TEXT,
    fontSize: normalizeFontSize(12),
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    marginTop: moderateScale(10),
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardRowTop: {
    flexDirection: "row",
    marginBottom: moderateScale(8),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  foodName: {
    flex: 1,
    fontSize: normalizeFontSize(14),
    fontWeight: "700",
    color: STRONG_TEXT,
  },
  statusPill: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: normalizeFontSize(10),
    fontWeight: "700",
  },

  metaChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  metaChip: {
    flexShrink: 1,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: 999,
    backgroundColor: "#f9fafb",
  },
  metaChipLabel: {
    fontSize: normalizeFontSize(10),
    color: MUTED_TEXT,
  },
  metaChipValue: {
    fontSize: normalizeFontSize(11),
    color: STRONG_TEXT,
    fontWeight: "600",
  },

  metaText: {
    fontSize: normalizeFontSize(11),
    color: MUTED_TEXT,
    marginTop: moderateScale(2),
  },
  metaStrong: {
    color: STRONG_TEXT,
    fontWeight: "600",
  },

  cardRowBottom: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: moderateScale(6),
  },
  updateBtn: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: "#fff7ed",
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  updateBtnText: {
    fontSize: normalizeFontSize(11),
    fontWeight: "700",
    color: PRIMARY,
  },

  // Ingredients styles
  ingredientsSection: {
    marginTop: moderateScale(8),
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  ingredientsTitle: {
    fontSize: normalizeFontSize(11),
    color: MUTED_TEXT,
    marginBottom: moderateScale(6),
  },
  ingredientsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(6),
  },
  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    gap: moderateScale(4),
  },
  ingredientName: {
    fontSize: normalizeFontSize(11),
    color: "#166534",
    fontWeight: "500",
  },
  ingredientQty: {
    fontSize: normalizeFontSize(10),
    color: "#15803d",
    fontWeight: "700",
  },
});
