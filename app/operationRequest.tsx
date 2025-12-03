import Loading from "@/components/Loading";
import OperationService from "@/services/operationService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#ad4e28";
const BG = "#fff7f2";

type Phase = {
  id: string;
  phaseName: string;
  // ...other fields ignored
};

const EXPENSE_TYPES = ["COOKING", "DELIVERY"] as const;
type ExpenseType = (typeof EXPENSE_TYPES)[number];

export default function OperationRequestPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phases?: string }>();

  const phases: Phase[] = useMemo(() => {
    try {
      if (!params.phases) return [];
      const raw = Array.isArray(params.phases) ? params.phases[0] : params.phases;
      const parsed = JSON.parse(raw || "[]");
      if (Array.isArray(parsed)) {
        return parsed
          .filter((p) => p && p.id && p.phaseName)
          .map((p) => ({ id: p.id, phaseName: p.phaseName }));
      }
      return [];
    } catch {
      return [];
    }
  }, [params.phases]);

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(
    phases[0]?.id || ""
  );
  const [expenseType, setExpenseType] = useState<ExpenseType>("COOKING");
  const [title, setTitle] = useState("Chi phí nguyên liệu");
  const [totalCost, setTotalCost] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId) || null;

  const handleSubmit = async () => {
    if (!selectedPhase) {
      Alert.alert("Lỗi", "Vui lòng chọn giai đoạn.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề.");
      return;
    }
    if (!totalCost || isNaN(Number(totalCost))) {
      Alert.alert("Lỗi", "Tổng chi phí phải là số.");
      return;
    }

    try {
      setSubmitting(true);
      await OperationService.createOperationRequest({
        campaignPhaseId: selectedPhase.id,
        expenseType,
        title: title.trim(),
        totalCost: totalCost.trim(),
      });
      Alert.alert("Thành công", "Đã tạo yêu cầu giải ngân.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      console.error("createOperationRequest error:", err);
      Alert.alert("Lỗi", err?.message || "Không thể tạo yêu cầu giải ngân.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={submitting} message="Đang gửi yêu cầu..." />

      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo yêu cầu giải ngân</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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
                  >
                    {p.phaseName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Expense type */}
        <Text style={styles.label}>Loại chi phí</Text>
        <View style={styles.chipRow}>
          {EXPENSE_TYPES.map((t) => {
            const active = t === expenseType;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setExpenseType(t)}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {t === "COOKING" ? "Nấu ăn" : "Vận chuyển"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Title */}
        <Text style={styles.label}>Tiêu đề</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ví dụ: Chi phí nguyên liệu"
        />

        {/* Total cost */}
        <Text style={styles.label}>Tổng chi phí</Text>
        <TextInput
          style={styles.input}
          value={totalCost}
          onChangeText={(t) => setTotalCost(t.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          placeholder="Nhập số tiền"
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting || phases.length === 0}
        >
          <Text style={styles.submitBtnText}>Tạo yêu cầu</Text>
        </TouchableOpacity>

        {/* Nút xem danh sách yêu cầu */}
        <TouchableOpacity
          style={styles.listBtn}
          onPress={() => router.push("/operationRequests")}
        >
          <Text style={styles.listBtnText}>Xem danh sách yêu cầu của tôi</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // layout
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
    paddingTop: 12,
    paddingBottom: 24,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: PRIMARY,
    marginTop: 12,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  chipText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#111827",
  },

  submitBtn: {
    marginTop: 20,
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  listBtn: {
    marginTop: 12,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: "#fff",
  },
  listBtnText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: "700",
  },
});