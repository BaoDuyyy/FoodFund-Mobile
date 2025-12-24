import AlertPopup from "@/components/AlertPopup";
import Loading from "@/components/Loading";
import { BG_KITCHEN as BG, PRIMARY } from "@/constants/colors";
import OperationService from "@/services/operationService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
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

type Phase = {
  id: string;
  phaseName: string;
  cookingFundsAmount?: number | string | null;
  deliveryFundsAmount?: number | string | null;
};

type ExpenseType = "COOKING" | "DELIVERY";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const formatVnd = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  const str = typeof value === "number" ? String(value) : value;
  const digits = digitsOnly(str);
  if (!digits) return "";
  const n = Number(digits);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("vi-VN");
};

// Get label and description based on expense type
const getExpenseTypeInfo = (type: ExpenseType) => {
  if (type === "COOKING") {
    return {
      label: "Nấu ăn",
      headerTitle: "Giải ngân chi phí nấu ăn",
      headerSubtitle: "Nhân viên bếp – Yêu cầu giải ngân cho chi phí nấu",
      budgetLabel: "Ngân sách chi phí nấu ăn",
    };
  }
  return {
    label: "Vận chuyển",
    headerTitle: "Giải ngân chi phí vận chuyển",
    headerSubtitle: "Nhân viên giao hàng – Yêu cầu giải ngân cho vận chuyển",
    budgetLabel: "Ngân sách chi phí vận chuyển",
  };
};

