import AppHeader from "@/components/AppHeader";
import EmptyState from "@/components/EmptyState";
import Loading from "@/components/Loading";
import { PostsSection, SectionDivider } from "@/components/PostCard";
import { PRIMARY } from "@/constants/colors";
import CampaignService from "@/services/campaignService";
import PostService from "@/services/postService";
import WalletService from "@/services/walletService";
import type { CampaignItem } from "@/types/api/campaign";
import type { Post } from "@/types/api/post";
import type { SystemWallet } from "@/types/api/wallet";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
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

// Responsive campaign card width
const CAMPAIGN_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.68, 300);

// Animated Counter Component
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: any;
  suffix?: string;
}

function AnimatedCounter({ value, duration = 1500, style, suffix = "đ" }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset and animate when value changes
    animatedValue.setValue(0);

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Listener to update display value
    const listenerId = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.floor(v));
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [value, duration, animatedValue]);

  return (
    <Text style={style}>
      {displayValue.toLocaleString("vi-VN")}{suffix}
    </Text>
  );
}

export default function SharedNewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [completedCampaigns, setCompletedCampaigns] = useState<CampaignItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [systemWallet, setSystemWallet] = useState<SystemWallet | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // Load system wallet, completed campaigns in parallel
        const [walletData, campaigns] = await Promise.all([
          WalletService.getSystemWallet().catch(() => null),
          CampaignService.listCampaigns({
            filter: { status: ["COMPLETED"] },
            sortBy: "NEWEST_FIRST",
            limit: 5,
          }),
        ]);

        if (mounted) {
          setSystemWallet(walletData);
          setCompletedCampaigns(campaigns);
        }

        // Load posts from those campaigns
        if (campaigns.length > 0) {
          const allPosts: Post[] = [];
          for (const campaign of campaigns.slice(0, 5)) {
            try {
              const campaignPosts = await PostService.getPostsByCampaign({
                campaignId: campaign.id,
                limit: 3,
                offset: 0,
              });
              allPosts.push(...campaignPosts);
            } catch (err) {
              // Error loading posts for campaign
            }
          }
          if (mounted) setPosts(allPosts);
        }
      } catch (err: any) {
        // Load news data failed
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader />
      <Loading visible={loading} message="Đang tải..." />

      {/* Section 1: Mission / Sứ mệnh */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.missionSection}>
          <Text style={styles.missionLabel}>SỨ MỆNH CỦA CHÚNG TÔI</Text>
          <Text style={styles.missionTitle}>
            Giúp đỡ những người có hoàn cảnh khó khăn có những{" "}
            <Text style={styles.missionTitleHighlight}>bữa ăn ấm bụng</Text>
          </Text>
          <Text style={styles.missionDesc}>
            Chúng tôi xây dựng các chương trình hỗ trợ cộng đồng, gây quỹ và kết nối để mang đến những bữa ăn dinh dưỡng cho người nghèo, trẻ em và người già neo đơn. Hành trình này không chỉ là trao tặng thức ăn mà còn là chia sẻ tình thương và hy vọng.
          </Text>

          {/* Stats line */}
          <View style={styles.missionStatsLine}>
            <Text style={styles.missionStatsText}>Đã đóng góp cho </Text>
            <AnimatedCounter
              value={completedCampaigns.length > 0 ? completedCampaigns.length * 200 : 1000}
              style={styles.missionStatsNumber}
              duration={1500}
              suffix=""
            />
            <Text style={styles.missionStatsText}> dự án tại </Text>
            <Text style={styles.missionStatsLocation}>Thành phố Hồ Chí Minh</Text>
            <Text style={styles.missionStatsText}>, mang lại bữa ăn cho </Text>
            <AnimatedCounter
              value={completedCampaigns.length > 0 ? completedCampaigns.length * 4000 : 20000}
              style={styles.missionStatsNumber}
              duration={2000}
              suffix=""
            />
            <Text style={styles.missionStatsText}> người.</Text>
          </View>

          {/* Quote */}
          <Text style={styles.missionQuote}>
            Chúng tôi tin rằng mỗi bữa ăn không chỉ là nguồn dinh dưỡng mà còn là lời động viên tinh thần. Cùng nhau, chúng ta có thể lan tỏa yêu thương, xây dựng một cộng đồng ấm áp và đầy hy vọng.
          </Text>
        </View>

        {/* Divider */}
        <SectionDivider />

        {/* Section: Những con số biết nói - Live System Wallet Data */}
        <View style={styles.section}>
          <Text style={styles.liveDataTitle}>Những con số <Text style={styles.liveDataTitleBold}>biết nói</Text></Text>
          <Text style={styles.liveDataSubtitle}>
            Minh bạch tài chính là ưu tiên hàng đầu của chúng tôi. Mọi khoản đóng góp và chi tiêu đều được ghi nhận và công khai trên hệ thống.
          </Text>

          <View style={styles.liveDataCards}>
            {/* Total Income Card */}
            <View style={styles.liveCard}>
              <View style={styles.liveCardHeader}>
                <View style={[styles.liveIconWrap, { backgroundColor: "#fef2f2" }]}>
                  <Ionicons name="heart" size={24} color="#ef4444" />
                </View>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>Live data</Text>
                </View>
              </View>
              <Text style={styles.liveCardLabel}>Tổng số tiền được quyên góp</Text>
              <AnimatedCounter
                value={Number(systemWallet?.totalIncome || 0)}
                style={[styles.liveCardValue, { color: "#ef4444" }]}
                duration={2000}
              />
              <Text style={styles.liveCardDesc}>Đã được cộng đồng chung tay đóng góp</Text>
            </View>

            {/* Total Expense Card */}
            <View style={styles.liveCard}>
              <View style={styles.liveCardHeader}>
                <View style={[styles.liveIconWrap, { backgroundColor: "#f0fdf4" }]}>
                  <MaterialCommunityIcons name="hand-coin" size={24} color="#16a34a" />
                </View>
                <View style={styles.liveBadge}>
                  <View style={[styles.liveDot, { backgroundColor: "#16a34a" }]} />
                  <Text style={[styles.liveBadgeText, { color: "#16a34a" }]}>Live data</Text>
                </View>
              </View>
              <Text style={styles.liveCardLabel}>Đã giải ngân cho các tổ chức</Text>
              <AnimatedCounter
                value={Number(systemWallet?.totalExpense || 0)}
                style={[styles.liveCardValue, { color: "#16a34a" }]}
                duration={2000}
              />
              <Text style={styles.liveCardDesc}>Đã được chuyển đến các hoàn cảnh khó khăn</Text>
            </View>
          </View>

          {/* View Details Button */}
          <TouchableOpacity style={styles.viewDetailsBtn}>
            <Text style={styles.viewDetailsBtnText}>Xem chi tiết giao dịch hệ thống</Text>
            <Ionicons name="arrow-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <SectionDivider />

        {/* Section 2: Completed Campaigns */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chiến dịch đã hoàn thành</Text>
            <TouchableOpacity onPress={() => router.push("/campaign")}>
              <Text style={styles.sectionAction}>Xem tất cả &gt;</Text>
            </TouchableOpacity>
          </View>

          {completedCampaigns.length === 0 ? (
            <EmptyState
              message="Chưa có chiến dịch hoàn thành"
              logoSize={80}
            />
          ) : (
            <FlatList
              data={completedCampaigns}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.campaignCard}
                  onPress={() => router.push(`/campaign/${item.id}` as any)}
                >
                  <Image
                    source={{ uri: item.coverImage || undefined }}
                    style={styles.campaignImage}
                  />
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#fff" />
                    <Text style={styles.completedBadgeText}>Hoàn thành</Text>
                  </View>
                  <View style={styles.campaignInfo}>
                    <Text style={styles.campaignTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.campaignStats}>
                      <Text style={styles.campaignAmount}>
                        {formatCurrency(item.receivedAmount)}
                      </Text>
                      <Text style={styles.campaignDonors}>
                        {item.donationCount || 0} lượt ủng hộ
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Divider */}
        <SectionDivider />

        {/* Section 3: Posts from Completed Campaigns */}
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
              // Reload posts after like/unlike
              const allPosts: Post[] = [];
              for (const campaign of completedCampaigns.slice(0, 5)) {
                try {
                  const campaignPosts = await PostService.getPostsByCampaign({
                    campaignId: campaign.id,
                    limit: 3,
                    offset: 0,
                  });
                  allPosts.push(...campaignPosts);
                } catch (err) {
                  // Error reloading posts
                }
              }
              setPosts(allPosts);
            } catch (err) {
              // Like error
            }
          }}
          onComment={() => { }}
          onShare={() => { }}
        />

        {/* Bottom spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView >
  );
}

function formatCurrency(v?: string | number | null) {
  const n = Number(v || 0);
  return n.toLocaleString("vi-VN") + "đ";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  section: { marginBottom: moderateScale(8), paddingHorizontal: "3%" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(4),
    marginTop: moderateScale(12),
  },
  sectionTitle: { fontSize: normalizeFontSize(17), fontWeight: "800", color: "#222" },
  sectionSubtitle: {
    fontSize: normalizeFontSize(11),
    color: "#888",
    marginBottom: moderateScale(12),
    fontStyle: "italic",
  },
  sectionAction: { color: PRIMARY, fontWeight: "700", fontSize: normalizeFontSize(13) },

  // Mission Section
  missionSection: {
    paddingHorizontal: "4%",
    paddingVertical: moderateScale(18),
    backgroundColor: "#fff",
  },
  missionLabel: {
    fontSize: normalizeFontSize(12),
    fontWeight: "700",
    color: PRIMARY,
    letterSpacing: 2,
    marginBottom: moderateScale(12),
  },
  missionTitle: {
    fontSize: normalizeFontSize(26),
    fontWeight: "900",
    color: "#1a1a2e",
    lineHeight: moderateScale(36),
    marginBottom: moderateScale(16),
  },
  missionTitleHighlight: {
    color: "#16a34a",
    fontWeight: "900",
  },
  missionDesc: {
    fontSize: normalizeFontSize(15),
    color: "#555",
    lineHeight: moderateScale(24),
    marginBottom: moderateScale(18),
  },
  missionStatsLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: moderateScale(20),
    backgroundColor: "#f8f9fa",
    padding: moderateScale(14),
    borderRadius: moderateScale(14),
  },
  missionStatsText: {
    fontSize: normalizeFontSize(14),
    color: "#444",
    lineHeight: moderateScale(26),
  },
  missionStatsNumber: {
    fontSize: normalizeFontSize(18),
    fontWeight: "900",
    color: "#1a1a2e",
  },
  missionStatsLocation: {
    fontSize: normalizeFontSize(14),
    fontWeight: "800",
    color: PRIMARY,
  },
  missionCards: {
    flexDirection: "row",
    gap: moderateScale(10),
    marginBottom: moderateScale(18),
  },
  missionCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  missionCardTitle: {
    fontSize: normalizeFontSize(14),
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: moderateScale(5),
  },
  missionCardDesc: {
    fontSize: normalizeFontSize(11),
    color: "#888",
    lineHeight: moderateScale(16),
  },
  missionQuote: {
    fontSize: normalizeFontSize(14),
    color: "#666",
    lineHeight: moderateScale(22),
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: moderateScale(10),
    marginTop: moderateScale(8),
  },

  // Live Data Section
  liveDataTitle: {
    fontSize: normalizeFontSize(24),
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
    marginTop: moderateScale(18),
    marginBottom: moderateScale(10),
  },
  liveDataTitleBold: {
    fontWeight: "900",
    color: PRIMARY,
  },
  liveDataSubtitle: {
    fontSize: normalizeFontSize(14),
    color: "#777",
    textAlign: "center",
    marginBottom: moderateScale(20),
    lineHeight: moderateScale(22),
    paddingHorizontal: "3%",
  },
  liveDataCards: {
    flexDirection: "row",
    gap: moderateScale(10),
  },
  liveCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  liveCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: moderateScale(10),
  },
  liveIconWrap: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },
  liveDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: "#ef4444",
  },
  liveBadgeText: {
    fontSize: normalizeFontSize(10),
    color: "#ef4444",
    fontWeight: "600",
  },
  liveCardLabel: {
    fontSize: normalizeFontSize(13),
    color: "#555",
    marginBottom: moderateScale(6),
    fontWeight: "500",
  },
  liveCardValue: {
    fontSize: normalizeFontSize(22),
    fontWeight: "900",
    marginBottom: moderateScale(6),
  },
  liveCardDesc: {
    fontSize: normalizeFontSize(11),
    color: "#888",
    lineHeight: moderateScale(16),
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(18),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(18),
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: moderateScale(22),
    alignSelf: "center",
    gap: moderateScale(6),
    minHeight: moderateScale(44), // Ensure minimum touch target
  },
  viewDetailsBtnText: {
    fontSize: normalizeFontSize(12),
    color: "#666",
    fontWeight: "600",
  },

  // Campaign Card
  campaignCard: {
    width: CAMPAIGN_CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: moderateScale(14),
    marginRight: moderateScale(12),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f3f3f3",
  },
  campaignImage: {
    width: "100%",
    height: moderateScale(120),
    backgroundColor: "#eee",
  },
  completedBadge: {
    position: "absolute",
    top: moderateScale(10),
    right: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16a34a",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
    gap: moderateScale(4),
  },
  completedBadgeText: {
    color: "#fff",
    fontSize: normalizeFontSize(10),
    fontWeight: "700",
  },
  campaignInfo: {
    padding: moderateScale(10),
  },
  campaignTitle: {
    fontWeight: "700",
    fontSize: normalizeFontSize(13),
    color: "#222",
    marginBottom: moderateScale(6),
    lineHeight: moderateScale(18),
  },
  campaignStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  campaignAmount: {
    fontWeight: "700",
    color: PRIMARY,
    fontSize: normalizeFontSize(13),
  },
  campaignDonors: {
    color: "#888",
    fontSize: normalizeFontSize(11),
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: moderateScale(28),
  },
  emptyText: {
    color: "#888",
    marginTop: moderateScale(8),
    fontSize: normalizeFontSize(13),
  },
});
