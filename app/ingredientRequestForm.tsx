import AlertPopup from "@/components/AlertPopup";
import Loading from "@/components/Loading";
import { BG_KITCHEN as BG, PRIMARY } from "@/constants/colors";
import CampaignService from "@/services/campaignService";
import IngredientService from "@/services/ingredientService";
import type { Phase, PlannedIngredient } from "@/types/api/campaign";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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

type PhaseOption = {
  id: string;
  phaseName: string;
  ingredientFundsAmount?: number | string | null;
  plannedIngredients?: PlannedIngredient[] | null;
};

type IngredientItemField =
  | "ingredientName"
  | "quantity"
  | "quantityValue"
  | "quantityUnit"
  | "estimatedUnitPrice"
  | "estimatedTotalPrice"
  | "supplier";

type IngredientItem = {
  ingredientName: string;
  quantity: string;
  quantityValue: string;
  quantityUnit: string;
  estimatedUnitPrice: string;
  estimatedTotalPrice: string;
  supplier: string;
  plannedIngredientId: string | null; // null nếu là item mới thêm
  isFromPlan: boolean; // để đánh dấu item từ plan hay mới thêm
};

// Danh sách đơn vị theo nhóm
const UNIT_GROUPS: { label: string; units: string[] }[] = [
  { label: "Trọng lượng", units: ["kg", "g", "mg", "tấn", "tạ", "yến"] },
  { label: "Thể tích", units: ["lít", "ml", "cc"] },
  { label: "Đơn vị đếm", units: ["cái", "chiếc", "quả", "trái", "củ", "hạt", "bó", "mớ", "cây", "nhánh", "tép", "lát", "khúc"] },
  { label: "Quy cách đóng gói", units: ["hộp", "thùng", "gói", "bao", "túi", "chai", "lọ", "hũ", "lon", "bình", "can", "vỉ", "khay"] },
  { label: "Khác", units: ["suất", "phần", "bộ", "cặp", "tá"] },
];

// helpers VND - convert comma to period for Vietnamese locale support
const digitsOnly = (value: string) => value.replace(/,/g, ".").replace(/[^0-9]/g, "");

const formatVnd = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  const str = typeof value === "number" ? String(value) : value;
  const digits = digitsOnly(str);
  if (!digits) return "";
  const n = Number(digits);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("vi-VN");
};

// Tạo item trống
const createEmptyItem = (): IngredientItem => ({
  ingredientName: "",
  quantity: "",
  quantityValue: "",
  quantityUnit: "kg",
  estimatedUnitPrice: "",
  estimatedTotalPrice: "",
  supplier: "",
  plannedIngredientId: null,
  isFromPlan: false,
});

// Tạo item từ plannedIngredient
const createItemFromPlan = (plan: PlannedIngredient): IngredientItem => ({
  ingredientName: plan.name || "",
  quantity: `${plan.quantity || ""}${plan.unit || ""}`,
  quantityValue: String(plan.quantity || ""),
  quantityUnit: plan.unit || "kg",
  estimatedUnitPrice: "",
  estimatedTotalPrice: "",
  supplier: "",
  plannedIngredientId: plan.id,
  isFromPlan: true,
});

