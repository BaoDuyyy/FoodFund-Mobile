import Loading from "@/components/Loading";
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
                <Image
                  source={{ uri: item.avatar_url || PLACEHOLDER_IMAGE }}
                  style={styles.orgImage}
                />
                <Text style={styles.orgName} numberOfLines={2}>{item.name}</Text>
                <TouchableOpacity style={styles.orgFollowBtn}>
                  <Text style={styles.orgFollowText}>Theo dõi</Text>
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

const PRIMARY = "#ad4e28";
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f3f3",
  },
  orgImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginBottom: 8,
    backgroundColor: "#eee",
  },
  orgName: {
    fontWeight: "700",
    fontSize: 15,
    color: "#222",
    textAlign: "center",
    marginBottom: 8,
  },
  orgFollowBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  orgFollowText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
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
