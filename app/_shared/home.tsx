import AppHeader from "@/components/AppHeader";
import Loading from "@/components/Loading";
import { PRIMARY } from "@/constants/colors";
import CampaignService from "@/services/campaignService";
import OrganizationService from "@/services/organizationService";
import type { CampaignItem } from "@/types/api/campaign";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CAMPAIGN_CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CAMPAIGN_CARD_HEIGHT = 220;
const PLACEHOLDER_IMAGE = "https://foodfund.minhphuoc.io.vn/placeholder-campaign.jpg"; // add your placeholder url

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
      <Loading visible={loading} message="Loading..." />

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
            contentContainerStyle={{ paddingVertical: 8 }}
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
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item, index }) =>
              item ? (
                <TouchableOpacity
                  style={styles.campaignCard}
                  onPress={() => router.push(`/campaign/${item.id}` as any)}
                >
                  <Image
                    source={{ uri: item.coverImage || (index === 0 ? PLACEHOLDER_IMAGE : undefined) }}
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
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Volunteer CTA Banner */}
        <TouchableOpacity
          style={styles.ctaBanner}
          onPress={() => Linking.openURL("https://food-fund.vercel.app/register")}
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

  section: { marginBottom: 18, paddingHorizontal: 12 },
  divider: {
    height: 5,
    backgroundColor: "#e5e5e5",
    marginHorizontal: 0,
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#222" },
  sectionAction: { color: PRIMARY, fontWeight: "700", fontSize: 15 },

  // Organization card styles
  orgCard: {
    width: 200,
    minHeight: 210,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginRight: 18,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#d16b2b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#ad4e28",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  orgAvatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 28,
  },
  orgName: {
    fontWeight: "700",
    fontSize: 15,
    color: "#222",
    textAlign: "center",
    flex: 1,
  },
  orgFollowBtn: {
    backgroundColor: "#ffa63a",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 0,
    width: 120,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ffa63a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  orgFollowText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // Campaign card styles
  campaignCard: {
    width: CAMPAIGN_CARD_WIDTH,
    height: CAMPAIGN_CARD_HEIGHT,
    backgroundColor: "#fff",
    borderRadius: 18,
    marginRight: 16,
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
    height: 120,
    backgroundColor: "#eee",
  },
  campaignInfo: {
    padding: 12,
    flex: 1,
    justifyContent: "center",
  },
  campaignTitle: {
    fontWeight: "800",
    fontSize: 16,
    color: "#222",
    marginBottom: 6,
  },
  campaignAmount: {
    fontWeight: "700",
    color: PRIMARY,
    fontSize: 15,
    marginBottom: 2,
  },
  campaignMeta: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },
  campaignProgressBg: {
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  campaignProgressFill: {
    height: "100%",
    backgroundColor: PRIMARY,
    borderRadius: 3,
  },

  // Welcome Banner
  welcomeBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 18,
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
    height: 140,
    backgroundColor: "#e5e5e5",
  },
  welcomeImage: {
    width: "100%",
    height: "100%",
  },
  welcomeContent: {
    padding: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 6,
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  // CTA Banner
  ctaBanner: {
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#ff7e5f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaGradient: {
    padding: 20,
    position: "relative",
  },
  ctaDecorCircle1: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  ctaDecorCircle2: {
    position: "absolute",
    bottom: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ctaIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
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
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  ctaButtonRow: {
    alignItems: "flex-start",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ff7e5f",
  },
});
