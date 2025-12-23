import Loading from "@/components/Loading";
import { CAMPAIGN_STATUS_OPTIONS } from "@/constants/campaignFilters";
import { BG_WARM as BG, PRIMARY } from "@/constants/colors";
import { useAuth } from "@/hooks";
import CampaignService from "@/services/campaignService";
import OrganizationService from "@/services/organizationService";
import type { CampaignItem } from "@/types/api/campaign";
import type { Organization } from "@/types/api/organization";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  PixelRatio,
  StyleSheet,
  Text,
  TextInput,
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

export type KOrganizationPageProps = {
  initialOrgId?: string | null;
};

type TabType = "CAMPAIGNS" | "MEMBERS";

// Map role code -> Vietnamese label
const MEMBER_ROLE_LABELS: Record<string, string> = {
  FUNDRAISER: "Người gây quỹ",
  KITCHEN_STAFF: "Nhân viên bếp",
  DELIVERY_STAFF: "Nhân viên giao hàng",
};

function getMemberRoleLabel(role?: string | null) {
  if (!role) return "Không xác định";
  const key = role.toUpperCase();
  return MEMBER_ROLE_LABELS[key] || role;
}

// Get campaign status info from constants
function getCampaignStatusInfo(status?: string | null) {
  const defaultInfo = { label: "Không xác định", color: "#6b7280", bgColor: "#f3f4f6" };
  if (!status) return defaultInfo;
  const found = CAMPAIGN_STATUS_OPTIONS.find(
    (opt) => opt.backendStatus === status.toUpperCase()
  );
  return found
    ? { label: found.label, color: found.color, bgColor: found.bgColor }
    : defaultInfo;
}

