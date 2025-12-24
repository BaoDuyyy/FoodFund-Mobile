import Loading from "@/components/Loading";
import { PostsSection, SectionDivider } from "@/components/PostCard";
import TimelineTabs from "@/components/TimelineTabs";
import CampaignService from "@/services/campaignService";
import DonationService from "@/services/donationService";
import GuestMode from "@/services/guestMode";
import OrganizationService from "@/services/organizationService";
import PostService from "@/services/postService";
import type { CampaignDetail, Phase } from "@/types/api/campaign";
import type { Post } from "@/types/api/post";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHTML from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";

import DonateModal from "@/components/DonateModal";
import DonationList from "@/components/DonationList";
import PhaseBudget from "@/components/PhaseBudget";
import RefundPolicyPopup from "@/components/RefundPolicyPopup";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIMARY = "#ad4e28";

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

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams() as { id?: string };
  const id = params?.id;
  const { width } = useWindowDimensions();

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

  // 👇 đại diện tổ chức (id cần truyền sang /statement)
  const [representativeId, setRepresentativeId] = useState<string | null>(null);

  // Guest mode state
  const [isGuest, setIsGuest] = useState(false);

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("agreedRefundPolicy").then((val) => {
      setAgreedRefundPolicy(val === "true");
    });
    // Check guest mode
    GuestMode.isGuest().then((guest) => {
      setIsGuest(guest);
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

  // 👇 Khi đã có campaign và organizationId → gọi OrganizationService lấy representative.id
  useEffect(() => {
    if (!campaign?.organization?.id) return;

    let mounted = true;
    const loadOrg = async () => {
      try {
        const org = await OrganizationService.getOrganizationById(
          campaign.organization!.id
        );
        if (!mounted) return;
        const repId = org?.representative?.id ?? null;
        setRepresentativeId(repId);
      } catch (err) {
        if (mounted) setRepresentativeId(null);
      }
    };

    loadOrg();
    return () => {
      mounted = false;
    };
  }, [campaign?.organization?.id]);

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

  // Load posts for this campaign
  useEffect(() => {
    let mounted = true;
    async function loadPosts() {
      if (!id) return;
      try {
        const data = await PostService.getPostsByCampaign({
          campaignId: id,
          limit: 10,
          offset: 0,
        });
        if (mounted) setPosts(data);
      } catch (err) {
        // Error loading posts
      }
    }
    loadPosts();
    return () => { mounted = false; };
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
    if (!isGuest && !agreedRefundPolicy) {
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

  // 👇 nhấn "Xem sao kê tài khoản →"
  const handleViewStatement = () => {
    if (!representativeId) return;
    // router.push({
    //   pathname: "/statement",
    //   params: { representativeId },
    // });
  };

  const progress = Math.max(
    0,
    Math.min(100, Number(campaign?.fundingProgress || 0))
  );

  const headerContent = () => {
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (!campaign) {
      return (
        <View style={styles.center}>
          <Text style={styles.placeholder}>No campaign selected</Text>
        </View>
      );
    }

    return (
      <>
        {/* Cover with overlay back button */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: campaign.coverImage || undefined }}
            style={styles.image}
          />
          <TouchableOpacity onPress={() => router.back()} style={styles.overlayBackBtn}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
            <Text style={styles.overlayBackText}>Quay lại</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Tiêu đề + tổ chức */}
          <Text style={styles.title}>{campaign.title}</Text>

          <View style={styles.creatorRow}>
            <Text style={styles.creatorLabel}>Tổ chức nhận quyên góp:</Text>
            <Text style={styles.creatorName}>
              {campaign.organization?.name ||
                campaign.creator?.full_name ||
                "—"}
            </Text>
          </View>

          {/* Card tiến độ + thông tin tổ chức */}
          <View style={styles.campaignCard}>
            <View style={styles.orgRow}>
              <Ionicons name="business" size={22} color="#ff8800" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.orgName}>
                  {campaign.organization?.name ||
                    campaign.creator?.full_name ||
                    "—"}
                </Text>

                <TouchableOpacity
                  onPress={handleViewStatement}
                  disabled={!representativeId}
                >
                  <Text
                    style={[
                      styles.orgLink,
                      !representativeId && { opacity: 0.5 },
                    ]}
                  >
                    Xem sao kê tài khoản →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ... phần còn lại giữ nguyên ... */}
            <View style={styles.infoTitleRow}>
              <Ionicons name="information-circle" size={18} color="#222" />
              <Text style={styles.infoTitle2}>Thông tin chiến dịch</Text>
            </View>

            <View style={styles.campaignMetaRow}>
              <View style={styles.campaignMetaCol}>
                <FontAwesome name="bullseye" size={16} color={PRIMARY} />
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

            <View style={styles.campaignProgressBarBg}>
              <View
                style={[
                  styles.campaignProgressBarFill,
                  { width: `${progress}%` },
                ]}
              />
            </View>

            <View style={styles.campaignAchievedRow}>
              <Text style={styles.campaignAchievedText}>
                {formatCurrency(campaign.receivedAmount)} /{" "}
                {formatCurrency(campaign.targetAmount)}
              </Text>
              <Text style={styles.campaignAchievedPercent}>
                {Math.round(progress)}%
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.campaignDonateBtn}
                onPress={handleDonatePress}
                activeOpacity={0.85}
              >
                <Ionicons name="heart" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.campaignDonateBtnText}>Ủng hộ ngay</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.campaignDirectionBtn} activeOpacity={0.7}>
                <Ionicons name="navigate" size={16} color={PRIMARY} />
                <Text style={styles.campaignDirectionBtnText}>Chỉ đường</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.campaignShareBtn} activeOpacity={0.7}>
              <Ionicons name="share-social-outline" size={16} color="#ff8800" style={{ marginRight: 4 }} />
              <Text style={styles.campaignShareText}>
                Chia sẻ chiến dịch
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

          {/* Divider */}
          <SectionDivider />

          {/* Bài viết mới */}
          <PostsSection
            posts={posts}
            onPostPress={() => { }}
            onLike={async (post) => {
              try {
                if (post.isLikedByMe) {
                  await PostService.unlikePost(post.id);
                } else {
                  await PostService.likePost(post.id);
                }
                // Reload posts
                const updated = await PostService.getPostsByCampaign({ campaignId: id!, limit: 10, offset: 0 });
                setPosts(updated);
              } catch (err) {
                // Like error
              }
            }}
            onComment={() => { }}
            onShare={() => { }}
          />

          {/* Divider */}
          <SectionDivider />

          {/* Timeline / Giai đoạn */}
          <TimelineTabs campaign={campaign}>
            {campaign.phases && campaign.phases.length ? (
              campaign.phases.map((p: Phase) => (
                <PhaseBudget key={p.id} phase={p} />
              ))
            ) : (
              <Text style={styles.description}>Chưa có giai đoạn</Text>
            )}
          </TimelineTabs>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Loading
        visible={loading || donating}
        message={donating ? "Đang tạo giao dịch..." : "Loading campaign..."}
      />

      <FlatList
        data={[1]}
        keyExtractor={() => "header"}
        renderItem={null as any}
        ListHeaderComponent={headerContent}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      />

      <DonateModal
        visible={donateModal}
        onClose={() => setDonateModal(false)}
        amount={amount}
        setAmount={setAmount}
        isAnonymous={isAnonymous}
        setIsAnonymous={setIsAnonymous}
        handleDonateSubmit={handleDonateSubmit}
        donating={donating}
        isGuest={isGuest}
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
  const diff = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : 0;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  scroll: {
    paddingBottom: moderateScale(28),
  },

  // Image with overlay back button
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: moderateScale(240),
    backgroundColor: "#ddd",
  },
  overlayBackBtn: {
    position: "absolute",
    top: moderateScale(44),
    left: moderateScale(12),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
  },
  overlayBackText: {
    color: "#fff",
    fontSize: normalizeFontSize(13),
    fontWeight: "600",
    marginLeft: moderateScale(2),
  },

  sectionTitle: {
    fontSize: normalizeFontSize(16),
    fontWeight: "800",
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
    color: PRIMARY,
    letterSpacing: 0.2,
  },
  description: {
    color: "#444",
    fontSize: normalizeFontSize(14),
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(10),
    fontWeight: "400",
  },
  descriptionHtml: {
    color: "#444",
    fontSize: normalizeFontSize(14),
    lineHeight: moderateScale(20),
    fontWeight: "400",
  },

  content: {
    paddingHorizontal: "4%",
    paddingTop: moderateScale(14),
  },

  title: {
    fontSize: normalizeFontSize(18),
    fontWeight: "800",
    color: "#111",
    marginBottom: moderateScale(8),
  },
  creatorRow: {
    flexDirection: "row",
    marginBottom: moderateScale(10),
  },
  creatorLabel: {
    color: "#777",
    fontWeight: "600",
    marginRight: moderateScale(4),
    fontSize: normalizeFontSize(13),
  },
  creatorName: {
    color: "#333",
    fontWeight: "600",
    fontSize: normalizeFontSize(13),
  },

  campaignCard: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    marginBottom: moderateScale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  orgRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  orgName: {
    fontWeight: "700",
    fontSize: normalizeFontSize(15),
    color: "#ff8800",
  },
  orgLink: {
    color: "#ff8800",
    fontSize: normalizeFontSize(12),
    fontWeight: "600",
    marginTop: moderateScale(2),
  },
  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(6),
    marginTop: moderateScale(2),
  },
  infoTitle2: {
    fontWeight: "700",
    fontSize: normalizeFontSize(14),
    color: "#222",
    marginLeft: moderateScale(6),
  },
  campaignMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: moderateScale(8),
  },
  campaignMetaCol: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: moderateScale(2),
  },
  campaignMetaLabel: {
    color: "#888",
    fontSize: normalizeFontSize(12),
    fontWeight: "500",
    marginTop: moderateScale(2),
  },
  campaignMetaValue: {
    color: "#222",
    fontWeight: "700",
    fontSize: normalizeFontSize(14),
  },
  campaignProgressBarBg: {
    height: moderateScale(7),
    backgroundColor: "#f3f3f3",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: moderateScale(8),
    marginTop: moderateScale(2),
  },
  campaignProgressBarFill: {
    height: "100%",
    backgroundColor: "#ad4e28",
  },
  campaignAchievedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(8),
  },
  campaignAchievedText: {
    color: "#ad4e28",
    fontWeight: "700",
    fontSize: normalizeFontSize(15),
  },
  campaignAchievedPercent: {
    color: "#888",
    fontWeight: "700",
    fontSize: normalizeFontSize(14),
  },
  // Action buttons row
  actionButtonsRow: {
    flexDirection: "row",
    gap: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  campaignDonateBtn: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: PRIMARY,
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(14),
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  campaignDonateBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: normalizeFontSize(15),
  },
  campaignDirectionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: PRIMARY,
    paddingVertical: moderateScale(14),
  },
  campaignDirectionBtnText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: normalizeFontSize(13),
    marginLeft: moderateScale(4),
  },
  campaignShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(8),
  },
  campaignShareText: {
    color: "#ff8800",
    fontSize: normalizeFontSize(13),
    fontWeight: "600",
  },

  center: { padding: moderateScale(22), alignItems: "center" },
  errorText: { color: "red", fontSize: normalizeFontSize(13) },
  placeholder: { color: "#666", fontSize: normalizeFontSize(13) },
});
