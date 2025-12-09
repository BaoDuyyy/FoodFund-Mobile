import {
  BG,
  BORDER,
  CARD_BG,
  MUTED_TEXT,
  PRIMARY,
  INFO as STATUS_DELIVERED,
  ACCENT as STATUS_PREPARING,
  SUCCESS as STATUS_READY,
  STRONG_TEXT,
} from "@/constants/colors";
import MealBatchService from "@/services/mealBatchService";
import type { MealBatch } from "@/types/api/mealBatch";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const getStatusColor = (status?: string | null) => {
    if (!status) return MUTED_TEXT;
    const s = status.toUpperCase();
    if (s === "READY") return STATUS_READY;
    if (s === "PREPARING") return STATUS_PREPARING;
    if (s === "DELIVERED") return STATUS_DELIVERED;
    return PRIMARY;
  };

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
                  { borderColor: getStatusColor(item.status) },
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {item.status}
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
    height: 100,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff2e8",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackIcon: {
    color: PRIMARY,
    fontSize: 20,
    fontWeight: "800",
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  captionText: {
    fontSize: 13,
    color: MUTED_TEXT,
    marginBottom: 10,
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BORDER,
    fontSize: 14,
  },
  searchCount: {
    fontSize: 12,
    color: MUTED_TEXT,
  },

  errorText: {
    marginTop: 8,
    color: "#dc2626",
    fontSize: 13,
  },
  emptyText: {
    marginTop: 16,
    color: MUTED_TEXT,
    fontSize: 13,
  },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
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
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  foodName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: STRONG_TEXT,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#fefce8",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },

  metaChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  metaChip: {
    flexShrink: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f9fafb",
  },
  metaChipLabel: {
    fontSize: 11,
    color: MUTED_TEXT,
  },
  metaChipValue: {
    fontSize: 12,
    color: STRONG_TEXT,
    fontWeight: "600",
  },

  metaText: {
    fontSize: 12,
    color: MUTED_TEXT,
    marginTop: 2,
  },
  metaStrong: {
    color: STRONG_TEXT,
    fontWeight: "600",
  },

  cardRowBottom: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  updateBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: "#fff7ed",
  },
  updateBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY,
  },
});
