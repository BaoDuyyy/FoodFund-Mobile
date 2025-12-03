import Loading from "@/components/Loading";
import OperationService from "@/services/operationService";
import type { OperationRequest } from "@/types/api/operationRequest";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#ad4e28";
const BG = "#fff7f2";

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
        <Text style={styles.metaText}>
          Loại chi phí: {item.expenseType === "COOKING" ? "Nấu ăn" : item.expenseType}
        </Text>
        <Text style={styles.metaText}>Tổng chi phí: {amountNum.toLocaleString("vi-VN")} đ</Text>
        <Text style={styles.metaText}>Ngày tạo: {createdAt}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={false} message="" />

      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yêu cầu giải ngân của tôi</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={PRIMARY} size="large" />
          <Text style={styles.loadingText}>Đang tải danh sách...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Chưa có yêu cầu giải ngân nào</Text>
          <Text style={styles.emptyDesc}>
            Hãy tạo yêu cầu đầu tiên từ trang chi tiết chiến dịch.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
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

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3e1d6",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    color: PRIMARY,
    fontSize: 20,
    fontWeight: "800",
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: PRIMARY,
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

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: PRIMARY,
    marginRight: 8,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  metaText: {
    fontSize: 12,
    color: "#4b5563",
    marginTop: 2,
  },

  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: PRIMARY,
    marginBottom: 4,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
});
