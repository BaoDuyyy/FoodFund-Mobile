import AuthService from "@/services/authService";
import CampaignService from "@/services/campaignService";
import OrganizationService from "@/services/organizationService";
import type { CampaignItem } from "@/types/api/campaign";
import type { Organization } from "@/types/api/organization";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#ad4e28";
const BG = "#f8f6f4";

export type KOrganizationPageProps = {
  initialOrgId?: string | null;
};

export default function KOrganizationPage({ initialOrgId }: KOrganizationPageProps) {
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        let orgId: string | null = initialOrgId || null;

        if (!orgId) {
          // Lấy user info để lấy email
          const userInfo = await AuthService.getUserInfo();
          const myEmail = userInfo?.email;

          // Lấy organization mà user hiện tại là thành viên (để lấy orgId)
          const organizations = await OrganizationService.listActiveOrganizations();

          for (const o of organizations) {
            if (Array.isArray(o.members)) {
              for (const m of o.members) {
                if (m?.member?.email === myEmail) {
                  orgId = o.id;
                  break;
                }
              }
            }
            if (orgId) break;
          }
        }

        if (!orgId) throw new Error("No organization found for current user");

        // Lấy chi tiết organization
        const orgDetail = await OrganizationService.getOrganizationById(orgId);
        if (mounted && orgDetail) setOrg(orgDetail);

        // Lấy creatorId là cognito_id của representative
        const creatorId = orgDetail?.representative?.cognito_id;
        if (!creatorId) {
          console.warn("No representative cognito_id found, skip loading campaigns");
          if (mounted) setCampaigns([]);
          return;
        }

        // Lấy danh sách chiến dịch theo creatorId
        const campaignList = await CampaignService.searchCampaigns({
          creatorId,
          sortBy: "MOST_DONATED",
          limit: 10,
          page: 1,
        });

        const filteredCampaigns = campaignList.filter(
          (c) => c.creator?.id === creatorId
        );

        if (mounted) setCampaigns(filteredCampaigns);
      } catch (err) {
        console.error("Error loading organization or campaigns:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [initialOrgId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={PRIMARY} size="large" />
          <Text style={styles.loadingText}>Đang tải tổ chức...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Nền header bo tròn */}
      <View style={styles.headerBg} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={PRIMARY} />
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Tổ chức của tôi
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Card thông tin org */}
        <View style={styles.orgCard}>
          <View style={styles.orgIconBox}>
            <Ionicons name="business" size={32} color={PRIMARY} />
          </View>
          <Text style={styles.orgName} numberOfLines={2}>
            {org?.name || "Chưa có tên tổ chức"}
          </Text>
          {!!org?.description && (
            <Text style={styles.orgDesc} numberOfLines={3}>
              {org.description}
            </Text>
          )}
          <View style={styles.orgStatsRow}>
            <View style={styles.orgStatItem}>
              <Ionicons name="people" size={16} color={PRIMARY} />
              <Text style={styles.orgStatText}>
                {org?.total_members ?? 0} thành viên
              </Text>
            </View>
            <View style={styles.orgStatItem}>
              <Ionicons name="checkmark-circle" size={16} color={PRIMARY} />
              <Text style={styles.orgStatText}>
                {org?.active_members ?? 0} đang hoạt động
              </Text>
            </View>
            <View style={styles.orgStatItem}>
              <Ionicons name="calendar" size={16} color={PRIMARY} />
              <Text style={styles.orgStatText}>
                Thành lập:{" "}
                {org?.created_at
                  ? new Date(org.created_at).toLocaleDateString("vi-VN")
                  : "—"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* BODY */}
      <View style={styles.content}>
        {/* Chiến dịch */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Chiến dịch ({campaigns.length})
          </Text>
        </View>

        <FlatList
          data={campaigns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isActive = item.status === "ACTIVE";
            return (
              <TouchableOpacity
                onPress={() => router.push(`/k-campaign/${item.id}` as any)}
                activeOpacity={0.85}
                style={styles.campaignCard}
              >
                <View style={styles.campaignHeaderRow}>
                  <Text style={styles.campaignTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isActive ? "#dcfce7" : "#fee2e2",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: isActive ? "#16a34a" : "#b91c1c" },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
                {item.category?.title ? (
                  <Text style={styles.campaignCategory}>
                    {item.category.title}
                  </Text>
                ) : null}
                <View style={styles.campaignMetaRow}>
                  <Text style={styles.campaignMetaLabel}>Mục tiêu</Text>
                  <Text style={styles.campaignMetaValue}>
                    {item.targetAmount} VND
                  </Text>
                </View>
                <View style={styles.campaignMetaRow}>
                  <Text style={styles.campaignMetaLabel}>Đã nhận</Text>
                  <Text style={styles.campaignMetaValue}>
                    {item.receivedAmount} VND
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons
                name="grid"
                size={40}
                color="#d7bfae"
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyTitle}>Chưa có chiến dịch nào</Text>
              <Text style={styles.emptyDesc}>
                Tổ chức này chưa tạo chiến dịch nào.
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />

        {/* Thành viên */}
        <View style={{ marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Thành viên</Text>
          <FlatList
            data={org?.members || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {item.member?.full_name?.[0] || "?"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>
                    {item.member?.full_name || "—"}
                  </Text>
                  <View style={styles.memberMetaRow}>
                    <Text style={styles.memberRole}>{item.member_role}</Text>
                    <Text style={styles.memberDot}>·</Text>
                    <Text style={styles.memberDate}>
                      {item.joined_at
                        ? new Date(item.joined_at).toLocaleDateString("vi-VN")
                        : ""}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Chưa có thành viên nào</Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // filepath styles: d:\Sem 9\FoodFund_mobile\app\_shared\k-organization.tsx
  container: { flex: 1, backgroundColor: BG },
  // ...existing code from original styles...
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#555",
    fontSize: 14,
  },
  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  backText: {
    color: PRIMARY,
    fontWeight: "700",
    marginLeft: 4,
    fontSize: 13,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginHorizontal: 12,
  },
  orgCard: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orgIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fff5ee",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  orgName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
    marginBottom: 4,
  },
  orgDesc: {
    color: "#666",
    fontSize: 13,
    marginBottom: 10,
  },
  orgStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  orgStatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fcece3",
  },
  orgStatText: {
    marginLeft: 4,
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: PRIMARY,
  },
  campaignCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  campaignHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  campaignTitle: {
    flex: 1,
    fontWeight: "700",
    fontSize: 15,
    color: "#222",
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  campaignCategory: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
  },
  campaignMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  campaignMetaLabel: {
    fontSize: 12,
    color: "#888",
  },
  campaignMetaValue: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: "700",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
  },
  emptyTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: PRIMARY,
    marginBottom: 4,
    textAlign: "center",
  },
  emptyDesc: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  memberAvatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  memberName: {
    fontWeight: "700",
    fontSize: 14,
    color: "#222",
  },
  memberMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  memberRole: {
    color: PRIMARY,
    fontWeight: "600",
    fontSize: 12,
  },
  memberDot: {
    color: "#999",
    fontSize: 12,
    marginHorizontal: 6,
  },
  memberDate: {
    color: "#888",
    fontSize: 12,
  },
});