export default function OperationRequestPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phases?: string; expenseType?: string }>();

  // Get expense type from URL params (passed from caller)
  const expenseType: ExpenseType = (params.expenseType === "COOKING" || params.expenseType === "DELIVERY")
    ? params.expenseType
    : "COOKING"; // default fallback

  const expenseTypeInfo = getExpenseTypeInfo(expenseType);

  const phases: Phase[] = useMemo(() => {
    try {
      if (!params.phases) return [];
      const raw = Array.isArray(params.phases) ? params.phases[0] : params.phases;
      const parsed = JSON.parse(raw || "[]");
      if (Array.isArray(parsed)) {
        return parsed
          .filter((p) => p && p.id && p.phaseName)
          .map((p) => ({
            id: p.id,
            phaseName: p.phaseName,
            cookingFundsAmount: p.cookingFundsAmount ?? null,
            deliveryFundsAmount: p.deliveryFundsAmount ?? null,
          }));
      }
      return [];
    } catch {
      return [];
    }
  }, [params.phases]);

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(
    phases[0]?.id || ""
  );
  const [title, setTitle] = useState("Chi phí");
  const [totalCost, setTotalCost] = useState<string>(""); // lưu digits "20000"
  const [submitting, setSubmitting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId) || null;

  const currentBudget = (() => {
    if (!selectedPhase) return 0;
    const raw =
      expenseType === "COOKING"
        ? selectedPhase.cookingFundsAmount
        : selectedPhase.deliveryFundsAmount;
    const n = Number(raw ?? 0);
    return isNaN(n) ? 0 : n;
  })();

  // Prefill totalCost từ currentBudget khi user chưa gõ gì
  useEffect(() => {
    if (!totalCost && currentBudget > 0) {
      setTotalCost(String(currentBudget));
    }
  }, [currentBudget, totalCost]);

  useEffect(() => {
    if (currentBudget > 0) {
      setTotalCost(String(currentBudget));
    } else {
      setTotalCost("");
    }
  }, [selectedPhaseId]);

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleSubmit = async () => {
    if (!selectedPhase) {
      showAlert("Vui lòng chọn giai đoạn.");
      return;
    }
    if (!title.trim()) {
      showAlert("Vui lòng nhập tiêu đề.");
      return;
    }

    const totalCostNumber = totalCost ? Number(digitsOnly(totalCost)) : 0;
    if (!totalCostNumber) {
      showAlert("Tổng chi phí phải là số lớn hơn 0.");
      return;
    }

    try {
      setSubmitting(true);
      await OperationService.createOperationRequest({
        campaignPhaseId: selectedPhase.id,
        expenseType,
        title: title.trim(),
        // API expects string → truyền digits
        totalCost: digitsOnly(totalCost),
      });
      Alert.alert("Thành công", "Đã tạo yêu cầu giải ngân.", [
        {
          text: "OK",
          onPress: () => router.push("/operationRequests"),
        },
      ]);
    } catch (err: any) {
      console.error("createOperationRequest error:", err);
      showAlert(err?.message || "Không thể tạo yêu cầu giải ngân.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Loading visible={submitting} message="Đang gửi yêu cầu..." />
      <AlertPopup
        visible={alertVisible}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      {/* HEADER */}
      <View style={styles.headerBg} />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {expenseTypeInfo.headerTitle}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {expenseTypeInfo.headerSubtitle}
          </Text>
        </View>
        <View style={{ width: moderateScale(36) }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 180 }]} // chừa chỗ cho footer
        keyboardShouldPersistTaps="handled"
      >
        {/* Card 1: giai đoạn + loại chi phí */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin chung</Text>
          <Text style={styles.cardDesc}>
            Chọn giai đoạn chiến dịch để yêu cầu giải ngân chi phí {expenseTypeInfo.label.toLowerCase()}.
          </Text>

          {/* Chọn phase */}
          <Text style={styles.label}>Giai đoạn chiến dịch</Text>
          {phases.length === 0 ? (
            <Text style={styles.helperText}>
              Không có giai đoạn nào được truyền vào.
            </Text>
          ) : (
            <View style={styles.chipRow}>
              {phases.map((p) => {
                const active = p.id === selectedPhaseId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedPhaseId(p.id)}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                      numberOfLines={1}
                    >
                      {p.phaseName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Expense type display (read-only) */}
          <Text style={styles.label}>Loại chi phí</Text>
          <View style={[styles.chip, styles.chipActiveSoft, { alignSelf: 'flex-start' }]}>
            <Text style={[styles.chipText, styles.chipTextActiveSoft]}>
              {expenseTypeInfo.label}
            </Text>
          </View>

          {currentBudget > 0 && (
            <View style={styles.budgetBox}>
              <Text style={styles.budgetLabel}>
                {expenseTypeInfo.budgetLabel}
              </Text>
              <Text style={styles.budgetValue}>
                {formatVnd(currentBudget)} VND
              </Text>
              <Text style={styles.budgetHint}>
                Bạn có thể tạo nhiều yêu cầu, miễn tổng cộng không vượt quá
                ngân sách này.
              </Text>
            </View>
          )}
        </View>


        {/* Card 2: chi tiết yêu cầu */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chi tiết yêu cầu</Text>
          <Text style={styles.cardDesc}>
            Điền nội dung chi phí và số tiền cần giải ngân.
          </Text>

          {/* Title */}
          <Text style={styles.label}>Tiêu đề</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ví dụ: Chi phí nguyên liệu"
            placeholderTextColor="#9ca3af"
          />

          {/* Total cost */}
          <Text style={styles.label}>Tổng chi phí (VND)</Text>
          <TextInput
            style={styles.input}
            value={formatVnd(totalCost)}
            onChangeText={(t) => setTotalCost(digitsOnly(t))}
            keyboardType="number-pad"
            placeholder={
              currentBudget > 0
                ? `${formatVnd(currentBudget)} VND`
                : "Nhập số tiền"
            }
            placeholderTextColor="#9ca3af"
          />
          <Text style={styles.helperText}>
            Số tiền sẽ được đối chiếu với chứng từ chi sau khi gửi.
          </Text>
        </View>
      </ScrollView>

      {/* ===== FIXED FOOTER ===== */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (submitting || phases.length === 0) && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting || phases.length === 0}
        >
          <Text style={styles.submitBtnText}>Tạo yêu cầu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listBtn}
          onPress={() => router.push("/operationRequests")}
        >
          <Text style={styles.listBtnText}>Xem danh sách yêu cầu của tôi</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // layout
  container: { flex: 1, backgroundColor: BG },

  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(120),
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: moderateScale(28),
    borderBottomRightRadius: moderateScale(28),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "4%",
    paddingTop: moderateScale(50),
    paddingBottom: moderateScale(14),
  },
  headerBackBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(12),
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: moderateScale(12),
    alignItems: "center",
  },
  headerTitle: {
    fontSize: normalizeFontSize(16),
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: normalizeFontSize(11),
    color: "#fed7aa",
    marginTop: moderateScale(2),
    textAlign: "center",
  },

  content: {
    paddingHorizontal: "4%",
    paddingTop: moderateScale(10),
  },

  // cards
  card: {
    backgroundColor: "#ffffff",
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    marginTop: moderateScale(10),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: normalizeFontSize(15),
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: moderateScale(4),
  },
  cardDesc: {
    fontSize: normalizeFontSize(12),
    color: "#6b7280",
    marginBottom: moderateScale(10),
  },

  label: {
    fontSize: normalizeFontSize(13),
    fontWeight: "700",
    color: "#374151",
    marginTop: moderateScale(10),
    marginBottom: moderateScale(4),
  },
  helperText: {
    fontSize: normalizeFontSize(11),
    color: "#6b7280",
    marginTop: moderateScale(4),
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  chip: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(7),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  chipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  chipActiveSoft: {
    backgroundColor: "#fff7ed",
    borderColor: PRIMARY,
  },
  chipText: {
    fontSize: normalizeFontSize(12),
    color: "#374151",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },
  chipTextActiveSoft: {
    color: PRIMARY,
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    backgroundColor: "#fff",
    fontSize: normalizeFontSize(14),
    color: "#111827",
    minHeight: moderateScale(44), // Ensure minimum touch target
  },

  // footer fixed
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BG,
    paddingHorizontal: "4%",
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(18),
    borderTopWidth: 1,
    borderTopColor: "#e0d6cf",
  },

  submitBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingVertical: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
    minHeight: moderateScale(48), // Ensure minimum touch target
  },
  submitBtnText: {
    color: "#fff",
    fontSize: normalizeFontSize(15),
    fontWeight: "800",
  },
  listBtn: {
    marginTop: moderateScale(10),
    borderRadius: 999,
    paddingVertical: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: "#fff",
    minHeight: moderateScale(44), // Ensure minimum touch target
  },
  listBtnText: {
    color: PRIMARY,
    fontSize: normalizeFontSize(14),
    fontWeight: "700",
  },

  budgetBox: {
    marginTop: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
  },
  budgetLabel: {
    fontSize: normalizeFontSize(12),
    color: "#b45309",
    fontWeight: "600",
  },
  budgetValue: {
    marginTop: moderateScale(4),
    fontSize: normalizeFontSize(15),
    color: PRIMARY,
    fontWeight: "800",
  },
  budgetHint: {
    marginTop: moderateScale(3),
    fontSize: normalizeFontSize(11),
    color: "#6b7280",
  },
});
