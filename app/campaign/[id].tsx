import Loading from "@/components/Loading";
import TimelineTabs from "@/components/TimelineTabs";
import CampaignService from "@/services/campaignService";
import DonationService from "@/services/donationService";
import type { CampaignDetail, Phase } from "@/types/api/campaign";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import RenderHTML from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";

import DonateModal from "@/components/DonateModal";
import DonationList from "@/components/DonationList";
import PhaseBudget from "@/components/PhaseBudget";
import RefundPolicyPopup from "@/components/RefundPolicyPopup";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIMARY = "#ad4e28";
const { width } = useWindowDimensions();

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams() as { id?: string };
  const id = params?.id;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [donating, setDonating] = useState(false);
  const [donateModal, setDonateModal] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [donationStats, setDonationStats] = useState<{
    totalDonations: number;
    totalReceived: string;
    transactions: {
      no: number;
      donorName: string;
      receivedAmount: string;
      transactionDateTime: string;
    }[];
  } | null>(null);

  const [showRefundPolicy, setShowRefundPolicy] = useState(false);
  const [agreedRefundPolicy, setAgreedRefundPolicy] = useState(false);

  // Giả sử có biến kiểm tra đăng nhập
  const isLoggedIn = true; // Thay bằng logic thực tế

  useEffect(() => {
    // Kiểm tra đã đồng ý quy định hoàn tiền chưa
    AsyncStorage.getItem("agreedRefundPolicy").then(val => {
      setAgreedRefundPolicy(val === "true");
    });
  }, []);

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

  useEffect(() => {
    async function loadDonationStats() {
      if (!id) return;
      try {
        const data = await DonationService.listDonationStatements({
          campaignId: id,
          limit: 5,
          page: 1,
        });
        setDonationStats({
          totalDonations: data.totalDonations,
          totalReceived: data.totalReceived,
          transactions: data.transactions,
        });
      } catch {
        setDonationStats(null);
      }
    }
    loadDonationStats();
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

  const handleDonatePress = async () => {
    if (isLoggedIn && !agreedRefundPolicy) {
      setShowRefundPolicy(true);
    } else {
      setDonateModal(true);
    }
  };

  const handleAgreeRefundPolicy = async () => {
    await AsyncStorage.setItem("agreedRefundPolicy", "true");
    setAgreedRefundPolicy(true);
    setShowRefundPolicy(false);
    setDonateModal(true);
  };

  const progress = Math.max(0, Math.min(100, Number(campaign?.fundingProgress || 0)));

  return (
    <SafeAreaView style={styles.container}>
      <Loading
        visible={loading || donating}
        message={donating ? "Đang tạo giao dịch..." : "Loading campaign..."}
      />

      {/* Header giống login/signup */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Quay lại</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : campaign ? (
          <>
            {/* Ảnh cover */}
            <Image
              source={{ uri: campaign.coverImage || undefined }}
              style={styles.image}
            />

            {/* Nội dung */}
            <View style={styles.content}>
              <Text style={styles.title}>{campaign.title}</Text>
              <View style={styles.creatorRow}>
                <Text style={styles.creatorLabel}>Người tạo:</Text>
                <Text style={styles.creatorName}>
                  {campaign.creator?.full_name || "—"}
                </Text>
              </View>

              {/* Card tiến độ gây quỹ - THAY THẾ BẰNG CARD MỚI */}
              <View style={styles.campaignCard}>
                {/* Tổ chức / Người đại diện */}
                <View style={styles.orgRow}>
                  <Ionicons name="business" size={22} color="#ff8800" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.orgName}>
                      {campaign.creator?.full_name || "—"}
                    </Text>
                    <TouchableOpacity>
                      <Text style={styles.orgLink}>Xem sao kê tài khoản →</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Thông tin chiến dịch */}
                <View style={styles.infoTitleRow}>
                  <Ionicons name="information-circle" size={18} color="#222" />
                  <Text style={styles.infoTitle2}>Thông tin chiến dịch</Text>
                </View>
                <View style={styles.campaignMetaRow}>
                  <View style={styles.campaignMetaCol}>
                    {/* Đổi sang FontAwesome bullseye */}
                    <FontAwesome name="bullseye" size={16} color="#ad4e28" />
                    <Text style={styles.campaignMetaLabel}>Mục tiêu chiến dịch</Text>
                    <Text style={styles.campaignMetaValue}>
                      {formatCurrency(campaign.targetAmount)}
                    </Text>
                  </View>
                  <View style={styles.campaignMetaCol}>
                    <Ionicons name="time-outline" size={16} color="#4285F4" />
                    <Text style={styles.campaignMetaLabel}>Thời gian còn lại</Text>
                    <Text style={styles.campaignMetaValue}>
                      {getDaysLeft(campaign.fundraisingEndDate)}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.campaignProgressBarBg}>
                  <View style={[styles.campaignProgressBarFill, { width: `${progress}%` }]} />
                </View>

                {/* Đã đạt được */}
                <View style={styles.campaignAchievedRow}>
                  <Text style={styles.campaignAchievedText}>
                    {formatCurrency(campaign.receivedAmount)} / {formatCurrency(campaign.targetAmount)}
                  </Text>
                  <Text style={styles.campaignAchievedPercent}>{Math.round(progress)}%</Text>
                </View>

                {/* Nút ủng hộ */}
                <TouchableOpacity
                  style={styles.campaignDonateBtn}
                  onPress={handleDonatePress}
                >
                  <Text style={styles.campaignDonateBtnText}>Ủng hộ</Text>
                </TouchableOpacity>

                {/* Nút chỉ đường */}
                <TouchableOpacity style={styles.campaignDirectionBtn}>
                  <Ionicons name="navigate" size={18} color="#ad4e28" />
                  <Text style={styles.campaignDirectionBtnText}>Chỉ đường</Text>
                </TouchableOpacity>

                {/* Chia sẻ */}
                <TouchableOpacity style={styles.campaignShareBtn}>
                  <Text style={styles.campaignShareText}>
                    Chia sẻ chiến dịch để lan tỏa yêu thương
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Mô tả */}
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <RenderHTML
                contentWidth={width}
                source={{ html: campaign.description || "<p>—</p>" }}
                baseStyle={styles.descriptionHtml}
              />


              {/* Danh sách ủng hộ */}
              <DonationList donationStats={donationStats} campaign={campaign} />

              {/* Giai đoạn / mốc thời gian */}
              <TimelineTabs campaign={campaign}>
                {campaign.phases && campaign.phases.length ? (
                  campaign.phases.map((p: Phase) => <PhaseBudget key={p.id} phase={p} />)
                ) : (
                  <Text style={styles.description}>Chưa có giai đoạn</Text>
                )}
              </TimelineTabs>
            </View>
          </>
        ) : (
          <View style={styles.center}>
            <Text style={styles.placeholder}>No campaign selected</Text>
          </View>
        )}
      </ScrollView>

      {/* Popup nhập thông tin ủng hộ */}
      <DonateModal
        visible={donateModal}
        onClose={() => setDonateModal(false)}
        amount={amount}
        setAmount={setAmount}
        isAnonymous={isAnonymous}
        setIsAnonymous={setIsAnonymous}
        handleDonateSubmit={handleDonateSubmit}
        donating={donating}
      />
      <RefundPolicyPopup
        visible={showRefundPolicy}
        onClose={() => setShowRefundPolicy(false)}
        onAgree={handleAgreeRefundPolicy}
      />
    </SafeAreaView>
  );
}