export default function KOrganizationPage({ initialOrgId }: KOrganizationPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);

  // tab + search state
  const [activeTab, setActiveTab] = useState<TabType>("CAMPAIGNS");
  const [campaignSearch, setCampaignSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        let orgId: string | null = initialOrgId || null;

        if (!orgId) {
          // Wait for user to be loaded
          if (!user?.email) {
            // User not loaded yet, skip this run
            if (mounted) setLoading(false);
            return;
          }

          const myEmail = user.email;

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

        if (!orgId) {
          // No organization found - just stop loading, don't throw error
          console.warn("No organization found for current user");
          if (mounted) setLoading(false);
          return;
        }

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
  }, [initialOrgId, user]);

  // Filter campaigns by search text
  const visibleCampaigns = campaigns.filter((c) => {
    const keyword = campaignSearch.trim().toLowerCase();
    if (!keyword) return true;
    const title = c.title?.toLowerCase() ?? "";
    const category = c.category?.title?.toLowerCase() ?? "";
    return title.includes(keyword) || category.includes(keyword);
  });

  // Sort members: FUNDRAISER on top
  const sortedMembers = (org?.members || []).slice().sort((a, b) => {
    const roleA = a.member_role;
    const roleB = b.member_role;
    if (roleA === "FUNDRAISER" && roleB !== "FUNDRAISER") return -1;
    if (roleB === "FUNDRAISER" && roleA !== "FUNDRAISER") return 1;
    return 0;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading visible={loading} message="Đang tải tổ chức..." />
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
        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "CAMPAIGNS" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("CAMPAIGNS")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "CAMPAIGNS" && styles.tabButtonTextActive,
              ]}
            >
              Chiến dịch ({campaigns.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "MEMBERS" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("MEMBERS")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "MEMBERS" && styles.tabButtonTextActive,
              ]}
            >
              Thành viên ({sortedMembers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab content */}
        {activeTab === "CAMPAIGNS" && (
          <>
            {/* Search box */}
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color="#999" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm chiến dịch..."
                placeholderTextColor="#999"
                value={campaignSearch}
                onChangeText={setCampaignSearch}
                returnKeyType="search"
              />
            </View>

            <FlatList
              data={visibleCampaigns}
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
                      {(() => {
                        const statusInfo = getCampaignStatusInfo(item.status);
                        return (
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: statusInfo.bgColor },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                { color: statusInfo.color },
                              ]}
                            >
                              {statusInfo.label}
                            </Text>
                          </View>
                        );
                      })()}
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
          </>
        )}

        {activeTab === "MEMBERS" && (
          <FlatList
            data={sortedMembers}
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
                    <Text style={styles.memberRole}>
                      {getMemberRoleLabel(item.member_role)}
                    </Text>
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
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // filepath styles: d:\Sem 9\FoodFund_mobile\app\_shared\k-organization.tsx
  container: { flex: 1, backgroundColor: BG },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: moderateScale(12),
    color: "#555",
    fontSize: normalizeFontSize(13),
  },
  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(170),
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: moderateScale(22),
    borderBottomRightRadius: moderateScale(22),
  },
  header: {
    paddingHorizontal: "4%",
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(10),
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(8),
    borderRadius: 999,
    backgroundColor: "#fff",
    minHeight: moderateScale(32), // Ensure minimum touch target
  },
  backText: {
    color: PRIMARY,
    fontWeight: "700",
    marginLeft: moderateScale(4),
    fontSize: normalizeFontSize(12),
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: normalizeFontSize(17),
    fontWeight: "800",
    marginHorizontal: moderateScale(10),
  },
  orgCard: {
    marginTop: moderateScale(4),
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orgIconBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(14),
    backgroundColor: "#fff5ee",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(10),
  },
  orgName: {
    fontSize: normalizeFontSize(17),
    fontWeight: "800",
    color: "#222",
    marginBottom: moderateScale(4),
  },
  orgDesc: {
    color: "#666",
    fontSize: normalizeFontSize(12),
    marginBottom: moderateScale(10),
  },
  orgStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(6),
    marginTop: moderateScale(2),
  },
  orgStatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: 999,
    backgroundColor: "#fcece3",
  },
  orgStatText: {
    marginLeft: moderateScale(4),
    color: PRIMARY,
    fontSize: normalizeFontSize(11),
    fontWeight: "600",
  },
  content: {
    flex: 1,
    marginTop: moderateScale(8),
    paddingHorizontal: "4%",
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 999,
    padding: moderateScale(3),
    marginBottom: moderateScale(10),
    alignItems: "center",
  },
  tabButton: {
    flex: 1,
    paddingVertical: moderateScale(8),
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  tabButtonActive: {
    backgroundColor: "#fcece3",
  },
  tabButtonText: {
    fontSize: normalizeFontSize(12),
    fontWeight: "600",
    color: "#7a5b4a",
  },
  tabButtonTextActive: {
    color: PRIMARY,
  },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    marginBottom: moderateScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    minHeight: moderateScale(40), // Ensure minimum touch target
  },
  searchInput: {
    flex: 1,
    fontSize: normalizeFontSize(12),
    paddingVertical: moderateScale(4),
    color: "#333",
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: normalizeFontSize(14),
    color: PRIMARY,
  },
  campaignCard: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: moderateScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  campaignHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: moderateScale(4),
  },
  campaignTitle: {
    flex: 1,
    fontWeight: "700",
    fontSize: normalizeFontSize(14),
    color: "#222",
    marginRight: moderateScale(8),
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: normalizeFontSize(10),
    fontWeight: "700",
    textTransform: "uppercase",
  },
  campaignCategory: {
    fontSize: normalizeFontSize(11),
    color: "#888",
    marginBottom: moderateScale(6),
  },
  campaignMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: moderateScale(2),
  },
  campaignMetaLabel: {
    fontSize: normalizeFontSize(11),
    color: "#888",
  },
  campaignMetaValue: {
    fontSize: normalizeFontSize(12),
    color: PRIMARY,
    fontWeight: "700",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(26),
  },
  emptyTitle: {
    fontWeight: "700",
    fontSize: normalizeFontSize(14),
    color: PRIMARY,
    marginBottom: moderateScale(4),
    textAlign: "center",
  },
  emptyDesc: {
    color: "#888",
    fontSize: normalizeFontSize(12),
    textAlign: "center",
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    marginTop: moderateScale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  memberAvatar: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(10),
  },
  memberAvatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: normalizeFontSize(15),
  },
  memberName: {
    fontWeight: "700",
    fontSize: normalizeFontSize(13),
    color: "#222",
  },
  memberMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(2),
  },
  memberRole: {
    color: PRIMARY,
    fontWeight: "600",
    fontSize: normalizeFontSize(11),
  },
  memberDot: {
    color: "#999",
    fontSize: normalizeFontSize(11),
    marginHorizontal: moderateScale(6),
  },
  memberDate: {
    color: "#888",
    fontSize: normalizeFontSize(11),
  },
});