export default function IngredientRequestFormPage() {
  const router = useRouter();
  const { campaignId, campaignPhaseId, phases, ingredientFundsAmount } =
    useLocalSearchParams<{
      campaignId?: string;
      campaignPhaseId?: string;
      phases?: string;
      ingredientFundsAmount?: string;
    }>();

  // States
  const [loading, setLoading] = useState(false);
  const [phaseList, setPhaseList] = useState<PhaseOption[]>([]);
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0);
  const [totalCost, setTotalCost] = useState("");
  const [items, setItems] = useState<IngredientItem[]>([createEmptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  // Unit picker modal state
  const [unitPickerVisible, setUnitPickerVisible] = useState(false);
  const [unitPickerItemIdx, setUnitPickerItemIdx] = useState<number>(0);
  // Alert popup state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Load campaign và plannedIngredients
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      // Nếu có phases từ params (legacy)
      if (phases) {
        try {
          const parsed = JSON.parse(
            Array.isArray(phases) ? phases[0] : phases
          ) as PhaseOption[];
          if (mounted) {
            setPhaseList(parsed);
            // Tìm index của phase đã chọn
            let selectedIdx = 0;
            if (campaignPhaseId) {
              const idx = parsed.findIndex((p) => p.id === campaignPhaseId);
              if (idx >= 0) selectedIdx = idx;
            }
            setSelectedPhaseIdx(selectedIdx);

            // Pre-fill items từ plannedIngredients của phase đã chọn
            const selectedPhase = parsed[selectedIdx];
            if (
              selectedPhase?.plannedIngredients &&
              selectedPhase.plannedIngredients.length > 0
            ) {
              const prefilledItems = selectedPhase.plannedIngredients.map(
                createItemFromPlan
              );
              setItems(prefilledItems);
            }
          }
        } catch { }
        return;
      }

      // Nếu có campaignId, load từ API
      if (!campaignId) return;

      setLoading(true);
      try {
        const campaign = await CampaignService.getCampaign(campaignId);
        if (!mounted) return;

        // Map phases với plannedIngredients
        const mappedPhases: PhaseOption[] = (campaign.phases || []).map(
          (p: Phase) => ({
            id: p.id,
            phaseName: p.phaseName || "Giai đoạn",
            ingredientFundsAmount: p.ingredientFundsAmount,
            plannedIngredients: p.plannedIngredients,
          })
        );

        setPhaseList(mappedPhases);

        // Tìm phase được chọn
        let selectedIdx = 0;
        if (campaignPhaseId) {
          const idx = mappedPhases.findIndex((p) => p.id === campaignPhaseId);
          if (idx >= 0) selectedIdx = idx;
        }
        setSelectedPhaseIdx(selectedIdx);

        // Pre-fill items từ plannedIngredients của phase đã chọn
        const selectedPhase = mappedPhases[selectedIdx];
        if (
          selectedPhase?.plannedIngredients &&
          selectedPhase.plannedIngredients.length > 0
        ) {
          const prefilledItems = selectedPhase.plannedIngredients.map(
            createItemFromPlan
          );
          setItems(prefilledItems);
        }
      } catch (err: any) {
        // Error loading campaign
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [campaignId, campaignPhaseId, phases]);

  // Khi chọn phase khác, update lại items từ plannedIngredients
  const handleSelectPhase = (idx: number) => {
    setSelectedPhaseIdx(idx);
    const selectedPhase = phaseList[idx];

    if (
      selectedPhase?.plannedIngredients &&
      selectedPhase.plannedIngredients.length > 0
    ) {
      const prefilledItems = selectedPhase.plannedIngredients.map(
        createItemFromPlan
      );
      setItems(prefilledItems);
      recalcTotalCost(prefilledItems);
    } else {
      setItems([createEmptyItem()]);
      setTotalCost("");
    }
  };

  const hasPhases = phaseList.length > 0;
  const currentPhase = phaseList[selectedPhaseIdx];
  const currentCampaignPhaseId = currentPhase?.id || campaignPhaseId || "";

  // Parse ingredientFundsAmount
  const ingredientFundsAmountNumber = (() => {
    // Ưu tiên từ phase hiện tại
    if (currentPhase?.ingredientFundsAmount) {
      const n = Number(
        digitsOnly(String(currentPhase.ingredientFundsAmount))
      );
      return isNaN(n) ? 0 : n;
    }
    // Fallback từ params
    const raw = Array.isArray(ingredientFundsAmount)
      ? ingredientFundsAmount[0]
      : ingredientFundsAmount;
    if (!raw) return 0;
    const n = Number(digitsOnly(raw));
    return isNaN(n) ? 0 : n;
  })();

  const recalcTotalCost = (list: typeof items) => {
    const sum = list.reduce((acc, i) => {
      const v = Number(digitsOnly(i.estimatedTotalPrice || "0"));
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
    setTotalCost(sum ? String(sum) : "");
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => {
      if (prev.length === 1) {
        const reset = [createEmptyItem()];
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
    (newItems[idx] as any)[field] = value;

    // Khi đổi quantityValue hoặc quantityUnit => cập nhật quantity ghép string
    if (field === "quantityValue" || field === "quantityUnit") {
      const qv = newItems[idx].quantityValue || "";
      const qu = newItems[idx].quantityUnit || "";
      newItems[idx].quantity = qv && qu ? `${qv}${qu}` : qv || "";
    }

    // Nếu thay đổi quantityValue hoặc estimatedUnitPrice => tự tính thành tiền
    if (
      field === "quantityValue" ||
      field === "estimatedUnitPrice" ||
      field === "quantity"
    ) {
      const qtyNum = parseFloat(newItems[idx].quantityValue || "0");
      const unitPrice = Number(digitsOnly(newItems[idx].estimatedUnitPrice));
      if (!isNaN(qtyNum) && !isNaN(unitPrice)) {
        const total = Math.round(qtyNum * unitPrice);
        newItems[idx].estimatedTotalPrice = total ? String(total) : "";
      } else {
        newItems[idx].estimatedTotalPrice = "";
      }
    }

    setItems(newItems);
    recalcTotalCost(newItems);
  };

  const handleSubmit = async () => {
    const totalCostNumber = totalCost ? parseInt(totalCost, 10) : 0;

    const isInvalidBase =
      !currentCampaignPhaseId ||
      !totalCostNumber ||
      items.some(
        (i) =>
          !i.ingredientName ||
          !i.quantityValue ||
          !i.quantityUnit ||
          !i.estimatedUnitPrice ||
          !i.estimatedTotalPrice ||
          !i.supplier
      );

    if (isInvalidBase) {
      showAlert("Vui lòng điền đầy đủ tất cả các trường.");
      return;
    }

    setSubmitting(true);
    try {
      const input = {
        campaignPhaseId: currentCampaignPhaseId,
        totalCost: String(totalCostNumber),
        items: items.map((i) => ({
          ingredientName: i.ingredientName,
          quantity: i.quantityValue, // Chỉ gửi số, không ghép unit
          unit: i.quantityUnit,
          estimatedUnitPrice: Number(digitsOnly(i.estimatedUnitPrice)),
          estimatedTotalPrice: Number(digitsOnly(i.estimatedTotalPrice)),
          supplier: i.supplier,
          plannedIngredientId: i.plannedIngredientId, // null nếu item mới
        })),
      };

      await IngredientService.createIngredientRequest(input);
      showAlert("Gửi yêu cầu nguyên liệu thành công.");
      router.push({
        pathname: "/ingredientRequest",
        params: { campaignPhaseId: currentCampaignPhaseId },
      });
    } catch (err: any) {
      showAlert(err?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalCostNumber = totalCost ? parseInt(totalCost, 10) : 0;
  const isTotalMatchBudget =
    ingredientFundsAmountNumber > 0 &&
    totalCostNumber === ingredientFundsAmountNumber;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading visible={loading} message="Đang tải dữ liệu..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AlertPopup
        visible={alertVisible}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
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
                  onPress={() => handleSelectPhase(idx)}
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

        {/* CARD: Tổng chi phí dự kiến */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng chi phí dự kiến</Text>
          <Text style={styles.cardSubtitle}>
            Hệ thống tự cộng từ các dòng "Thành tiền" (có thể sửa lại nếu cần).
          </Text>

          {ingredientFundsAmountNumber > 0 && (
            <View style={styles.budgetInfoBox}>
              <Text style={styles.budgetLabel}>
                Ngân sách nguyên liệu giai đoạn
              </Text>
              <Text style={styles.budgetValue}>
                {formatVnd(ingredientFundsAmountNumber)} VND
              </Text>
              <Text style={styles.budgetHint}>
                Tổng chi phí bạn nhập phải bằng đúng số tiền này.
              </Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            value={formatVnd(totalCost)}
            onChangeText={(v) => setTotalCost(digitsOnly(v))}
            placeholder="Nhập tổng chi phí (VND)"
            keyboardType="numeric"
          />
        </View>

        {/* CARD: Nguyên liệu dự kiến (từ kế hoạch) */}
        {currentPhase?.plannedIngredients && currentPhase.plannedIngredients.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>📋 Nguyên liệu dự kiến</Text>
                <Text style={styles.cardSubtitle}>
                  Thông tin nguyên liệu từ kế hoạch chiến dịch
                </Text>
              </View>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>
                  {currentPhase.plannedIngredients.length}
                </Text>
              </View>
            </View>

            <View style={styles.plannedList}>
              {currentPhase.plannedIngredients.map((plan, idx) => (
                <View key={plan.id || idx} style={styles.plannedItem}>
                  <Text style={styles.plannedName}>{plan.name}</Text>
                  <Text style={styles.plannedQty}>
                    {plan.quantity} {plan.unit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CARD: Danh sách nguyên liệu */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Danh sách nguyên liệu</Text>
              <Text style={styles.cardSubtitle}>
                Các nguyên liệu đã lên kế hoạch được điền sẵn. Bạn chỉ cần bổ
                sung đơn giá và nhà cung cấp.
              </Text>
            </View>
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{items.length}</Text>
            </View>
          </View>

          {items.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.itemBox,
                item.isFromPlan && styles.itemBoxFromPlan,
              ]}
            >
              <View style={styles.itemHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.itemTitle}>Nguyên liệu #{idx + 1}</Text>
                  {item.isFromPlan && (
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>Từ kế hoạch</Text>
                    </View>
                  )}
                </View>
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
                  <Text style={styles.itemLabel}>Số lượng</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={item.quantityValue}
                      onChangeText={(v) =>
                        handleChangeItem(
                          idx,
                          "quantityValue",
                          v.replace(/,/g, ".").replace(/[^0-9.]/g, "")
                        )
                      }
                      placeholder="Ví dụ: 3"
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      style={[styles.input, styles.unitPickerBtn, { flex: 1 }]}
                      onPress={() => {
                        setUnitPickerItemIdx(idx);
                        setUnitPickerVisible(true);
                      }}
                    >
                      <Text style={styles.unitPickerText}>
                        {item.quantityUnit || "Chọn đơn vị"}
                      </Text>
                      <Text style={styles.unitPickerArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.inlineRow}>
                <View style={styles.inlineCol}>
                  <Text style={styles.itemLabel}>
                    Đơn giá ước tính (VND / đơn vị)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formatVnd(item.estimatedUnitPrice)}
                    onChangeText={(v) =>
                      handleChangeItem(
                        idx,
                        "estimatedUnitPrice",
                        digitsOnly(v)
                      )
                    }
                    placeholder="Ví dụ: 25.000"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.itemLabel}>Thành tiền ước tính (VND)</Text>
              <TextInput
                style={styles.input}
                value={formatVnd(item.estimatedTotalPrice)}
                onChangeText={(v) =>
                  handleChangeItem(
                    idx,
                    "estimatedTotalPrice",
                    digitsOnly(v)
                  )
                }
                placeholder="Hệ thống tự tính"
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
            <Text style={styles.addBtnText}>+ Thêm nguyên liệu mới</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* SUMMARY + BUTTONS BOTTOM (luôn hiển thị) */}
      <View style={styles.buttonRow}>
        <View style={styles.summaryBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Ngân sách</Text>
            <Text style={styles.summaryValue}>
              {ingredientFundsAmountNumber
                ? `${formatVnd(ingredientFundsAmountNumber)} VND`
                : "—"}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={styles.summaryLabel}>Tổng chi phí</Text>
            <Text
              style={[
                styles.summaryValue,
                ingredientFundsAmountNumber > 0 &&
                totalCostNumber > 0 &&
                !isTotalMatchBudget && { color: "#b91c1c" },
              ]}
            >
              {totalCostNumber ? `${formatVnd(totalCost)} VND` : "0 VND"}
            </Text>
          </View>
        </View>

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
          onPress={() =>
            router.push({
              pathname: "/ingredientRequest",
              params: { campaignPhaseId: currentCampaignPhaseId },
            })
          }
        >
          <Text style={styles.secondaryBtnText}>Yêu cầu đã gửi</Text>
        </TouchableOpacity>
      </View>

      {/* UNIT PICKER MODAL */}
      <Modal
        visible={unitPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setUnitPickerVisible(false)}
      >
        <View style={styles.unitModalOverlay}>
          <View style={styles.unitModalContent}>
            <View style={styles.unitModalHeader}>
              <Text style={styles.unitModalTitle}>Chọn đơn vị</Text>
              <TouchableOpacity onPress={() => setUnitPickerVisible(false)}>
                <Text style={styles.unitModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.unitModalScroll} showsVerticalScrollIndicator={false}>
              {UNIT_GROUPS.map((group) => (
                <View key={group.label} style={styles.unitGroup}>
                  <Text style={styles.unitGroupLabel}>{group.label}</Text>
                  <View style={styles.unitChipsWrap}>
                    {group.units.map((unit) => {
                      const isSelected = items[unitPickerItemIdx]?.quantityUnit === unit;
                      return (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.unitChip,
                            isSelected && styles.unitChipActive,
                          ]}
                          onPress={() => {
                            handleChangeItem(unitPickerItemIdx, "quantityUnit", unit);
                            setUnitPickerVisible(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.unitChipText,
                              isSelected && styles.unitChipTextActive,
                            ]}
                          >
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: normalizeFontSize(13),
    color: "#8a7b6e",
  },

  header: {
    paddingHorizontal: "4%",
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(10),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0e4da",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(8),
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  backIcon: {
    color: PRIMARY,
    fontSize: normalizeFontSize(18),
    fontWeight: "800",
    marginRight: moderateScale(4),
  },
  backText: {
    color: PRIMARY,
    fontSize: normalizeFontSize(14),
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: normalizeFontSize(20),
    fontWeight: "800",
    color: "#222",
  },
  headerSubtitle: {
    fontSize: normalizeFontSize(13),
    color: "#8a7b6e",
    marginTop: moderateScale(4),
  },

  scrollContent: {
    paddingHorizontal: "4%",
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(22),
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: normalizeFontSize(17),
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: moderateScale(6),
  },
  cardSubtitle: {
    fontSize: normalizeFontSize(13),
    color: "#8c8c8c",
    marginBottom: moderateScale(10),
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(6),
    position: "relative",
  },
  badgeCount: {
    position: "absolute",
    top: 0,
    right: 0,
    marginTop: moderateScale(2),
    marginRight: moderateScale(4),
    minWidth: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: "#fff5ee",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCountText: {
    color: PRIMARY,
    fontWeight: "800",
    fontSize: normalizeFontSize(13),
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  chip: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2d5c8",
    backgroundColor: "#fff",
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  chipActive: {
    borderColor: PRIMARY,
    backgroundColor: "#fff5ee",
  },
  chipText: {
    fontSize: normalizeFontSize(13),
    color: "#4a4a4a",
    maxWidth: moderateScale(180),
  },
  chipTextActive: {
    color: PRIMARY,
    fontWeight: "700",
  },
  emptyPhaseText: {
    fontSize: normalizeFontSize(13),
    color: "#999",
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    marginBottom: moderateScale(10),
    fontSize: normalizeFontSize(14),
    minHeight: moderateScale(44), // Ensure minimum touch target
  },

  itemBox: {
    backgroundColor: "#fffdf9",
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#f4e3d6",
    padding: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  itemBoxFromPlan: {
    borderColor: "#a7d9c7",
    backgroundColor: "#f0fdf4",
  },
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(6),
  },
  itemTitle: {
    fontWeight: "700",
    fontSize: normalizeFontSize(14),
    color: PRIMARY,
  },
  planBadge: {
    marginLeft: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: 999,
    backgroundColor: "#dcfce7",
  },
  planBadgeText: {
    fontSize: normalizeFontSize(10),
    fontWeight: "600",
    color: "#16a34a",
  },
  removeText: {
    color: "#d64545",
    fontSize: normalizeFontSize(12),
    fontWeight: "700",
  },
  itemLabel: {
    fontWeight: "600",
    fontSize: normalizeFontSize(12),
    color: "#b06437",
    marginBottom: moderateScale(4),
    marginTop: moderateScale(6),
  },

  inlineRow: {
    flexDirection: "row",
    gap: moderateScale(10),
  },
  inlineCol: {
    flex: 1,
  },

  addBtn: {
    marginTop: moderateScale(6),
    paddingVertical: moderateScale(10),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    minHeight: moderateScale(44), // Ensure minimum touch target
  },
  addBtnText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: normalizeFontSize(14),
  },

  buttonRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: "4%",
    paddingBottom: moderateScale(16),
    paddingTop: moderateScale(10),
    backgroundColor: BG,
    flexDirection: "column",
    gap: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: "#e7ddd3",
  },

  summaryBar: {
    flexDirection: "row",
    paddingHorizontal: moderateScale(4),
    marginBottom: moderateScale(2),
  },
  summaryLabel: {
    fontSize: normalizeFontSize(12),
    color: "#8a7b6e",
  },
  summaryValue: {
    fontSize: normalizeFontSize(15),
    fontWeight: "800",
    color: PRIMARY,
    marginTop: moderateScale(2),
  },

  actionBtn: {
    borderRadius: 999,
    paddingVertical: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(48), // Ensure minimum touch target
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
    fontSize: normalizeFontSize(15),
  },
  secondaryBtnText: {
    color: PRIMARY,
    fontWeight: "800",
    fontSize: normalizeFontSize(14),
  },

  budgetInfoBox: {
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "#f4c39a",
    backgroundColor: "#fff7ec",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  budgetLabel: {
    fontSize: normalizeFontSize(12),
    color: "#b06437",
    fontWeight: "600",
  },
  budgetValue: {
    fontSize: normalizeFontSize(15),
    color: PRIMARY,
    fontWeight: "800",
    marginTop: moderateScale(4),
  },
  budgetHint: {
    fontSize: normalizeFontSize(11),
    color: "#8c8c8c",
    marginTop: moderateScale(4),
  },

  // Unit picker button styles
  unitPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  unitPickerText: {
    fontSize: normalizeFontSize(14),
    color: "#333",
  },
  unitPickerArrow: {
    fontSize: normalizeFontSize(9),
    color: "#999",
  },

  // Unit modal styles
  unitModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  unitModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: moderateScale(22),
    borderTopRightRadius: moderateScale(22),
    maxHeight: "70%",
  },
  unitModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: "#f0e4da",
  },
  unitModalTitle: {
    fontSize: normalizeFontSize(17),
    fontWeight: "800",
    color: PRIMARY,
  },
  unitModalClose: {
    fontSize: normalizeFontSize(18),
    color: "#999",
    padding: moderateScale(4),
  },
  unitModalScroll: {
    paddingHorizontal: moderateScale(18),
  },
  unitGroup: {
    marginTop: moderateScale(14),
  },
  unitGroupLabel: {
    fontSize: normalizeFontSize(12),
    fontWeight: "700",
    color: "#8a7b6e",
    marginBottom: moderateScale(10),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  unitChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  unitChip: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2d5c8",
    backgroundColor: "#fff",
    minHeight: moderateScale(40), // Ensure minimum touch target
  },
  unitChipActive: {
    borderColor: PRIMARY,
    backgroundColor: "#fff5ee",
  },
  unitChipText: {
    fontSize: normalizeFontSize(14),
    color: "#4a4a4a",
  },
  unitChipTextActive: {
    color: PRIMARY,
    fontWeight: "700",
  },

  // Planned ingredients section
  plannedList: {
    marginTop: moderateScale(8),
  },
  plannedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    backgroundColor: "#fafafa",
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
  },
  plannedName: {
    fontSize: normalizeFontSize(14),
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  plannedQty: {
    fontSize: normalizeFontSize(14),
    fontWeight: "700",
    color: PRIMARY,
    marginLeft: moderateScale(10),
  },
});
