import Loading from "@/components/Loading";
import { BG_KITCHEN as BG, BORDER, MUTED_TEXT as MUTED, PRIMARY, TEXT } from "@/constants/colors";
import {
  DELIVERY_STATUS,
  getDeliveryStatusColors,
  getDeliveryStatusLabel
} from "@/constants/deliveryStatus";
import { useAuth } from "@/hooks/useAuth";
import DeliveryService from "@/services/deliveryService";
import type { DeliveryTaskWithStaff } from "@/types/api/delivery";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
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

export default function DeliveryOrdersPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    campaignId?: string;
    campaignPhaseId?: string;
  }>();
  const campaignId = useMemo(
    () => Array.isArray(params.campaignId) ? params.campaignId[0] : params.campaignId,
    [params.campaignId]
  );
  const campaignPhaseId = useMemo(
    () => Array.isArray(params.campaignPhaseId) ? params.campaignPhaseId[0] : params.campaignPhaseId,
    [params.campaignPhaseId]
  );

  const { user } = useAuth();

  const [tasks, setTasks] = useState<DeliveryTaskWithStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter & Search states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFromDate, setFilterFromDate] = useState<Date | null>(null);
  const [filterToDate, setFilterToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Cancel modal state
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [taskToCancel, setTaskToCancel] = useState<DeliveryTaskWithStaff | null>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('vi-VN');
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Search by food name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const foodName = item.mealBatch?.foodName?.toLowerCase() || "";
        return foodName.includes(query);
      });
    }

    // Filter by cooked date
    if (filterFromDate) {
      result = result.filter((item) => {
        if (!item.mealBatch?.cookedDate) return false;
        const itemDate = new Date(item.mealBatch.cookedDate);
        return itemDate >= filterFromDate;
      });
    }
    if (filterToDate) {
      const toDateEnd = new Date(filterToDate);
      toDateEnd.setHours(23, 59, 59, 999);
      result = result.filter((item) => {
        if (!item.mealBatch?.cookedDate) return false;
        const itemDate = new Date(item.mealBatch.cookedDate);
        return itemDate <= toDateEnd;
      });
    }

    return result;
  }, [tasks, searchQuery, filterFromDate, filterToDate]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // Use filter-based query if campaignPhaseId is provided
        if (campaignPhaseId) {
          // Fetch all tasks for the campaign phase, then filter by current user
          const allTasks = await DeliveryService.listDeliveryTasks({
            campaignId: campaignId || null,
            campaignPhaseId: campaignPhaseId,
            mealBatchId: null,
            deliveryStaffId: null,
            status: null,
            limit: 50,
            offset: 0,
          });
          if (!mounted) return;

          // Filter tasks by deliveryStaff.full_name matching current user's name
          const myTasks = allTasks.filter(
            (task) => task.deliveryStaff?.full_name === user?.userName
          );
          console.log("Current user:", user?.userName);
          console.log("Total tasks:", allTasks.length, "My tasks:", myTasks.length);
          setTasks(myTasks);
        } else {
          // Fallback to myDeliveryTasks
          const data = await DeliveryService.listMyDeliveryTasks({
            limit: 20,
            offset: 0,
          });
          if (!mounted) return;
          setTasks(data as DeliveryTaskWithStaff[]);
        }
      } catch (err) {
        console.error("Error loading delivery tasks:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [campaignId, campaignPhaseId]);

  const handleUpdateTaskStatus = async (
    task: DeliveryTaskWithStaff,
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

  // Handle cancel task with reason
  const handleCancelTask = async () => {
    if (!taskToCancel || updatingId) return;
    if (!cancelReason.trim()) {
      return; // Require reason
    }
    setUpdatingId(taskToCancel.id);
    setCancelModalVisible(false);
    try {
      const updated = await DeliveryService.updateDeliveryTaskStatus({
        taskId: taskToCancel.id,
        status: "FAILED",
        note: cancelReason.trim(),
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === updated.id ? { ...t, status: updated.status } : t
        )
      );
    } catch (err) {
      console.error("Error canceling delivery task:", err);
    } finally {
      setUpdatingId(null);
      setCancelReason("");
      setTaskToCancel(null);
    }
  };

  const openCancelModal = (task: DeliveryTaskWithStaff) => {
    setTaskToCancel(task);
    setCancelReason("");
    setCancelModalVisible(true);
  };

  const renderItem = ({ item }: { item: DeliveryTaskWithStaff }) => {
    const createdAt = item.created_at
      ? new Date(item.created_at).toLocaleString("vi-VN")
      : "—";
    const cookedDate = item.mealBatch?.cookedDate
      ? new Date(item.mealBatch.cookedDate).toLocaleDateString("vi-VN")
      : "—";
    const isUpdating = updatingId === item.id;
    const status = item.status;
    const statusLabel = getDeliveryStatusLabel(status);
    const statusColors = getDeliveryStatusColors(status);
    const mealBatchStatus = item.mealBatch?.status || "—";

    return (
      <View style={styles.card}>
        {/* Header with status badge */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors.bg },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColors.text }]} />
            <Text
              style={[
                styles.statusBadgeText,
                { color: statusColors.text },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Food Name - Highlighted */}
        <View style={styles.foodNameContainer}>
          <Ionicons name="fast-food" size={22} color={PRIMARY} />
          <Text style={styles.foodName}>{item.mealBatch?.foodName || "Không có tên"}</Text>
        </View>

        {/* Meal Batch Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="layers-outline" size={16} color={PRIMARY} />
            </View>
            <View>
              <Text style={styles.detailLabel}>Số lượng</Text>
              <Text style={styles.detailValue}>{item.mealBatch?.quantity ?? 0} suất</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="flame-outline" size={16} color="#ef4444" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Trạng thái</Text>
              <Text style={[styles.detailValue, styles.mealStatusText]}>{mealBatchStatus}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Ngày nấu</Text>
              <Text style={styles.detailValue}>{cookedDate}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="time-outline" size={16} color={MUTED} />
            </View>
            <View>
              <Text style={styles.detailLabel}>Ngày tạo</Text>
              <Text style={styles.detailValue}>{createdAt}</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {/* View Detail Button */}
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() =>
              router.push({
                pathname: "/deliveryTaskDetail",
                params: { taskId: item.id },
              })
            }
          >
            <Ionicons name="eye-outline" size={16} color={PRIMARY} />
            <Text style={styles.detailBtnText}>Xem chi tiết</Text>
          </TouchableOpacity>

          {/* Status Action Buttons */}
          <View style={styles.statusActions}>
            {status === DELIVERY_STATUS.PENDING && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn, isUpdating && styles.disabledBtn]}
                  disabled={isUpdating}
                  onPress={() => handleUpdateTaskStatus(item, "ACCEPTED")}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>
                    {isUpdating ? "..." : "Nhận"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn, isUpdating && styles.disabledBtn]}
                  disabled={isUpdating}
                  onPress={() => handleUpdateTaskStatus(item, "REJECTED")}
                >
                  <Ionicons name="close" size={16} color="#dc2626" />
                </TouchableOpacity>
              </>
            )}

            {status === DELIVERY_STATUS.ACCEPTED && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.startBtn, isUpdating && styles.disabledBtn]}
                disabled={isUpdating}
                onPress={() =>
                  handleUpdateTaskStatus(item, "OUT_FOR_DELIVERY")
                }
              >
                <Ionicons name="bicycle-outline" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>
                  {isUpdating ? "..." : "Bắt đầu giao"}
                </Text>
              </TouchableOpacity>
            )}

            {status === DELIVERY_STATUS.OUT_FOR_DELIVERY && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.completeBtn, isUpdating && styles.disabledBtn]}
                  disabled={isUpdating}
                  onPress={() => handleUpdateTaskStatus(item, "COMPLETED")}
                >
                  <Ionicons name="checkmark-done" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>
                    {isUpdating ? "..." : "Hoàn thành"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn, isUpdating && styles.disabledBtn]}
                  disabled={isUpdating}
                  onPress={() => openCancelModal(item)}
                >
                  <Ionicons name="close-circle-outline" size={16} color="#dc2626" />
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={loading} message="Đang tải đơn giao hàng..." />

      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn giao hàng</Text>
        <TouchableOpacity
          style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={18} color={showFilters ? "#fff" : PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={18} color={MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên món ăn..."
            placeholderTextColor={MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={MUTED} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Lọc theo ngày nấu</Text>
            {(filterFromDate || filterToDate) && (
              <TouchableOpacity
                onPress={() => {
                  setFilterFromDate(null);
                  setFilterToDate(null);
                }}
              >
                <Text style={styles.filterClearText}>Xóa lọc</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterDateBtn}
              onPress={() => setShowFromPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={PRIMARY} />
              <Text style={filterFromDate ? styles.filterDateText : styles.filterDatePlaceholder}>
                {filterFromDate ? formatDate(filterFromDate) : 'Từ ngày'}
              </Text>
            </TouchableOpacity>
            <Ionicons name="arrow-forward" size={16} color={MUTED} />
            <TouchableOpacity
              style={styles.filterDateBtn}
              onPress={() => setShowToPicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={PRIMARY} />
              <Text style={filterToDate ? styles.filterDateText : styles.filterDatePlaceholder}>
                {filterToDate ? formatDate(filterToDate) : 'Đến ngày'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Pickers */}
          {showFromPicker && (
            <DateTimePicker
              value={filterFromDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowFromPicker(Platform.OS === 'ios');
                if (date) setFilterFromDate(date);
              }}
            />
          )}
          {showToPicker && (
            <DateTimePicker
              value={filterToDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowToPicker(Platform.OS === 'ios');
                if (date) setFilterToDate(date);
              }}
            />
          )}
        </View>
      )}

      {/* Stats Row */}
      {!loading && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{filteredTasks.length}</Text>
            <Text style={styles.statLabel}>Tổng đơn</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {filteredTasks.filter(t => t.status === DELIVERY_STATUS.PENDING).length}
            </Text>
            <Text style={styles.statLabel}>Chờ nhận</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {filteredTasks.filter(t => t.status === DELIVERY_STATUS.OUT_FOR_DELIVERY).length}
            </Text>
            <Text style={styles.statLabel}>Đang giao</Text>
          </View>
        </View>
      )}

      {!loading && filteredTasks.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cube-outline" size={48} color={PRIMARY} />
          </View>
          <Text style={styles.emptyTitle}>
            {tasks.length === 0 ? "Chưa có đơn giao hàng" : "Không có đơn phù hợp"}
          </Text>
          <Text style={styles.emptyDesc}>
            {tasks.length === 0
              ? "Đơn giao hàng sẽ xuất hiện tại đây khi được tạo."
              : "Thử thay đổi bộ lọc để xem thêm kết quả."
            }
          </Text>
        </View>
      ) : !loading ? (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : null}

      {/* Cancel Reason Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalKeyboardView}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Hủy đơn giao hàng</Text>
                  <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                    <Ionicons name="close" size={24} color={MUTED} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>
                  Vui lòng nhập lý do hủy đơn giao hàng này
                </Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Nhập lý do hủy đơn..."
                  placeholderTextColor={MUTED}
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setCancelModalVisible(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>Đóng</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalConfirmBtn,
                      !cancelReason.trim() && styles.modalConfirmBtnDisabled,
                    ]}
                    onPress={handleCancelTask}
                    disabled={!cancelReason.trim()}
                  >
                    <Text style={styles.modalConfirmBtnText}>Xác nhận hủy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "4%",
    paddingVertical: moderateScale(10),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: normalizeFontSize(16),
    fontWeight: "700",
    color: TEXT,
  },
  filterBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  filterBtnActive: {
    backgroundColor: PRIMARY,
  },

  filterPanel: {
    backgroundColor: "#fff",
    paddingHorizontal: "4%",
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  filterTitle: {
    fontSize: normalizeFontSize(12),
    fontWeight: "600",
    color: TEXT,
  },
  filterClearText: {
    fontSize: normalizeFontSize(12),
    color: PRIMARY,
    fontWeight: "500",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },
  filterDateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef7f0",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: "#fed7aa",
    gap: moderateScale(8),
    minHeight: moderateScale(40), // Ensure minimum touch target
  },
  filterDateText: {
    fontSize: normalizeFontSize(12),
    color: TEXT,
    fontWeight: "500",
  },
  filterDatePlaceholder: {
    fontSize: normalizeFontSize(12),
    color: MUTED,
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: "4%",
    marginTop: moderateScale(10),
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: normalizeFontSize(18),
    fontWeight: "800",
    color: PRIMARY,
  },
  statLabel: {
    fontSize: normalizeFontSize(10),
    color: MUTED,
    marginTop: moderateScale(2),
  },
  statDivider: {
    width: 1,
    backgroundColor: BORDER,
    marginVertical: moderateScale(4),
  },

  listContent: {
    paddingHorizontal: "4%",
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(22),
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    marginBottom: moderateScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(18),
    gap: moderateScale(6),
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  statusBadgeText: {
    fontSize: normalizeFontSize(10),
    fontWeight: "700",
    textTransform: "uppercase",
  },

  orderInfo: {
    marginTop: moderateScale(8),
  },
  orderId: {
    fontSize: normalizeFontSize(17),
    fontWeight: "800",
    color: TEXT,
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(4),
    gap: moderateScale(4),
  },
  dateText: {
    fontSize: normalizeFontSize(11),
    color: MUTED,
  },

  searchContainer: {
    paddingHorizontal: "4%",
    paddingVertical: moderateScale(10),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
    gap: moderateScale(8),
    minHeight: moderateScale(42), // Ensure minimum touch target
  },
  searchInput: {
    flex: 1,
    fontSize: normalizeFontSize(13),
    color: TEXT,
    padding: 0,
  },

  foodNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(10),
    gap: moderateScale(10),
    backgroundColor: "#fff7ed",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY,
  },
  foodName: {
    fontSize: normalizeFontSize(16),
    fontWeight: "700",
    color: TEXT,
    flex: 1,
  },

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: moderateScale(10),
    gap: moderateScale(8),
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    backgroundColor: "#fafafa",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    gap: moderateScale(8),
  },
  detailIconWrap: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(8),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: normalizeFontSize(10),
    color: MUTED,
  },
  detailValue: {
    fontSize: normalizeFontSize(12),
    fontWeight: "600",
    color: TEXT,
  },
  mealStatusText: {
    color: "#ef4444",
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: moderateScale(12),
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(18),
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    gap: moderateScale(6),
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  detailBtnText: {
    fontSize: normalizeFontSize(12),
    fontWeight: "600",
    color: PRIMARY,
  },
  statusActions: {
    flexDirection: "row",
    gap: moderateScale(8),
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(18),
    gap: moderateScale(4),
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  actionBtnText: {
    fontSize: normalizeFontSize(12),
    fontWeight: "600",
    color: "#fff",
  },
  acceptBtn: {
    backgroundColor: "#22c55e",
  },
  rejectBtn: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingHorizontal: moderateScale(10),
  },
  startBtn: {
    backgroundColor: "#3b82f6",
  },
  completeBtn: {
    backgroundColor: PRIMARY,
  },
  disabledBtn: {
    opacity: 0.6,
  },

  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "8%",
  },
  emptyIconWrap: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(14),
  },
  emptyTitle: {
    fontSize: normalizeFontSize(16),
    fontWeight: "700",
    color: TEXT,
    marginBottom: moderateScale(6),
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: normalizeFontSize(13),
    color: MUTED,
    textAlign: "center",
    lineHeight: moderateScale(18),
  },

  // Cancel button styles
  cancelBtn: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  cancelBtnText: {
    fontSize: normalizeFontSize(12),
    fontWeight: "600",
    color: "#dc2626",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: "4%",
  },
  modalKeyboardView: {
    width: "100%",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(20),
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  modalTitle: {
    fontSize: normalizeFontSize(18),
    fontWeight: "700",
    color: TEXT,
  },
  modalSubtitle: {
    fontSize: normalizeFontSize(13),
    color: MUTED,
    marginBottom: moderateScale(16),
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    fontSize: normalizeFontSize(14),
    color: TEXT,
    minHeight: moderateScale(100),
    backgroundColor: "#fafafa",
  },
  modalActions: {
    flexDirection: "row",
    marginTop: moderateScale(16),
    gap: moderateScale(10),
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtnText: {
    fontSize: normalizeFontSize(14),
    fontWeight: "600",
    color: MUTED,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmBtnDisabled: {
    opacity: 0.5,
  },
  modalConfirmBtnText: {
    fontSize: normalizeFontSize(14),
    fontWeight: "600",
    color: "#fff",
  },
});
