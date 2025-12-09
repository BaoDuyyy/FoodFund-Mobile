import { BG_WARM as BG, BORDER, MUTED_TEXT as MUTED, PRIMARY, TEXT } from "@/constants/colors";
import DeliveryService from "@/services/deliveryService";
import type { DeliveryTaskDetail } from "@/types/api/delivery";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeliveryTaskDetailPage() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();

  const [task, setTask] = useState<DeliveryTaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!taskId) {
        setError("Thiếu mã đơn giao hàng.");
        setLoading(false);
        return;
      }
      try {
        const detail = await DeliveryService.getDeliveryTaskById(taskId);
        if (!mounted) return;
        setTask(detail);
      } catch (e: any) {
        if (mounted)
          setError(e?.message || "Không tải được chi tiết đơn giao hàng.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [taskId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={PRIMARY} style={{ marginTop: 32 }} />
        <Text style={styles.helperText}>Đang tải chi tiết đơn giao...</Text>
      </SafeAreaView>
    );
  }

  if (error || !task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn giao</Text>
          <View style={{ width: 32 }} />
        </View>
        <Text style={[styles.errorText, { marginTop: 16 }]}>
          {error || "Không tìm thấy đơn giao hàng."}
        </Text>
      </SafeAreaView>
    );
  }

  const createdAt = task.created_at
    ? new Date(task.created_at).toLocaleString("vi-VN")
    : "—";
  const updatedAt = task.updated_at
    ? new Date(task.updated_at).toLocaleString("vi-VN")
    : "—";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn giao</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Đơn giao #{task.id.slice(0, 8)}</Text>

          <Text style={styles.label}>Trạng thái</Text>
          <Text style={styles.value}>{task.status}</Text>

          <Text style={styles.label}>Tạo lúc</Text>
          <Text style={styles.value}>{createdAt}</Text>

          <Text style={styles.label}>Cập nhật lúc</Text>
          <Text style={styles.value}>{updatedAt}</Text>

          {task.deliveryStaff && (
            <>
              <Text style={styles.label}>Nhân viên giao hàng</Text>
              <Text style={styles.value}>{task.deliveryStaff.full_name}</Text>
            </>
          )}

          {task.mealBatch && (
            <>
              <Text style={styles.label}>Suất ăn</Text>
              <Text style={styles.value}>
                {task.mealBatch.foodName} ({task.mealBatch.quantity} suất)
              </Text>
            </>
          )}
        </View>

        {Array.isArray(task.statusLogs) && task.statusLogs.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lịch sử trạng thái</Text>
            {task.statusLogs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <Text style={styles.logStatus}>{log.status}</Text>
                <Text style={styles.logMeta}>
                  {new Date(log.createdAt).toLocaleString("vi-VN")} —{" "}
                  {log.changedBy}
                </Text>
                {log.note ? (
                  <Text style={styles.logNote}>Ghi chú: {log.note}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // filepath: d:\Sem 9\FoodFund_mobile\app\deliveryTaskDetail.tsx
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: MUTED,
    marginTop: 6,
  },
  value: {
    fontSize: 14,
    color: TEXT,
    fontWeight: "600",
    marginTop: 2,
  },
  logItem: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  logStatus: {
    fontSize: 13,
    fontWeight: "700",
    color: PRIMARY,
  },
  logMeta: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  logNote: {
    fontSize: 12,
    color: TEXT,
    marginTop: 2,
  },
  helperText: {
    textAlign: "center",
    marginTop: 8,
    color: MUTED,
    fontSize: 13,
  },
  errorText: {
    textAlign: "center",
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
  },
});
