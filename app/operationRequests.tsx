import Loading from "@/components/Loading";
import { BG_KITCHEN as BG, PRIMARY } from "@/constants/colors";
import OperationService from "@/services/operationService";
import type { OperationRequest } from "@/types/api/operationRequest";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  PixelRatio,
  Platform,
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

export default function OperationRequestsPage() {
  const router = useRouter();
  const [items, setItems] = useState<OperationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterFromDate, setFilterFromDate] = useState<Date | null>(null);
  const [filterToDate, setFilterToDate] = useState<Date | null>(null);
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("vi-VN");
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by date range
    if (filterFromDate) {
      result = result.filter((item) => {
        if (!item.created_at) return false;
        return new Date(item.created_at) >= filterFromDate;
      });
    }
    if (filterToDate) {
      const toDateEnd = new Date(filterToDate);
      toDateEnd.setHours(23, 59, 59, 999);
      result = result.filter((item) => {
        if (!item.created_at) return false;
        return new Date(item.created_at) <= toDateEnd;
      });
    }

    // Filter by price range
    const minAmt = parseFloat(filterMinAmount.replace(/[^0-9]/g, "")) || 0;
    const maxAmt = parseFloat(filterMaxAmount.replace(/[^0-9]/g, "")) || Infinity;
    if (filterMinAmount || filterMaxAmount) {
      result = result.filter((item) => {
        const cost = Number(item.totalCost || 0);
        return cost >= minAmt && cost <= maxAmt;
      });
    }

    return result;
  }, [items, filterFromDate, filterToDate, filterMinAmount, filterMaxAmount]);

  const clearFilters = () => {
    setFilterFromDate(null);
    setFilterToDate(null);
    setFilterMinAmount("");
    setFilterMaxAmount("");
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await OperationService.listMyOperationRequests({
          limit: 20,
          offset: 0,
        });
        if (mounted) setItems(data || []);
      } catch (err) {
        console.error("Error loading myOperationRequests:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const renderItem = ({ item }: { item: OperationRequest }) => {
    const amountNum = Number(item.totalCost || 0);
    const createdAt = item.created_at
      ? new Date(item.created_at).toLocaleString("vi-VN")
      : "—";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.statusChip, getStatusChipStyle(item.status)]}>
            <Text
              style={[
                styles.statusChipText,
                getStatusChipTextStyle(item.status),
              ]}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>Loại chi phí</Text>
            <Text style={styles.metaChipValue}>
              {item.expenseType === "COOKING"
                ? "Nấu ăn"
                : item.expenseType === "DELIVERY"
                  ? "Vận chuyển"
                  : item.expenseType}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>Ngày tạo</Text>
            <Text style={styles.metaChipValue}>{createdAt}</Text>
          </View>
        </View>

        <Text style={styles.metaText}>
          Tổng chi phí:{" "}
          <Text style={styles.metaStrong}>
            {amountNum.toLocaleString("vi-VN")} đ
          </Text>
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={loading} message="Đang tải danh sách..." />

      {/* HEADER có nền cong giống các màn khác */}
      <View style={styles.headerBg} />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Yêu cầu giải ngân của tôi</Text>
          <Text style={styles.headerSubtitle}>
            Theo dõi các khoản chi đã gửi xét duyệt
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={18} color={showFilters ? "#fff" : PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Bộ lọc</Text>
            {(filterFromDate || filterToDate || filterMinAmount || filterMaxAmount) && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.filterClearText}>Xóa lọc</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Date Range */}
          <Text style={styles.filterLabel}>Khoảng ngày</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterDateBtn}
              onPress={() => setShowFromPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={PRIMARY} />
              <Text style={filterFromDate ? styles.filterDateText : styles.filterDatePlaceholder}>
                {filterFromDate ? formatDate(filterFromDate) : "Từ ngày"}
              </Text>
            </TouchableOpacity>
            <Ionicons name="arrow-forward" size={16} color="#9ca3af" />
            <TouchableOpacity
              style={styles.filterDateBtn}
              onPress={() => setShowToPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={PRIMARY} />
              <Text style={filterToDate ? styles.filterDateText : styles.filterDatePlaceholder}>
                {filterToDate ? formatDate(filterToDate) : "Đến ngày"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Price Range */}
          <Text style={styles.filterLabel}>Khoảng giá tiền (đ)</Text>
          <View style={styles.filterRow}>
            <TextInput
              style={styles.filterPriceInput}
              placeholder="Từ"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={filterMinAmount}
              onChangeText={setFilterMinAmount}
            />
            <Ionicons name="arrow-forward" size={16} color="#9ca3af" />
            <TextInput
              style={styles.filterPriceInput}
              placeholder="Đến"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={filterMaxAmount}
              onChangeText={setFilterMaxAmount}
            />
          </View>

          {/* Date Pickers */}
          {showFromPicker && (
            <DateTimePicker
              value={filterFromDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                setShowFromPicker(Platform.OS === "ios");
                if (date) setFilterFromDate(date);
              }}
            />
          )}
          {showToPicker && (
            <DateTimePicker
              value={filterToDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                setShowToPicker(Platform.OS === "ios");
                if (date) setFilterToDate(date);
              }}
            />
          )}
        </View>
      )}

      {!loading && items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Chưa có yêu cầu giải ngân nào</Text>
          <Text style={styles.emptyDesc}>
            Hãy tạo yêu cầu đầu tiên từ trang chi tiết chiến dịch để kế toán có
            thể xử lý.
          </Text>
        </View>
      ) : !loading ? (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : null}
    </SafeAreaView>
  );
}

