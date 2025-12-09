import Loading from "@/components/Loading";
import { PRIMARY } from "@/constants/colors";
import CampaignService from "@/services/campaignService";
import OrganizationService from "@/services/organizationService";
import type { CampaignItem } from "@/types/api/campaign";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
    <SafeAreaView style={styles.container}>
      <Loading visible={loading} message="Loading..." />

      {/* Banner Top Section */}
      <View style={styles.bannerContainer}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerLogoWrapper}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.bannerLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.bannerTitle}>
            Chào mừng bạn đến với FoodFund
          </Text>
        </View>
      </View>

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

      {/* ...other sections... */}
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

  // Banner styles
  bannerContainer: {
    height: 110,
    marginBottom: 18,
    borderRadius: 18,
    marginHorizontal: 12,
    backgroundColor: "#f7e9e2",
    justifyContent: "center",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    height: "100%",
  },
  bannerLogoWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
    shadowColor: "#ad4e28",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerLogo: {
    width: 38,
    height: 38,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ad4e28",
    flexShrink: 1,
  },

  section: { marginBottom: 18, paddingHorizontal: 12 },
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
    fontSize: 16,
    color: "#222",
    textAlign: "center",
    marginBottom: 16,
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
});
