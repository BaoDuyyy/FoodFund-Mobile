import Loading from "@/components/Loading";
import { BG_KITCHEN as BG, BORDER, MUTED_TEXT as MUTED, PRIMARY, TEXT } from "@/constants/colors";
import DeliveryService from "@/services/deliveryService";
import type { DeliveryTask } from "@/types/api/delivery";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// map status -> Vietnamese
const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ nhận",
  ACCEPTED: "Đã nhận",
  OUT_FOR_DELIVERY: "Đang giao",
  COMPLETED: "Hoàn thành",
  REJECTED: "Đã từ chối",
};

function getStatusLabel(status?: string | null) {
  if (!status) return "Không xác định";
  const key = status.toUpperCase();
  return DELIVERY_STATUS_LABELS[key] || status;
}

function getStatusColors(status?: string | null) {
  const s = (status || "").toUpperCase();
  if (s === "COMPLETED") {
    return { bg: "#dcfce7", text: "#15803d" };
  }
  if (s === "REJECTED") {
    return { bg: "#fee2e2", text: "#b91c1c" };
  }
  if (s === "OUT_FOR_DELIVERY") {
    return { bg: "#e0f2fe", text: "#0369a1" };
  }
  if (s === "ACCEPTED") {
    return { bg: "#fef9c3", text: "#b45309" };
  }
  if (s === "PENDING") {
    return { bg: "#f3e8ff", text: "#6d28d9" };
  }
  return { bg: "#e5e7eb", text: "#374151" };
}

export default function DeliveryOrdersPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ campaignId?: string }>();
  const campaignId = useMemo(
    () =>
      Array.isArray(params.campaignId) ? params.campaignId[0] : params.campaignId,
    [params.campaignId]
  );

  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

        setTasks(data);
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

  const handleUpdateTaskStatus = async (
    task: DeliveryTask,
    nextStatus: "ACCEPTED" | "REJECTED" | "OUT_FOR_DELIVERY" | "COMPLETED"
  ) => {
    if (updatingId) return;
    setUpdatingId(task.id);
    try {
      const updated = await DeliveryService.updateDeliveryTaskStatus({
        taskId: task.id,
        status: nextStatus,
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === updated.id ? { ...t, status: updated.status } : t
        )
      );
    } catch (err) {
      console.error("Error updating delivery task:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderItem = ({ item }: { item: DeliveryTask }) => {
    const createdAt = item.created_at
      ? new Date(item.created_at).toLocaleString("vi-VN")
      : "—";
    const isUpdating = updatingId === item.id;
    const status = item.status;
    const statusLabel = getStatusLabel(status);
    const statusColors = getStatusColors(status);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: "/deliveryTaskDetail",
            params: { taskId: item.id },
          })
        }
      >
        {/* Header card: mã đơn + badge trạng thái */}
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Đơn giao #{item.id.slice(0, 8)}</Text>
            <Text style={styles.cardSubTitle}>
              Tạo lúc {createdAt}
            </Text>
          </View>
          <View
            style={[
              styles.statusChip,
              { backgroundColor: statusColors.bg },
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                { color: statusColors.text },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Meta info */}
        <View style={styles.cardMetaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Mã suất ăn</Text>
            <Text style={styles.metaValue}>{item.mealBatchId || "—"}</Text>
          </View>
          <View style={styles.metaItemRight}>
            <Text style={styles.metaLabel}>Trạng thái hệ thống</Text>
            <Text style={styles.metaValueRaw}>{status || "—"}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.cardButtonRow}>
          {status === "PENDING" && (
            <>
              <TouchableOpacity
                style={[styles.acceptBtn, isUpdating && { opacity: 0.6 }]}
                disabled={isUpdating}
                onPress={() => handleUpdateTaskStatus(item, "ACCEPTED")}
              >
                <Text style={styles.acceptBtnText}>
                  {isUpdating ? "Đang xử lý..." : "Nhận đơn"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rejectBtn, isUpdating && { opacity: 0.6 }]}
                disabled={isUpdating}
                onPress={() => handleUpdateTaskStatus(item, "REJECTED")}
              >
                <Text style={styles.rejectBtnText}>Từ chối</Text>
              </TouchableOpacity>
            </>
          )}

          {status === "ACCEPTED" && (
            <TouchableOpacity
              style={[styles.acceptBtn, isUpdating && { opacity: 0.6 }]}
              disabled={isUpdating}
              onPress={() =>
                handleUpdateTaskStatus(item, "OUT_FOR_DELIVERY")
              }
            >
              <Text style={styles.acceptBtnText}>
                {isUpdating ? "Đang xử lý..." : "Bắt đầu giao"}
              </Text>
            </TouchableOpacity>
          )}

          {status === "OUT_FOR_DELIVERY" && (
            <TouchableOpacity
              style={[styles.acceptBtn, isUpdating && { opacity: 0.6 }]}
              disabled={isUpdating}
              onPress={() => handleUpdateTaskStatus(item, "COMPLETED")}
            >
              <Text style={styles.acceptBtnText}>
                {isUpdating ? "Đang xử lý..." : "Hoàn thành"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={loading} message="Đang tải đơn giao hàng..." />

      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn giao hàng</Text>
        <View style={{ width: 32 }} />
      </View>

      {!loading && tasks.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons
            name="cube-outline"
            size={40}
            color="#d7bfae"
            style={{ marginBottom: 8 }}
          />
          <Text style={styles.emptyTitle}>Chưa có đơn giao hàng nào</Text>
          <Text style={styles.emptyDesc}>
            Đơn giao hàng sẽ xuất hiện tại đây khi được tạo.
          </Text>
        </View>
      ) : !loading ? (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </SafeAreaView>
  );
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    color: MUTED,
    fontSize: 14,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: TEXT,
  },
  cardSubTitle: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },

  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  cardMetaRow: {
    flexDirection: "row",
    marginTop: 4,
    gap: 12,
  },
  metaItem: {
    flex: 1,
    marginTop: 4,
  },
  metaItemRight: {
    flex: 1,
    marginTop: 4,
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 11,
    color: MUTED,
  },
  metaValue: {
    fontSize: 13,
    color: TEXT,
    fontWeight: "600",
    marginTop: 2,
  },
  metaValueRaw: {
    fontSize: 11,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 2,
  },

  cardButtonRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  acceptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  rejectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  rejectBtnText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "700",
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
    color: MUTED,
    textAlign: "center",
  },
});
