import { BG_WARM as BG, PRIMARY } from "@/constants/colors";
import IngredientService from "@/services/ingredientService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StatusFilter = "ALL" | "PENDING" | "ACCEPTED" | "REJECTED" | "DISBURSED";
type SortOrder = "OLDEST_FIRST" | "NEWEST_FIRST";

const STATUS_FILTER_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ duyệt" },
  { key: "ACCEPTED", label: "Đã duyệt" },
  { key: "REJECTED", label: "Từ chối" },
  { key: "DISBURSED", label: "Đã giải ngân" },
];

const SORT_OPTIONS: { key: SortOrder; label: string }[] = [
  { key: "OLDEST_FIRST", label: "Cũ nhất" },
  { key: "NEWEST_FIRST", label: "Mới nhất" },
];

export default function IngredientRequestPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("OLDEST_FIRST");

  const router = useRouter();
  const params = useLocalSearchParams<{ campaignPhaseId?: string }>();

  const campaignPhaseId =
    typeof params.campaignPhaseId === "string"
      ? params.campaignPhaseId
      : Array.isArray(params.campaignPhaseId)
        ? params.campaignPhaseId[0]
        : "";

  console.log("[ingredientRequest] campaignPhaseId =", campaignPhaseId);

  useEffect(() => {
    let mounted = true;

    if (!campaignPhaseId) {
      setRequests([]);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);

        const filter: any = {
          campaignPhaseId,
          sortBy: sortOrder,
        };
        if (statusFilter !== "ALL") {
          filter.status = statusFilter;
        }

        const data = await IngredientService.getIngredientRequests({
          filter,
          limit: 10,
          offset: 0,
        });

        if (mounted) setRequests(data || []);
      } catch (err) {
        console.error("Error loading ingredient requests:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [campaignPhaseId, statusFilter, sortOrder]);

  const formatCurrency = (v?: number | string | null) => {
    const n = Number(v || 0);
    if (Number.isNaN(n)) return "0 đ";
    return n.toLocaleString("vi-VN") + " đ";
  };

  const renderStatusChip = (status?: string) => {
    if (!status) return null;
    const s = String(status).toUpperCase();
    let color = "#999";
    let bg = "#f2f2f2";

    if (s === "PENDING") {
      color = "#b26a00";
      bg = "#fff4e0";
    } else if (s === "ACCEPTED") {
      color = "#1b873f";
      bg = "#e5f7ec";
    } else if (s === "REJECTED") {
      color = "#c82333";
      bg = "#ffe5e5";
    } else if (s === "DISBURSED") {
      color = "#0f766e";
      bg = "#ccfbf1";
    }

    return (
      <View style={[styles.statusChip, { backgroundColor: bg }]}>
        <Text style={[styles.statusChipText, { color }]}>{s}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header với nền cong nhẹ */}
      <View style={styles.headerBg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Yêu cầu nguyên liệu</Text>
        <Text style={styles.subtitle}>
          Xem lại các yêu cầu nguyên liệu đã gửi cho từng giai đoạn.
        </Text>
      </View>

      {/* FILTER BAR */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.filterChip,
                statusFilter === opt.key && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter(opt.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === opt.key && styles.filterChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sortGroup}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.sortChip,
                sortOrder === opt.key && styles.sortChipActive,
              ]}
              onPress={() => setSortOrder(opt.key)}
            >
              <Text
                style={[
                  styles.sortChipText,
                  sortOrder === opt.key && styles.sortChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={PRIMARY} size="large" />
          <Text style={styles.loadingText}>Đang tải danh sách yêu cầu...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/expenseProof",
                  params: {
                    requestId: item.id,
                    totalCost: String(item.totalCost ?? ""),
                  },
                })
              }
              activeOpacity={0.9}
            >
              <View style={styles.card}>
                {/* Header card */}
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      Yêu cầu #{item.shortCode || item.id?.slice(0, 8) || "—"}
                    </Text>
                    <Text style={styles.cardMeta}>
                      Ngày tạo:{" "}
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString("vi-VN")
                        : "—"}
                    </Text>
                  </View>
                  {renderStatusChip(item.status)}
                </View>

                {/* Tổng tiền */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tổng chi phí dự kiến</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(item.totalCost)}
                  </Text>
                </View>

                {/* Danh sách nguyên liệu */}
                <View style={styles.divider} />
                <Text style={styles.cardSectionTitle}>Danh sách nguyên liệu</Text>
                {Array.isArray(item.items) && item.items.length > 0 ? (
                  item.items.map((ing: any) => (
                    <View key={ing.id} style={styles.ingredientRow}>
                      <View style={styles.ingredientBullet} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ingredientName}>
                          {ing.ingredientName}
                        </Text>
                        <Text style={styles.ingredientDetail}>
                          Số lượng: {ing.quantity} • Thành tiền ước tính:{" "}
                          {formatCurrency(ing.estimatedTotalPrice)}
                        </Text>
                        {ing.supplier ? (
                          <Text style={styles.ingredientSupplier}>
                            Nhà cung cấp: {ing.supplier}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyItemsText}>
                    Không có nguyên liệu nào trong yêu cầu này.
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>♡</Text>
              <Text style={styles.emptyTitle}>
                Bạn chưa có yêu cầu nguyên liệu nào
              </Text>
              <Text style={styles.emptyDesc}>
                Hãy tạo yêu cầu đầu tiên cho giai đoạn nấu ăn của bạn.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.back()}
              >
                <Text style={styles.emptyBtnText}>Tạo yêu cầu nguyên liệu</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Nút dưới cùng */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.actionBtnText}>Tạo yêu cầu nguyên liệu mới</Text>
        </TouchableOpacity>
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
    height: 130,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  backIcon: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginRight: 4,
  },
  backText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#ffe8d4",
    marginTop: 4,
  },

  /* FILTER BAR */
  filterBar: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  filterScrollContent: {
    paddingRight: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: "#f3e1d6",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  filterChipText: {
    fontSize: 14,
    color: "#7c6a5a",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  sortGroup: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: "#f3e1d6",
    backgroundColor: "#fff",
  },
  sortChipActive: {
    backgroundColor: "#fff5ee",
    borderColor: PRIMARY,
  },
  sortChipText: {
    fontSize: 14,
    color: "#7c6a5a",
    fontWeight: "600",
  },
  sortChipTextActive: {
    color: PRIMARY,
  },

  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 15,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 100,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 17,
    color: PRIMARY,
  },
  cardMeta: {
    fontSize: 13,
    color: "#777",
    marginTop: 3,
  },

  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "700",
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: PRIMARY,
  },

  divider: {
    height: 1,
    backgroundColor: "#f1e4dd",
    marginVertical: 10,
  },

  cardSectionTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: PRIMARY,
    marginBottom: 8,
  },

  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ingredientBullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: PRIMARY,
    marginTop: 7,
    marginRight: 10,
  },
  ingredientName: {
    fontWeight: "600",
    color: "#222",
    fontSize: 14,
  },
  ingredientDetail: {
    color: "#777",
    fontSize: 13,
    marginTop: 3,
  },
  ingredientSupplier: {
    color: "#999",
    fontSize: 13,
    marginTop: 2,
  },
  emptyItemsText: {
    fontSize: 13,
    color: "#999",
  },

  emptyBox: {
    flex: 1,
    alignItems: "center",
    marginTop: 70,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 42,
    color: "#e0c4b0",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY,
    marginBottom: 6,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  buttonRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 18,
    backgroundColor: BG,
  },
  actionBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
