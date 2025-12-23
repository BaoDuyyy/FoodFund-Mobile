import Loading from "@/components/Loading";
import { ACCENT_ORANGE, BG_KITCHEN as BG, PRIMARY } from "@/constants/colors";
import {
  INGREDIENT_REQUEST_STATUS_FILTER_OPTIONS,
  getIngredientRequestStatusColors,
  getIngredientRequestStatusLabel,
  type IngredientRequestStatusFilter
} from "@/constants/ingredientRequestStatus";
import IngredientService from "@/services/ingredientService";
import type { IngredientRequestListItem, IngredientRequestListResponse } from "@/types/api/ingredientRequest";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  PixelRatio,
  ScrollView,
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

type SortOrder = "OLDEST_FIRST" | "NEWEST_FIRST";

const SORT_OPTIONS: { key: SortOrder; label: string }[] = [
  { key: "OLDEST_FIRST", label: "Cũ nhất" },
  { key: "NEWEST_FIRST", label: "Mới nhất" },
];

export default function IngredientRequestPage() {
  const [requests, setRequests] = useState<IngredientRequestListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<IngredientRequestStatusFilter>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("OLDEST_FIRST");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const params = useLocalSearchParams<{ campaignPhaseId?: string }>();

  const campaignPhaseId =
    typeof params.campaignPhaseId === "string"
      ? params.campaignPhaseId
      : Array.isArray(params.campaignPhaseId)
        ? params.campaignPhaseId[0]
        : "";

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
        // Error loading ingredient requests
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [campaignPhaseId, statusFilter, sortOrder]);

  // Filter requests by search query (searches in ingredient names)
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const query = searchQuery.toLowerCase().trim();
    return requests.filter((req) => {
      // Search in items' ingredientName
      if (Array.isArray(req.items)) {
        return req.items.some((item) =>
          item.ingredientName.toLowerCase().includes(query)
        );
      }
      return false;
    });
  }, [requests, searchQuery]);

  const formatCurrency = (v?: number | string | null) => {
    const n = Number(v || 0);
    if (Number.isNaN(n)) return "0 đ";
    return n.toLocaleString("vi-VN") + " đ";
  };

  const renderStatusChip = (status?: string) => {
    if (!status) return null;
    const colors = getIngredientRequestStatusColors(status);
    const label = getIngredientRequestStatusLabel(status);

    return (
      <View style={[styles.statusChip, { backgroundColor: colors.bg }]}>
        <Text style={[styles.statusChipText, { color: colors.text }]}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: IngredientRequestListResponse }) => (
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
              Yêu cầu #{item.id?.slice(0, 8) || "—"}
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
          item.items.map((ing: IngredientRequestListItem) => (
            <View key={ing.id} style={styles.ingredientRow}>
              <View style={styles.ingredientBullet} />
              <View style={{ flex: 1 }}>
                <Text style={styles.ingredientName}>
                  {ing.ingredientName}
                </Text>
                <Text style={styles.ingredientDetail}>
                  Số lượng: {ing.quantity} {ing.unit} • Thành tiền:{" "}
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
  );

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

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm nguyên liệu..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FILTER BAR */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {INGREDIENT_REQUEST_STATUS_FILTER_OPTIONS.map((opt) => (
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
        <Loading visible={loading} message="Đang tải danh sách yêu cầu..." />
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>♡</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery
                  ? "Không tìm thấy nguyên liệu phù hợp"
                  : "Bạn chưa có yêu cầu nguyên liệu nào"}
              </Text>
              <Text style={styles.emptyDesc}>
                {searchQuery
                  ? "Thử tìm kiếm với từ khóa khác."
                  : "Hãy tạo yêu cầu đầu tiên cho giai đoạn nấu ăn của bạn."}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => router.back()}
                >
                  <Text style={styles.emptyBtnText}>Tạo yêu cầu nguyên liệu</Text>
                </TouchableOpacity>
              )}
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
    height: moderateScale(120),
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
  },
  header: {
    paddingHorizontal: "4%",
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(6),
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  backIcon: {
    color: "#fff",
    fontSize: normalizeFontSize(20),
    fontWeight: "700",
    marginRight: moderateScale(4),
  },
  backText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: normalizeFontSize(14),
  },
  title: {
    fontSize: normalizeFontSize(22),
    fontWeight: "800",
    color: "#fff",
    marginTop: moderateScale(4),
  },
  subtitle: {
    fontSize: normalizeFontSize(13),
    color: "#ffe8d4",
    marginTop: moderateScale(4),
  },

  /* SEARCH BAR */
  searchContainer: {
    paddingHorizontal: "4%",
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(4),
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: "#f3e1d6",
    minHeight: moderateScale(42), // Ensure minimum touch target
  },
  searchIcon: {
    marginRight: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: normalizeFontSize(13),
    color: "#222",
    padding: 0,
  },

  /* FILTER BAR */
  filterBar: {
    paddingHorizontal: "4%",
    paddingTop: moderateScale(6),
    paddingBottom: moderateScale(10),
  },
  filterScrollContent: {
    paddingRight: moderateScale(10),
  },
  filterChip: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: "#f3e1d6",
    backgroundColor: "#fff",
    marginRight: moderateScale(8),
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  filterChipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  filterChipText: {
    fontSize: normalizeFontSize(13),
    color: "#7c6a5a",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  sortGroup: {
    flexDirection: "row",
    marginTop: moderateScale(10),
    gap: moderateScale(10),
  },
  sortChip: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: "#f3e1d6",
    backgroundColor: "#fff",
    minHeight: moderateScale(32), // Ensure minimum touch target
  },
  sortChipActive: {
    backgroundColor: "#fff5ee",
    borderColor: PRIMARY,
  },
  sortChipText: {
    fontSize: normalizeFontSize(13),
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
    marginTop: moderateScale(10),
    color: "#666",
    fontSize: normalizeFontSize(14),
  },

  listContent: {
    paddingHorizontal: "4%",
    paddingTop: moderateScale(4),
    paddingBottom: moderateScale(90),
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginTop: moderateScale(10),
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
    marginBottom: moderateScale(10),
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: normalizeFontSize(16),
    color: PRIMARY,
  },
  cardMeta: {
    fontSize: normalizeFontSize(12),
    color: "#777",
    marginTop: moderateScale(3),
  },

  statusChip: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusChipText: {
    fontSize: normalizeFontSize(11),
    fontWeight: "700",
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: moderateScale(6),
  },
  totalLabel: {
    fontSize: normalizeFontSize(13),
    color: "#555",
    fontWeight: "600",
  },
  totalValue: {
    fontSize: normalizeFontSize(15),
    fontWeight: "800",
    color: ACCENT_ORANGE,
  },

  divider: {
    height: 1,
    backgroundColor: "#f1e4dd",
    marginVertical: moderateScale(10),
  },

  cardSectionTitle: {
    fontWeight: "700",
    fontSize: normalizeFontSize(13),
    color: PRIMARY,
    marginBottom: moderateScale(8),
  },

  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: moderateScale(8),
  },
  ingredientBullet: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: PRIMARY,
    marginTop: moderateScale(7),
    marginRight: moderateScale(10),
  },
  ingredientName: {
    fontWeight: "600",
    color: "#222",
    fontSize: normalizeFontSize(13),
  },
  ingredientDetail: {
    color: "#777",
    fontSize: normalizeFontSize(12),
    marginTop: moderateScale(3),
  },
  ingredientSupplier: {
    color: "#999",
    fontSize: normalizeFontSize(12),
    marginTop: moderateScale(2),
  },
  emptyItemsText: {
    fontSize: normalizeFontSize(12),
    color: "#999",
  },

  emptyBox: {
    flex: 1,
    alignItems: "center",
    marginTop: moderateScale(60),
    paddingHorizontal: "6%",
  },
  emptyIcon: {
    fontSize: normalizeFontSize(38),
    color: "#e0c4b0",
    marginBottom: moderateScale(10),
  },
  emptyTitle: {
    fontSize: normalizeFontSize(17),
    fontWeight: "700",
    color: PRIMARY,
    marginBottom: moderateScale(6),
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: normalizeFontSize(13),
    color: "#777",
    textAlign: "center",
    marginBottom: moderateScale(14),
  },
  emptyBtn: {
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(10),
    borderRadius: 999,
    backgroundColor: PRIMARY,
    minHeight: moderateScale(44), // Ensure minimum touch target
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: normalizeFontSize(14),
  },

  buttonRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: "4%",
    paddingBottom: moderateScale(16),
    backgroundColor: BG,
  },
  actionBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingVertical: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(4),
    minHeight: moderateScale(48), // Ensure minimum touch target
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: normalizeFontSize(15),
  },
});
