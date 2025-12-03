import IngredientService from "@/services/ingredientService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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
const BG = "#f8f6f4";

type Phase = {
  id: string;
  phaseName: string;
};

type IngredientItemField =
  | "ingredientName"
  | "quantity"
  | "estimatedUnitPrice"
  | "estimatedTotalPrice"
  | "supplier";

export default function IngredientRequestFormPage() {
  const router = useRouter();
  const { phases } = useLocalSearchParams();

  // Parse phases from params (JSON string)
  let phaseList: Phase[] = [];
  try {
    if (phases) {
      phaseList = JSON.parse(
        Array.isArray(phases) ? phases[0] : (phases as string)
      );
    }
  } catch {}
  const hasPhases = phaseList.length > 0;

  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0);
  const [totalCost, setTotalCost] = useState("");
  const [items, setItems] = useState<
    Array<{
      ingredientName: string;
      quantity: string;
      estimatedUnitPrice: string;
      estimatedTotalPrice: string;
      supplier: string;
    }>
  >([
    {
      ingredientName: "",
      quantity: "",
      estimatedUnitPrice: "",
      estimatedTotalPrice: "",
      supplier: "",
    },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const recalcTotalCost = (list: typeof items) => {
    const sum = list.reduce((acc, i) => {
      const v = Number(i.estimatedTotalPrice || 0);
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
    setTotalCost(sum ? String(sum) : "");
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        ingredientName: "",
        quantity: "",
        estimatedUnitPrice: "",
        estimatedTotalPrice: "",
        supplier: "",
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => {
      if (prev.length === 1) {
        // luôn giữ lại ít nhất 1 dòng
        const reset = [
          {
            ingredientName: "",
            quantity: "",
            estimatedUnitPrice: "",
            estimatedTotalPrice: "",
            supplier: "",
          },
        ];
        recalcTotalCost(reset);
        return reset;
      }
      const cloned = prev.slice();
      cloned.splice(idx, 1);
      recalcTotalCost(cloned);
      return cloned;
    });
  };

  const handleChangeItem = (
    idx: number,
    field: IngredientItemField,
    value: string
  ) => {
    const newItems = items.slice();
    newItems[idx][field] = value;

    // Nếu thay đổi số lượng hoặc đơn giá => tự tính thành tiền
    if (field === "quantity" || field === "estimatedUnitPrice") {
      const qty = parseFloat(newItems[idx].quantity || "0");
      const unit = parseFloat(newItems[idx].estimatedUnitPrice || "0");
      if (!isNaN(qty) && !isNaN(unit)) {
        const total = Math.round(qty * unit);
        newItems[idx].estimatedTotalPrice = total ? String(total) : "";
      } else {
        newItems[idx].estimatedTotalPrice = "";
      }
    }

    setItems(newItems);
    recalcTotalCost(newItems);
  };

  const handleSubmit = async () => {
    const campaignPhaseId = phaseList[selectedPhaseIdx]?.id || "";
    const isInvalid =
      !campaignPhaseId ||
      !totalCost ||
      items.some(
        (i) =>
          !i.ingredientName ||
          !i.quantity ||
          !i.estimatedUnitPrice ||
          !i.estimatedTotalPrice ||
          !i.supplier
      );

    if (isInvalid) {
      Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ tất cả các trường.");
      return;
    }

    setSubmitting(true);
    try {
      const input = {
        campaignPhaseId,
        totalCost,
        items: items.map((i) => ({
          ingredientName: i.ingredientName,
          quantity: i.quantity,
          estimatedUnitPrice: Number(i.estimatedUnitPrice),
          estimatedTotalPrice: Number(i.estimatedTotalPrice),
          supplier: i.supplier,
        })),
      };
      await IngredientService.createIngredientRequest(input);
      Alert.alert("Thành công", "Gửi yêu cầu nguyên liệu thành công.");
      router.back();
    } catch (err: any) {
      Alert.alert(
        "Gửi yêu cầu thất bại",
        err?.message || "Có lỗi xảy ra, vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yêu cầu nguyên liệu</Text>
        <Text style={styles.headerSubtitle}>
          Gửi danh sách nguyên liệu cho từng giai đoạn chiến dịch
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD: Giai đoạn */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Giai đoạn áp dụng</Text>
          <Text style={styles.cardSubtitle}>
            Chọn đúng giai đoạn để đội phụ trách dễ theo dõi.
          </Text>
          <View style={styles.chipsWrap}>
            {!hasPhases ? (
              <Text style={styles.emptyPhaseText}>
                Không có giai đoạn nào khả dụng.
              </Text>
            ) : (
              phaseList.map((p, idx) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.chip,
                    selectedPhaseIdx === idx && styles.chipActive,
                  ]}
                  onPress={() => setSelectedPhaseIdx(idx)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedPhaseIdx === idx && styles.chipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {p.phaseName}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* CARD: Tổng chi phí */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng chi phí dự kiến</Text>
          <Text style={styles.cardSubtitle}>
            Hệ thống tự cộng từ các dòng “Thành tiền” (có thể sửa lại nếu cần).
          </Text>
          <TextInput
            style={styles.input}
            value={totalCost}
            onChangeText={setTotalCost}
            placeholder="Nhập tổng chi phí (VND)"
            keyboardType="numeric"
          />
        </View>

        {/* CARD: Danh sách nguyên liệu */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Danh sách nguyên liệu</Text>
              <Text style={styles.cardSubtitle}>
                Thêm chi tiết từng loại nguyên liệu, số lượng và nhà cung cấp.
              </Text>
            </View>
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{items.length}</Text>
            </View>
          </View>

          {items.map((item, idx) => (
            <View key={idx} style={styles.itemBox}>
              <View style={styles.itemHeaderRow}>
                <Text style={styles.itemTitle}>Nguyên liệu #{idx + 1}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem(idx)}>
                  <Text style={styles.removeText}>
                    {items.length === 1 ? "Xóa nội dung" : "Xóa"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.itemLabel}>Tên nguyên liệu</Text>
              <TextInput
                style={styles.input}
                value={item.ingredientName}
                onChangeText={(v) =>
                  handleChangeItem(idx, "ingredientName", v)
                }
                placeholder="Ví dụ: Gạo ST25, Thịt bò, Rau củ..."
              />

              <View style={styles.inlineRow}>
                <View style={styles.inlineCol}>
                  <Text style={styles.itemLabel}>Số lượng (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={item.quantity}
                    onChangeText={(v) => handleChangeItem(idx, "quantity", v)}
                    placeholder="Ví dụ: 10"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inlineCol}>
                  <Text style={styles.itemLabel}>
                    Đơn giá ước tính (VND / kg)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={item.estimatedUnitPrice}
                    onChangeText={(v) =>
                      handleChangeItem(idx, "estimatedUnitPrice", v)
                    }
                    placeholder="Ví dụ: 25000"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.itemLabel}>Thành tiền ước tính (VND)</Text>
              <TextInput
                style={styles.input}
                value={item.estimatedTotalPrice}
                onChangeText={(v) =>
                  handleChangeItem(idx, "estimatedTotalPrice", v)
                }
                placeholder="Hệ thống tự tính, có thể sửa"
                keyboardType="numeric"
              />

              <Text style={styles.itemLabel}>Nhà cung cấp</Text>
              <TextInput
                style={styles.input}
                value={item.supplier}
                onChangeText={(v) => handleChangeItem(idx, "supplier", v)}
                placeholder="Tên hoặc mô tả nhà cung cấp"
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
            <Text style={styles.addBtnText}>+ Thêm nguyên liệu</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BUTTONS BOTTOM */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.primaryBtn,
            (!hasPhases || submitting) && { opacity: 0.6 },
          ]}
          onPress={handleSubmit}
          disabled={submitting || !hasPhases}
        >
          <Text style={styles.actionBtnText}>
            {submitting
              ? "Đang gửi..."
              : hasPhases
              ? "Gửi yêu cầu nguyên liệu"
              : "Không có giai đoạn để gửi"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.secondaryBtn]}
          onPress={() => router.push("/ingredientRequest")}
        >
          <Text style={styles.secondaryBtnText}>Yêu cầu đã gửi</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0e4da",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backIcon: {
    color: PRIMARY,
    fontSize: 18,
    fontWeight: "800",
    marginRight: 4,
  },
  backText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8a7b6e",
    marginTop: 2,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#8c8c8c",
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    position: "relative",
  },
  badgeCount: {
  position: "absolute",          // 👈 ghim vào góc phải trên của header
  top: 0,
  right: 0,
  marginTop: 2,
  marginRight: 4,
  minWidth: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: "#fff5ee",
  alignItems: "center",
  justifyContent: "center",
},
  badgeCountText: {
    color: PRIMARY,
    fontWeight: "800",
    fontSize: 13,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2d5c8",
    backgroundColor: "#fff",
  },
  chipActive: {
    borderColor: PRIMARY,
    backgroundColor: "#fff5ee",
  },
  chipText: {
    fontSize: 13,
    color: "#4a4a4a",
    maxWidth: 180,
  },
  chipTextActive: {
    color: PRIMARY,
    fontWeight: "700",
  },
  emptyPhaseText: {
    fontSize: 13,
    color: "#999",
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
    fontSize: 14,
  },

  itemBox: {
    backgroundColor: "#fffdf9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f4e3d6",
    padding: 10,
    marginBottom: 10,
  },
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  itemTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: PRIMARY,
  },
  removeText: {
    color: "#d64545",
    fontSize: 12,
    fontWeight: "700",
  },
  itemLabel: {
    fontWeight: "600",
    fontSize: 12,
    color: "#b06437",
    marginBottom: 3,
    marginTop: 4,
  },

  inlineRow: {
    flexDirection: "row",
    gap: 10,
  },
  inlineCol: {
    flex: 1,
  },

  addBtn: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  addBtnText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 14,
  },

  buttonRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    backgroundColor: BG,
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#e7ddd3",
  },
  actionBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
  },
  secondaryBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryBtnText: {
    color: PRIMARY,
    fontWeight: "800",
    fontSize: 14,
  },
});