function getStatusLabel(status: string): string {
  const s = status.toUpperCase();
  if (s === "APPROVED") return "Đã duyệt";
  if (s === "REJECTED") return "Từ chối";
  if (s === "DISBURSED") return "Đã giải ngân";
  if (s === "PENDING") return "Chờ duyệt";
  return status;
}

function getStatusChipStyle(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED") return { backgroundColor: "#dcfce7" };
  if (s === "REJECTED") return { backgroundColor: "#fee2e2" };
  if (s === "DISBURSED") return { backgroundColor: "#dbeafe" };
  if (s === "PENDING") return { backgroundColor: "#fef3c7" };
  return { backgroundColor: "#e5e7eb" };
}

function getStatusChipTextStyle(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED") return { color: "#16a34a" };
  if (s === "REJECTED") return { color: "#b91c1c" };
  if (s === "DISBURSED") return { color: "#2563eb" };
  if (s === "PENDING") return { color: "#d97706" };
  return { color: "#4b5563" };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(110),
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: moderateScale(26),
    borderBottomRightRadius: moderateScale(26),
  },

  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: moderateScale(8),
    color: "#6b7280",
    fontSize: normalizeFontSize(13),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "4%",
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
  },
  backBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "#ffe6d8",
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  backIcon: {
    color: PRIMARY,
    fontSize: normalizeFontSize(20),
    fontWeight: "900",
  },

  headerTextWrap: { flex: 1, marginLeft: moderateScale(10) },
  headerTitle: {
    fontSize: normalizeFontSize(19),
    fontWeight: "800",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: normalizeFontSize(13),
    color: "#ffead4",
    marginTop: moderateScale(3),
  },

  // Filter styles
  filterBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: "#ffe6d8",
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(36),
  },
  filterBtnActive: {
    backgroundColor: PRIMARY,
  },
  filterPanel: {
    backgroundColor: "#fff",
    marginHorizontal: "4%",
    marginTop: moderateScale(8),
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  filterTitle: {
    fontSize: normalizeFontSize(14),
    fontWeight: "700",
    color: "#111827",
  },
  filterClearText: {
    fontSize: normalizeFontSize(12),
    color: PRIMARY,
    fontWeight: "600",
  },
  filterLabel: {
    fontSize: normalizeFontSize(12),
    fontWeight: "600",
    color: "#6b7280",
    marginTop: moderateScale(8),
    marginBottom: moderateScale(6),
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  filterDateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7ed",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: "#fed7aa",
    gap: moderateScale(6),
    minHeight: moderateScale(40),
  },
  filterDateText: {
    fontSize: normalizeFontSize(12),
    color: "#111827",
    fontWeight: "500",
  },
  filterDatePlaceholder: {
    fontSize: normalizeFontSize(12),
    color: "#9ca3af",
  },
  filterPriceInput: {
    flex: 1,
    backgroundColor: "#fff7ed",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    fontSize: normalizeFontSize(12),
    color: "#111827",
    borderWidth: 1,
    borderColor: "#fed7aa",
    minHeight: moderateScale(40),
  },

  legendRow: {
    flexDirection: "row",
    paddingHorizontal: "4%",
    paddingTop: moderateScale(6),
    paddingBottom: moderateScale(6),
    gap: moderateScale(14),
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: moderateScale(10), height: moderateScale(10), borderRadius: moderateScale(5), marginRight: moderateScale(6) },
  legendText: { fontSize: normalizeFontSize(13), color: "#374151" },

  listContent: {
    paddingHorizontal: "4%",
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(36),
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    marginTop: moderateScale(12),
    borderWidth: 1,
    borderColor: "#f0d6c7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  cardTitle: {
    flex: 1,
    fontSize: normalizeFontSize(16),
    fontWeight: "800",
    color: PRIMARY,
  },

  statusChip: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(10),
    minWidth: moderateScale(70),
    alignItems: "center",
  },
  statusChipText: {
    fontSize: normalizeFontSize(12),
    fontWeight: "700",
  },

  metaRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    marginBottom: moderateScale(6),
    flexWrap: "wrap",
  },
  metaChip: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    backgroundColor: "#f9fafb",
  },
  metaChipLabel: {
    fontSize: normalizeFontSize(12),
    color: "#6b7280",
  },
  metaChipValue: {
    fontSize: normalizeFontSize(13),
    fontWeight: "600",
    color: "#111827",
  },

  metaText: {
    fontSize: normalizeFontSize(13),
    color: "#374151",
    marginTop: moderateScale(6),
    lineHeight: moderateScale(18),
  },
  metaStrong: {
    fontWeight: "700",
    color: "#111827",
  },

  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "6%",
  },
  emptyTitle: {
    fontSize: normalizeFontSize(17),
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: moderateScale(6),
  },
  emptyDesc: {
    fontSize: normalizeFontSize(13),
    color: "#6b7280",
    textAlign: "center",
  },
});