function formatCurrency(v?: string | number | null) {
  const n = Number(v || 0);
  return n.toLocaleString("vi-VN") + " đ";
}

function getDaysLeft(endDate?: string | null) {
  if (!endDate) return "—";
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "#fff",
    zIndex: 10,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  backText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  scroll: {
    paddingBottom: 32,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 8,
    color: PRIMARY,
    letterSpacing: 0.2,
  },
  description: {
    color: "#444",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: "400",
  },
  descriptionHtml: {
    color: "#444",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },

  image: {
    width: "100%",
    height: 230,
    backgroundColor: "#eee",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  creatorRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  creatorLabel: {
    color: "#777",
    fontWeight: "600",
    marginRight: 4,
  },
  creatorName: {
    color: "#333",
    fontWeight: "600",
  },

  campaignCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  orgRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  orgName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#ff8800",
  },
  orgLink: {
    color: "#ff8800",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 2,
  },
  infoTitle2: {
    fontWeight: "700",
    fontSize: 15,
    color: "#222",
    marginLeft: 6,
  },
  campaignMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  campaignMetaCol: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  campaignMetaLabel: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  campaignMetaValue: {
    color: "#222",
    fontWeight: "700",
    fontSize: 15,
  },
  campaignProgressBarBg: {
    height: 8,
    backgroundColor: "#f3f3f3",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
    marginTop: 2,
  },
  campaignProgressBarFill: {
    height: "100%",
    backgroundColor: "#ad4e28",
  },
  campaignAchievedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  campaignAchievedText: {
    color: "#ad4e28",
    fontWeight: "700",
    fontSize: 16,
  },
  campaignAchievedPercent: {
    color: "#888",
    fontWeight: "700",
    fontSize: 15,
  },
  campaignDonateBtn: {
    backgroundColor: "#ad4e28",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  campaignDonateBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  campaignDirectionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
    marginBottom: 8,
  },
  campaignDirectionBtnText: {
    color: "#ad4e28",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 6,
  },
  campaignShareBtn: {
    alignItems: "center",
    marginTop: 2,
  },
  campaignShareText: {
    color: "#ff8800",
    fontSize: 13,
    fontWeight: "600",
  },

  center: { padding: 24, alignItems: "center" },
  errorText: { color: "red" },
  placeholder: { color: "#666" },
});
