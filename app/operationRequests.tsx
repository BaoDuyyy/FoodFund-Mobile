import Loading from "@/components/Loading";
import { BG_KITCHEN as BG, PRIMARY } from "@/constants/colors";
import OperationService from "@/services/operationService";
import type { OperationRequest } from "@/types/api/operationRequest";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  PixelRatio,
  StyleSheet,
  Text,
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
              {item.status}
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
        <View style={{ width: 32 }} />
      </View>

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
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : null}
    </SafeAreaView>
  );
}

function getStatusChipStyle(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED") return { backgroundColor: "#dcfce7" };
  if (s === "REJECTED") return { backgroundColor: "#fee2e2" };
  return { backgroundColor: "#e5e7eb" };
}

function getStatusChipTextStyle(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED") return { color: "#16a34a" };
  if (s === "REJECTED") return { color: "#b91c1c" };
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


