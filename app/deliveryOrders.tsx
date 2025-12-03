import DeliveryService from "@/services/deliveryService";
import type { DeliveryTask } from "@/types/api/delivery";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
const BG = "#f8f6f4";

export default function DeliveryOrdersPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ campaignId?: string }>();
  const campaignId = useMemo(
    () => (Array.isArray(params.campaignId) ? params.campaignId[0] : params.campaignId),
    [params.campaignId]
  );

  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await DeliveryService.listMyDeliveryTasks({
          limit: 20,
          offset: 0,
        });
        if (!mounted) return;
        // nếu cần filter theo campaignId, giả sử mealBatchId gắn với campaignId (có thể điều chỉnh sau)
        const filtered = campaignId
          ? data.filter((t) => t.mealBatchId === campaignId)
          : data;
        setTasks(filtered);
      } catch (err) {
        console.error("Error loading my delivery tasks:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [campaignId]);

  const renderItem = ({ item }: { item: DeliveryTask }) => {
    const createdAt = item.created_at
      ? new Date(item.created_at).toLocaleString("vi-VN")
      : "—";
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Đơn giao #{item.id.slice(0, 8)}</Text>
        <Text style={styles.cardMeta}>Meal batch: {item.mealBatchId}</Text>
        <Text style={styles.cardMeta}>Trạng thái: {item.status}</Text>
        <Text style={styles.cardMeta}>Tạo lúc: {createdAt}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn giao hàng</Text>
        <View style={{ width: 32 }} />
      </View>

      {campaignId ? (
        <Text style={styles.subTitle}>
          Chiến dịch: <Text style={styles.subTitleBold}>{campaignId}</Text>
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={PRIMARY} size="large" />
          <Text style={styles.loadingText}>Đang tải đơn giao hàng...</Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Chưa có đơn giao hàng nào</Text>
          <Text style={styles.emptyDesc}>
            Đơn giao hàng sẽ xuất hiện tại đây khi được tạo.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // filepath: d:\Sem 9\FoodFund_mobile\app\deliveryOrders.tsx
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
  subTitle: {
    paddingHorizontal: 16,
    paddingTop: 4,
    fontSize: 12,
    color: "#6b7280",
  },
  subTitleBold: {
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: PRIMARY,
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: "#4b5563",
    marginTop: 1,
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
