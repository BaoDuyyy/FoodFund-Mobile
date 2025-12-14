import Loading from "@/components/Loading";
import { BG_KITCHEN as BG, BORDER, MUTED_TEXT as MUTED, PRIMARY, TEXT } from "@/constants/colors";
import { getDeliveryStatusColors, getDeliveryStatusLabel } from "@/constants/deliveryStatus";
import DeliveryService from "@/services/deliveryService";
import type { DeliveryTaskDetail } from "@/types/api/delivery";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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
        <Loading visible={loading} message="Đang tải chi tiết đơn giao..." />
      </SafeAreaView>
    );
  }

  if (error || !task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đơn giao</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
          </View>
          <Text style={styles.errorText}>{error || "Không tìm thấy đơn giao hàng."}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const createdAt = task.created_at
    ? new Date(task.created_at).toLocaleString("vi-VN")
    : "—";
  const updatedAt = task.updated_at
    ? new Date(task.updated_at).toLocaleString("vi-VN")
    : "—";
  const statusColors = getDeliveryStatusColors(task.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn giao</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColors.text }]} />
              <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                {getDeliveryStatusLabel(task.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>#{task.id.slice(0, 8).toUpperCase()}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <View style={styles.heroStatIconWrap}>
                <Ionicons name="time-outline" size={20} color={PRIMARY} />
              </View>
              <View>
                <Text style={styles.heroStatValue}>{createdAt}</Text>
                <Text style={styles.heroStatLabel}>Tạo lúc</Text>
              </View>
            </View>
          </View>

          {updatedAt !== createdAt && (
            <View style={styles.updateInfo}>
              <Ionicons name="refresh-outline" size={14} color={MUTED} />
              <Text style={styles.updateText}>Cập nhật: {updatedAt}</Text>
            </View>
          )}
        </View>

        {/* Meal Batch Card */}
        {task.mealBatch && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardIconWrap}>
                <Ionicons name="restaurant-outline" size={18} color={PRIMARY} />
              </View>
              <Text style={styles.infoCardTitle}>Suất ăn</Text>
            </View>
            <View style={styles.mealBatchInfo}>
              <View style={styles.mealBatchRow}>
                <Text style={styles.mealBatchName}>{task.mealBatch.foodName}</Text>
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>{task.mealBatch.quantity} suất</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Delivery Staff Card */}
        {task.deliveryStaff && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardIconWrap}>
                <Ionicons name="bicycle-outline" size={18} color={PRIMARY} />
              </View>
              <Text style={styles.infoCardTitle}>Nhân viên giao hàng</Text>
            </View>
            <View style={styles.staffInfo}>
              <View style={styles.staffAvatar}>
                <Text style={styles.staffAvatarText}>
                  {task.deliveryStaff.full_name?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
              <View>
                <Text style={styles.staffName}>{task.deliveryStaff.full_name}</Text>
                <Text style={styles.staffId}>ID: {task.deliveryStaff.id.slice(0, 8)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Status History Card */}
        {Array.isArray(task.statusLogs) && task.statusLogs.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardIconWrap}>
                <Ionicons name="list-outline" size={18} color={PRIMARY} />
              </View>
              <Text style={styles.infoCardTitle}>Lịch sử trạng thái</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{task.statusLogs.length}</Text>
              </View>
            </View>
            <View style={styles.timeline}>
              {task.statusLogs.map((log, index) => {
                const logStatusColors = getDeliveryStatusColors(log.status);
                const isLast = index === task.statusLogs!.length - 1;
                return (
                  <View key={log.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, { backgroundColor: logStatusColors.text }]} />
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={[styles.timelineStatus, { color: logStatusColors.text }]}>
                          {getDeliveryStatusLabel(log.status)}
                        </Text>
                        <Text style={styles.timelineTime}>
                          {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </Text>
                      </View>
                      {log.note && (
                        <View style={styles.noteBox}>
                          <Ionicons name="document-text-outline" size={12} color={MUTED} />
                          <Text style={styles.noteText}>{log.note}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ID Card */}
        <View style={styles.idCard}>
          <Text style={styles.idLabel}>Mã đơn giao</Text>
          <Text style={styles.idValue}>{task.id}</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: TEXT,
    letterSpacing: 1,
    marginBottom: 16,
  },
  heroStats: {
    flexDirection: "row",
    gap: 12,
  },
  heroStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef7f0",
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  heroStatIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
  },
  heroStatLabel: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  updateInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  updateText: {
    fontSize: 12,
    color: MUTED,
  },

  // Info Card
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  infoCardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoCardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
  },

  // Meal Batch
  mealBatchInfo: {
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 12,
  },
  mealBatchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mealBatchName: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    flex: 1,
  },
  quantityBadge: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  quantityText: {
    fontSize: 13,
    fontWeight: "700",
    color: PRIMARY,
  },

  // Staff Info
  staffInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  staffAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  staffName: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
  },
  staffId: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },

  // Count Badge
  countBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  // Timeline
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
  },
  timelineLeft: {
    alignItems: "center",
    width: 24,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
    paddingLeft: 8,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: "700",
  },
  timelineTime: {
    fontSize: 11,
    color: MUTED,
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    gap: 6,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: TEXT,
    lineHeight: 18,
  },

  // ID Card
  idCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  idLabel: {
    fontSize: 11,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  idValue: {
    fontSize: 12,
    color: "#6b7280",
    fontFamily: "monospace",
    marginTop: 4,
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorText: {
    textAlign: "center",
    color: "#dc2626",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
