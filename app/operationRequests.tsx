import Loading from "@/components/Loading";
import { BG_KITCHEN as BG, PRIMARY } from "@/constants/colors";
import OperationService from "@/services/operationService";
import type { OperationRequest } from "@/types/api/operationRequest";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    height: 120,                // tăng nhẹ để chữ thoáng
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ffe6d8",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    color: PRIMARY,
    fontSize: 22,
    fontWeight: "900",
  },

  headerTextWrap: { flex: 1, marginLeft: 10 },
  headerTitle: {
    fontSize: 20,               // bigger
    fontWeight: "800",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,               // bigger
    color: "#ffead4",
    marginTop: 3,
  },

  legendRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 6,
    gap: 16,
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 14, color: "#374151" },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,                // tăng padding
    marginTop: 14,
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
    marginBottom: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,               // bigger
    fontWeight: "800",
    color: PRIMARY,
  },

  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  statusChipText: {
    fontSize: 13,               // bigger
    fontWeight: "700",
  },

  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  metaChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#f9fafb",
  },
  metaChipLabel: {
    fontSize: 13,               // bigger
    color: "#6b7280",
  },
  metaChipValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  metaText: {
    fontSize: 14,               // bigger
    color: "#374151",
    marginTop: 6,
    lineHeight: 20,
  },
  metaStrong: {
    fontWeight: "700",
    color: "#111827",
  },

  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});


