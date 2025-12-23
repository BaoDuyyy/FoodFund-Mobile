import AppHeader from "@/components/AppHeader";
import EmptyState from "@/components/EmptyState";
import Loading from "@/components/Loading";
import { PRIMARY } from "@/constants/colors";
import CampaignService from "@/services/campaignService";
import OrganizationService from "@/services/organizationService";
import type { CampaignItem } from "@/types/api/campaign";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, Image, Linking, PixelRatio, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

// Responsive card dimensions
const CAMPAIGN_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.72, 320);
const CAMPAIGN_CARD_HEIGHT = moderateScale(200);
const ORG_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.48, 200);

const WEB_REGISTER_URL = process.env.EXPO_PUBLIC_WEB_REGISTER_URL || "https://food-fund.vercel.app/register";

export default function DiscoverPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [campaignData, orgData] = await Promise.all([
          CampaignService.listCampaigns({ sortBy: "MOST_DONATED", limit: 20 }),
          OrganizationService.listActiveOrganizations(),
        ]);
        if (mounted) setCampaigns(campaignData);
        if (mounted) setOrganizations(orgData);
      } catch (err: any) {
        console.warn("Load campaigns/orgs failed:", err?.message || err);
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Tổ chức gây quỹ hiệu quả */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tổ chức gây quỹ hiệu quả</Text>
            <TouchableOpacity onPress={() => router.push("/organizations" as any)}>
              <Text style={styles.sectionAction}>Xem tất cả &gt;</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={organizations}
            keyExtractor={item => item?.id ?? ""}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) =>
              item ? (
                <View style={styles.orgCard}>
                  <View style={styles.orgAvatar}>
                    <Text style={styles.orgAvatarText}>
                      {item.name?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  </View>
                  <Text style={styles.orgName} numberOfLines={2}>{item.name}</Text>
                  <TouchableOpacity
                    style={styles.orgFollowBtn}
                    onPress={() => router.push(`/organization/${item.id}`)}
                  >
                    <Text style={styles.orgFollowText}>Xem chi tiết</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
            contentContainerStyle={organizations.length === 0 ? { flexGrow: 1, justifyContent: "center" } : { paddingVertical: 8 }}
            ListEmptyComponent={
              !loading ? (
                <EmptyState message="Chưa có tổ chức" logoSize={60} />
              ) : null
            }
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Chiến dịch nổi bật */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chiến dịch nổi bật</Text>
            <TouchableOpacity onPress={() => router.push("/campaign")}>
              <Text style={styles.sectionAction}>Xem tất cả &gt;</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={campaigns}
            keyExtractor={item => item?.id ?? ""}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) =>
              item ? (
                <TouchableOpacity
                  style={styles.campaignCard}
                  onPress={() => router.push(`/campaign/${item.id}` as any)}
                >
                  <Image
                    source={{ uri: item.coverImage || undefined }}
                    style={styles.campaignImage}
                  />
                  <View style={styles.campaignInfo}>
                    <Text style={styles.campaignTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.campaignProgressBg}>
                      <View
                        style={[
                          styles.campaignProgressFill,
                          { width: `${Math.min(item.fundingProgress || 0, 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.campaignAmount}>
                      {formatCurrency(item.receivedAmount)} ({item.fundingProgress ? Math.round(item.fundingProgress) : 0}%)
                    </Text>
                    <Text style={styles.campaignMeta}>
                      {item.donationCount} lượt ủng hộ
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : null
            }
            contentContainerStyle={campaigns.length === 0 ? { flexGrow: 1, justifyContent: "center" } : { paddingVertical: 8 }}
            ListEmptyComponent={
              !loading ? (
                <EmptyState message="Chưa có chiến dịch" logoSize={80} />
              ) : null
            }
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Volunteer CTA Banner */}
        <TouchableOpacity
          style={styles.ctaBanner}
          onPress={() => Linking.openURL(WEB_REGISTER_URL)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#ff7e5f", "#feb47b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            {/* Decorative circles */}
            <View style={styles.ctaDecorCircle1} />
            <View style={styles.ctaDecorCircle2} />

            <View style={styles.ctaContent}>
              <View style={styles.ctaIconBadge}>
                <Ionicons name="rocket" size={28} color="#ff7e5f" />
              </View>
              <View style={styles.ctaTextWrap}>
                <Text style={styles.ctaTitle}>Bạn muốn trở thành người gây quỹ?</Text>
                <Text style={styles.ctaSubtitle}>Đăng ký tổ chức thiện nguyện của riêng bạn</Text>
              </View>
            </View>
            <View style={styles.ctaButtonRow}>
              <View style={styles.ctaButton}>
                <Text style={styles.ctaButtonText}>Đăng ký ngay</Text>
                <Ionicons name="arrow-forward" size={16} color="#ff7e5f" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatCurrency(v?: string | number | null) {
  const n = Number(v || 0);
  return n.toLocaleString("vi-VN") + " đ";
}

const ORANGE_GRADIENT = ["#d16b2b", "#ad4e28"];
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  section: { marginBottom: moderateScale(16), paddingHorizontal: "3%" },
  divider: {
    height: moderateScale(5),
    backgroundColor: "#e5e5e5",
    marginHorizontal: 0,
    marginVertical: moderateScale(8),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(8),
    marginTop: moderateScale(8),
  },
  sectionTitle: { fontSize: normalizeFontSize(17), fontWeight: "800", color: "#222" },
  sectionAction: { color: PRIMARY, fontWeight: "700", fontSize: normalizeFontSize(14) },

  // Organization card styles
  orgCard: {
    width: ORG_CARD_WIDTH,
    minHeight: moderateScale(190),
    backgroundColor: "#fff",
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginRight: moderateScale(14),
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f3f3f3",
  },
  orgAvatar: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: "#d16b2b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(10),
    shadowColor: "#ad4e28",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  orgAvatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: normalizeFontSize(24),
  },
  orgName: {
    fontWeight: "700",
    fontSize: normalizeFontSize(14),
    color: "#222",
    textAlign: "center",
    flex: 1,
  },
  orgFollowBtn: {
    backgroundColor: "#ffa63a",
    borderRadius: moderateScale(24),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    minWidth: moderateScale(100),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ffa63a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  orgFollowText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: normalizeFontSize(13),
    letterSpacing: 0.2,
  },

  // Campaign card styles
  campaignCard: {
    width: CAMPAIGN_CARD_WIDTH,
    height: CAMPAIGN_CARD_HEIGHT,
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    marginRight: moderateScale(14),
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
    height: moderateScale(110),
    backgroundColor: "#eee",
  },
  campaignInfo: {
    padding: moderateScale(10),
    flex: 1,
    justifyContent: "center",
  },
  campaignTitle: {
    fontWeight: "800",
    fontSize: normalizeFontSize(14),
    color: "#222",
    marginBottom: moderateScale(5),
  },
  campaignAmount: {
    fontWeight: "700",
    color: PRIMARY,
    fontSize: normalizeFontSize(13),
    marginBottom: moderateScale(2),
  },
  campaignMeta: {
    color: "#888",
    fontSize: normalizeFontSize(12),
    fontWeight: "600",
  },
  campaignProgressBg: {
    height: moderateScale(5),
    backgroundColor: "#f0f0f0",
    borderRadius: moderateScale(3),
    overflow: "hidden",
    marginBottom: moderateScale(5),
  },
  campaignProgressFill: {
    height: "100%",
    backgroundColor: PRIMARY,
    borderRadius: moderateScale(3),
  },

  // Welcome Banner
  welcomeBanner: {
    marginHorizontal: "3%",
    marginTop: moderateScale(8),
    marginBottom: moderateScale(14),
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f3f3f3",
  },
  welcomeImagePlaceholder: {
    width: "100%",
    height: moderateScale(130),
    backgroundColor: "#e5e5e5",
  },
  welcomeImage: {
    width: "100%",
    height: "100%",
  },
  welcomeContent: {
    padding: moderateScale(14),
  },
  welcomeTitle: {
    fontSize: normalizeFontSize(18),
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: moderateScale(5),
  },
  welcomeText: {
    fontSize: normalizeFontSize(13),
    color: "#666",
    lineHeight: moderateScale(18),
  },

  // CTA Banner
  ctaBanner: {
    marginHorizontal: "3%",
    marginBottom: moderateScale(14),
    borderRadius: moderateScale(18),
    overflow: "hidden",
    shadowColor: "#ff7e5f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaGradient: {
    padding: moderateScale(18),
    position: "relative",
  },
  ctaDecorCircle1: {
    position: "absolute",
    top: moderateScale(-28),
    right: moderateScale(-28),
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  ctaDecorCircle2: {
    position: "absolute",
    bottom: moderateScale(-18),
    left: moderateScale(-18),
    width: moderateScale(55),
    height: moderateScale(55),
    borderRadius: moderateScale(28),
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(14),
  },
  ctaIconBadge: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(14),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaTextWrap: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: normalizeFontSize(16),
    fontWeight: "800",
    color: "#fff",
    marginBottom: moderateScale(4),
  },
  ctaSubtitle: {
    fontSize: normalizeFontSize(13),
    color: "rgba(255,255,255,0.9)",
    lineHeight: moderateScale(18),
  },
  ctaButtonRow: {
    alignItems: "flex-start",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(22),
    gap: moderateScale(8),
    minHeight: moderateScale(44), // Ensure minimum touch target
  },
  ctaButtonText: {
    fontSize: normalizeFontSize(14),
    fontWeight: "700",
    color: "#ff7e5f",
  },
});
