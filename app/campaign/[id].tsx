import Loading from "@/components/Loading";
import TimelineTabs from "@/components/TimelineTabs";
import CampaignService from "@/services/campaignService";
import DonationService from "@/services/donationService";
import type { CampaignDetail, Phase } from "@/types/api/campaign";
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from "react-native-safe-area-context";

export default function CampaignDetailPage() {
  const router = useRouter();
  // useLocalSearchParams is the correct hook in expo-router for local dynamic params
  const params = useLocalSearchParams() as { id?: string };
  const id = params?.id;
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [donating, setDonating] = useState(false);
  const [donateModal, setDonateModal] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) {
        setError("Campaign id is missing");
        return;
      }
      setLoading(true);
      try {
        const data = await CampaignService.getCampaign(id);
        if (mounted) setCampaign(data);
      } catch (err: any) {
        if (mounted) setError(err?.message || "Failed to load campaign");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleDonateSubmit() {
    if (!id || !amount || amount < 1000) {
      alert("Vui lòng nhập số tiền hợp lệ (tối thiểu 1.000đ)");
      return;
    }
    try {
      setDonating(true);
      setDonateModal(false);
      const result = await DonationService.createDonation({
        amount,
        campaignId: id,
        isAnonymous,
      });
      router.push({
        pathname: "/campaign/qr/[donationId]",
        params: {
          donationId: result.donationId,
          qrCode: result.qrCode,
          bankName: result.bankName,
          bankNumber: result.bankNumber,
          bankAccountName: result.bankAccountName,
          description: result.description,
        },
      });
    } catch (err: any) {
      alert(err?.message || "Không thể tạo giao dịch ủng hộ");
    } finally {
      setDonating(false);
      setAmount(0);
      setIsAnonymous(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={loading || donating} message={donating ? "Đang tạo giao dịch..." : "Loading campaign..."} />

      <TouchableOpacity style={styles.topBack} onPress={() => router.back()}>
        <Text style={styles.topBackText}>‹ Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        {error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : campaign ? (
          <>
            <Image source={{ uri: campaign.coverImage || undefined }} style={styles.image} />
            <View style={styles.content}>
              <Text style={styles.title}>{campaign.title}</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Người tạo:</Text>
                <Text style={styles.value}>{campaign.creator?.full_name || "—"}</Text>
              </View>

              {/* Thông tin tổng quan chiến dịch */}
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Tiến độ gây quỹ</Text>
                <View style={styles.progressBarBox}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.max(0, Math.min(100, Number(campaign.fundingProgress || 0)))}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPercent}>
                    {Math.round(Number(campaign.fundingProgress || 0))}%
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <FontAwesome name="money" size={22} color="#43b46b" style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Đã nhận</Text>
                    <Text style={[styles.infoValue, { color: "#43b46b" }]}>
                      {formatCurrency(campaign.receivedAmount)}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <MaterialIcons name="emoji-events" size={22} color="#f7b500" style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Mục tiêu</Text>
                    <Text style={[styles.infoValue, { color: "#f7b500" }]}>
                      {formatCurrency(campaign.targetAmount)}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <FontAwesome name="user" size={22} color="#4285F4" style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Lượt đóng góp</Text>
                    <Text style={[styles.infoValue, { color: "#4285F4" }]}>
                      {campaign.donationCount ?? 0}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={22} color="#888" style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Ngày bắt đầu</Text>
                    <Text style={styles.infoValue}>
                      {campaign.fundraisingStartDate
                        ? new Date(campaign.fundraisingStartDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={22} color="#888" style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Ngày kết thúc</Text>
                    <Text style={styles.infoValue}>
                      {campaign.fundraisingEndDate
                        ? new Date(campaign.fundraisingEndDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.description}>{campaign.description || "—"}</Text>

              {/* Tabs: Giai đoạn & Mốc thời gian */}
              <TimelineTabs campaign={campaign}>
                {/* Tab "Giai đoạn" sẽ render các giai đoạn */}
                {(campaign.phases && campaign.phases.length) ? (
                  campaign.phases.map((p: Phase) => (
                    <PhaseBudget key={p.id} phase={p} />
                  ))
                ) : (
                  <Text style={styles.description}>Chưa có giai đoạn</Text>
                )}
              </TimelineTabs>

              {/* Nút ủng hộ */}
              <TouchableOpacity style={styles.primaryButton} onPress={() => setDonateModal(true)}>
                <Text style={styles.primaryButtonText}>Ủng hộ</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.center}>
            <Text style={styles.placeholder}>No campaign selected</Text>
          </View>
        )}
      </ScrollView>

      {/* Popup nhập thông tin ủng hộ */}
      <Modal visible={donateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setDonateModal(false)}>
              <MaterialIcons name="close" size={28} color="#ad4e28" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ủng hộ chiến dịch</Text>
            <Text style={styles.modalDesc}>
              <View style={styles.loginNoteBox}>
                <Text style={styles.loginNoteText}>
                  Nếu bạn muốn lưu họ tên chuyển khoản của mình, vui lòng <Text style={styles.loginNoteBold}>đăng nhập</Text> hoặc <Text style={styles.loginNoteBold}>đăng ký tài khoản</Text>.
                  Nếu không đăng nhập, mọi thông tin ủng hộ của bạn sẽ bị <Text style={styles.loginNoteBold}>ẩn danh</Text>.
                </Text>
              </View>
            </Text>
            <Text style={styles.modalLabel}>Nhập số tiền ủng hộ *</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={amount ? amount.toString() : ""}
                onChangeText={v => setAmount(Number(v.replace(/[^0-9]/g, "")))}
                placeholder="0"
                placeholderTextColor="#bdbdbd"
              />
              <Text style={styles.amountUnit}>VNĐ</Text>
            </View>
            <View style={styles.quickRow}>
              {[50000, 100000, 200000, 500000].map(v => (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.quickBtn,
                    amount === v && styles.quickBtnActive,
                  ]}
                  onPress={() => setAmount(v)}
                >
                  <LinearGradient
                    colors={amount === v ? ['#ffb86c', '#ad4e28'] : ['#f7f7f7', '#f7f7f7']}
                    style={styles.quickBtnGradient}
                  >
                    <Text style={amount === v ? styles.quickTextActive : styles.quickText}>{v / 1000}k</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
                {isAnonymous && <View style={styles.checkboxDot} />}
              </View>
              <Text style={styles.checkLabel}>Ủng hộ ẩn danh</Text>
            </TouchableOpacity>
            <LinearGradient
              colors={['#ffb86c', '#ad4e28']}
              start={[0, 0]}
              end={[1, 1]}
              style={styles.modalDonateBtn}
            >
              <TouchableOpacity
                style={{ width: "100%", alignItems: "center" }}
                onPress={handleDonateSubmit}
              >
                <Text style={styles.modalDonateText}>Ủng hộ</Text>
              </TouchableOpacity>
            </LinearGradient>
            <Text style={styles.modalNote}>
              <Text style={{ fontWeight: "700", color: "#ad4e28" }}>Lưu ý quan trọng:</Text> Vui lòng chuyển khoản đúng số tiền và nội dung để hệ thống có thể xác nhận tự động. Sau khi chuyển khoản thành công, khoản ủng hộ sẽ được cập nhật trong vòng 5-10 phút.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PhaseBudget({ phase }: { phase: Phase }) {
  const ingredientFunds = Number(phase.ingredientFundsAmount ?? 0);
  const cookingFunds = Number(phase.cookingFundsAmount ?? 0);
  const deliveryFunds = Number(phase.deliveryFundsAmount ?? 0);

  const total = ingredientFunds + cookingFunds + deliveryFunds;

  const ingredientPercent = Number(phase.ingredientBudgetPercentage ?? 0);
  const cookingPercent = Number(phase.cookingBudgetPercentage ?? 0);
  const deliveryPercent = Number(phase.deliveryBudgetPercentage ?? 0);

  const ingredientReceived = ingredientFunds;
  const cookingReceived = cookingFunds;
  const deliveryReceived = deliveryFunds;

  const allFunds = ingredientFunds + cookingFunds + deliveryFunds;
  const ingredientExpected = Math.round(ingredientPercent / 100 * allFunds);
  const cookingExpected = Math.round(cookingPercent / 100 * allFunds);
  const deliveryExpected = Math.round(deliveryPercent / 100 * allFunds);

  const chartData = [
    {
      name: 'Nguyên liệu',
      population: ingredientPercent,
      color: '#ff8800',
      legendFontColor: '#222',
      legendFontSize: 14,
    },
    {
      name: 'Nấu ăn',
      population: cookingPercent,
      color: '#4b5cff',
      legendFontColor: '#222',
      legendFontSize: 14,
    },
    {
      name: 'Vận chuyển',
      population: deliveryPercent,
      color: '#43b46b',
      legendFontColor: '#222',
      legendFontSize: 14,
    },
  ];

  return (
    <View style={phaseBudgetStyles.box}>
      <Text style={phaseBudgetStyles.title}>{phase.phaseName} - {phase.location}</Text>
      <Text style={phaseBudgetStyles.totalLabel}>Tổng giai đoạn</Text>
      <Text style={phaseBudgetStyles.totalValue}>{formatCurrency(total)}</Text>
      <View style={phaseBudgetStyles.row}>
        <PieChart
          data={chartData}
          width={120}
          height={120}
          chartConfig={{
            color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          }}
          accessor={"population"}
          backgroundColor={"transparent"}
          paddingLeft={"0"}
          hasLegend={false}
          center={[0, 0]}
        />
        <View style={{ marginLeft: 18, flex: 1 }}>
          {chartData.map((item, idx) => (
            <View key={item.name} style={phaseBudgetStyles.legendRow}>
              <View style={[phaseBudgetStyles.legendDot, { backgroundColor: item.color }]} />
              <Text style={phaseBudgetStyles.legendLabel}>{item.name}</Text>
              <Text style={phaseBudgetStyles.legendPercent}>{item.population}%</Text>
            </View>
          ))}
        </View>
      </View>
      {/* Nguyên liệu */}
      <View style={[phaseBudgetStyles.section, { borderColor: "#ff8800" }]}>
        <View style={phaseBudgetStyles.sectionHeader}>
          <View style={[phaseBudgetStyles.sectionBar, { backgroundColor: "#ff8800" }]} />
          <Text style={phaseBudgetStyles.sectionTitle}>Nguyên liệu</Text>
          <View style={phaseBudgetStyles.sectionPercent}>
            <Text style={{ color: "#ff8800", fontWeight: "700" }}>{ingredientPercent}%</Text>
          </View>
        </View>
        <Text style={phaseBudgetStyles.sectionReceived}>Đã nhận: <Text style={{ fontWeight: "700" }}>{formatCurrency(ingredientReceived)}</Text></Text>
        <Text style={phaseBudgetStyles.sectionExpected}>Dự kiến: {formatCurrency(ingredientExpected)}</Text>
        <View style={phaseBudgetStyles.progressBarBg}>
          <View style={[phaseBudgetStyles.progressBarFill, { backgroundColor: "#ff8800", width: `${Math.min(100, ingredientReceived / (ingredientExpected || 1) * 100)}%` }]} />
        </View>
      </View>
      {/* Nấu ăn */}
      <View style={[phaseBudgetStyles.section, { borderColor: "#4b5cff" }]}>
        <View style={phaseBudgetStyles.sectionHeader}>
          <View style={[phaseBudgetStyles.sectionBar, { backgroundColor: "#4b5cff" }]} />
          <Text style={phaseBudgetStyles.sectionTitle}>Nấu ăn</Text>
          <View style={phaseBudgetStyles.sectionPercent}>
            <Text style={{ color: "#4b5cff", fontWeight: "700" }}>{cookingPercent}%</Text>
          </View>
        </View>
        <Text style={phaseBudgetStyles.sectionReceived}>Đã nhận: <Text style={{ fontWeight: "700" }}>{formatCurrency(cookingReceived)}</Text></Text>
        <Text style={phaseBudgetStyles.sectionExpected}>Dự kiến: {formatCurrency(cookingExpected)}</Text>
        <View style={phaseBudgetStyles.progressBarBg}>
          <View style={[phaseBudgetStyles.progressBarFill, { backgroundColor: "#4b5cff", width: `${Math.min(100, cookingReceived / (cookingExpected || 1) * 100)}%` }]} />
        </View>
      </View>
      {/* Vận chuyển */}
      <View style={[phaseBudgetStyles.section, { borderColor: "#43b46b" }]}>
        <View style={phaseBudgetStyles.sectionHeader}>
          <View style={[phaseBudgetStyles.sectionBar, { backgroundColor: "#43b46b" }]} />
          <Text style={phaseBudgetStyles.sectionTitle}>Vận chuyển</Text>
          <View style={phaseBudgetStyles.sectionPercent}>
            <Text style={{ color: "#43b46b", fontWeight: "700" }}>{deliveryPercent}%</Text>
          </View>
        </View>
        <Text style={phaseBudgetStyles.sectionReceived}>Đã nhận: <Text style={{ fontWeight: "700" }}>{formatCurrency(deliveryReceived)}</Text></Text>
        <Text style={phaseBudgetStyles.sectionExpected}>Dự kiến: {formatCurrency(deliveryExpected)}</Text>
        <View style={phaseBudgetStyles.progressBarBg}>
          <View style={[phaseBudgetStyles.progressBarFill, { backgroundColor: "#43b46b", width: `${Math.min(100, deliveryReceived / (deliveryExpected || 1) * 100)}%` }]} />
        </View>
      </View>
    </View>
  );
}

function formatCurrency(v?: string | number | null) {
  const n = Number(v || 0);
  return n.toLocaleString("vi-VN") + " đ";
}

const PRIMARY = "#ad4e28";
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topBack: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: PRIMARY,
  },
  topBackText: { color: "#fff", fontWeight: "700" },

  scroll: { paddingTop: 56, paddingBottom: 32 },
  image: { width: "100%", height: 240, backgroundColor: "#eee" },
  content: { padding: 16 },

  title: { fontSize: 20, fontWeight: "800", color: "#111", marginBottom: 12 },
  row: { flexDirection: "row", marginBottom: 8 },
  label: { width: 110, color: "#666", fontWeight: "700" },
  value: { flex: 1, color: "#333" },

  infoBox: {
    backgroundColor: "#fdf7f0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoTitle: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 8,
    color: "#ad4e28",
  },
  progressBarBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#e6e6e6",
    borderRadius: 8,
    marginRight: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#ff8800",
    borderRadius: 8,
  },
  progressPercent: {
    fontWeight: "700",
    color: "#ad4e28",
    fontSize: 13,
    minWidth: 32,
    textAlign: "right",
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  infoItem: {
    width: "48%",
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  infoIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 2,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 12, marginBottom: 8, color: PRIMARY },

  description: { color: "#333", lineHeight: 20 },

  phase: { marginBottom: 12, padding: 12, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#f0e6e1" },
  phaseTitle: { fontWeight: "800", marginBottom: 6 },
  phaseMeta: { color: "#666", fontSize: 13, marginBottom: 4 },
  phaseAmounts: { marginTop: 8 },
  phaseAmount: { color: PRIMARY, fontWeight: "700" },

  primaryButton: { marginTop: 16, backgroundColor: PRIMARY, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "800" },

  center: { padding: 24, alignItems: "center" },
  errorText: { color: "red" },
  placeholder: { color: "#666" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 26,
    alignItems: "center",
    shadowColor: "#ad4e28",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    position: "relative",
  },
  modalCloseIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ad4e28",
    marginBottom: 8,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  modalDesc: {
    fontSize: 15,
    color: "#555",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  loginNoteBox: {
    backgroundColor: "#e3f0ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    marginTop: 0,
    borderWidth: 1,
    borderColor: "#b3d1ff",
    alignItems: "center",
    justifyContent: "center",
  },
  loginNoteText: {
    color: "#1565c0",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  loginNoteBold: {
    color: "#1565c0",
    fontWeight: "900",
  },
  modalLabel: {
    fontWeight: "700",
    color: "#ad4e28",
    alignSelf: "flex-start",
    marginBottom: 4,
    marginTop: 8,
    fontSize: 15,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  amountInput: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 22,
    color: "#222",
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: "#ffb86c",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  amountUnit: {
    fontWeight: "800",
    color: "#ad4e28",
    fontSize: 18,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
    marginTop: 2,
  },
  quickBtn: {
    borderRadius: 12,
    marginHorizontal: 2,
    overflow: "hidden",
    borderWidth: 0,
  },
  quickBtnGradient: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  quickBtnActive: {
    borderWidth: 2,
    borderColor: "#ad4e28",
  },
  quickText: {
    color: "#ad4e28",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.5,
  },
  quickTextActive: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.5,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: "#ad4e28",
    backgroundColor: "#fff",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#ad4e28",
    borderColor: "#ad4e28",
  },
  checkboxDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  checkLabel: {
    color: "#ad4e28",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  modalDonateBtn: {
    borderRadius: 12,
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  modalDonateText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.5,
    paddingVertical: 10,
  },
  modalNote: {
    backgroundColor: "#fffbe6",
    borderRadius: 10,
    padding: 12,
    color: "#ad4e28",
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
    lineHeight: 20,
  },
});

const phaseBudgetStyles = StyleSheet.create({
  box: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontWeight: "900",
    fontSize: 18,
    color: "#ad4e28",
    marginBottom: 2,
  },
  totalLabel: {
    color: "#888",
    fontWeight: "700",
    fontSize: 14,
    marginTop: 2,
  },
  totalValue: {
    color: "#ad4e28",
    fontWeight: "900",
    fontSize: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendLabel: {
    color: "#222",
    fontWeight: "700",
    fontSize: 14,
    marginRight: 8,
  },
  legendPercent: {
    color: "#888",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: "auto",
  },
  section: {
    backgroundColor: "#f7f8fa",
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  sectionBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 15,
    color: "#222",
    marginRight: 8,
  },
  sectionPercent: {
    marginLeft: "auto",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  sectionReceived: {
    color: "#222",
    fontSize: 14,
    marginBottom: 2,
  },
  sectionExpected: {
    color: "#888",
    fontSize: 13,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 7,
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
    marginTop: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
});
