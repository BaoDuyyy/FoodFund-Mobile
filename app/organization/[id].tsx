import CampaignService from "@/services/campaignService";
import OrganizationService from "@/services/organizationService";
import type { CampaignItem } from "@/types/api/campaign";
import type { Organization } from "@/types/api/organization";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#ad4e28";
const BG = "#f8f6f4";

export default function OrganizationDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [activeTab, setActiveTab] = useState<"campaigns" | "info" | "members">("campaigns");
  const [org, setOrg] = useState<Organization | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      try {
        const data = await OrganizationService.getOrganizationById(id);
        if (mounted) setOrg(data);

        // Fetch campaigns using representative's cognito_id
        const cognitoId = data?.representative?.cognito_id;
        if (cognitoId) {
          const campaignList = await CampaignService.searchCampaigns({
            creatorId: cognitoId,
            limit: 100,
          });
          if (mounted) setCampaigns(campaignList);
        }
      } catch (err) {
        // handle error if needed
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      {/* background màu header */}
      <View style={styles.headerBg} />

      {/* HEADER */}
      <View style={styles.header}>
        {/* back + join */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backText}>Quay lại danh sách</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.joinBtn}>
            <Ionicons name="person-add" size={18} color={PRIMARY} />
            <Text style={styles.joinBtnText}>Yêu cầu tham gia</Text>
          </TouchableOpacity>
        </View>

        {/* card thông tin org đè lên header */}
        <View style={styles.orgCard}>
          <View style={styles.orgIconBox}>
            <Ionicons name="business" size={32} color={PRIMARY} />
          </View>
          <Text style={styles.orgName} numberOfLines={2}>
            {org?.name || ""}
          </Text>
          {!!org?.description && (
            <Text style={styles.orgDesc} numberOfLines={2}>
              {org.description}
            </Text>
          )}

          <View style={styles.orgStatsRow}>
            <View style={styles.orgStatItem}>
              <Ionicons name="people" size={16} color={PRIMARY} />
              <Text style={styles.orgStatText}>{org?.total_members ?? 0} thành viên</Text>
            </View>
            <View style={styles.orgStatItem}>
              <Ionicons name="checkmark-circle" size={16} color={PRIMARY} />
              <Text style={styles.orgStatText}>{org?.active_members ?? 0} đang hoạt động</Text>
            </View>
            <View style={styles.orgStatItem}>
              <Ionicons name="calendar" size={16} color={PRIMARY} />
              <Text style={styles.orgStatText}>
                Thành lập:{" "}
                {org?.created_at ? new Date(org.created_at).toLocaleDateString("vi-VN") : ""}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "campaigns" && styles.tabActive]}
            onPress={() => setActiveTab("campaigns")}
          >
            <Ionicons
              name="grid"
              size={16}
              color={activeTab === "campaigns" ? "#fff" : "#666"}
            />
            <Text style={[styles.tabText, activeTab === "campaigns" && styles.tabTextActive]}>
              Chiến dịch ({campaigns.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "info" && styles.tabActive]}
            onPress={() => setActiveTab("info")}
          >
            <Ionicons
              name="information-circle"
              size={16}
              color={activeTab === "info" ? "#fff" : "#666"}
            />
            <Text style={[styles.tabText, activeTab === "info" && styles.tabTextActive]}>
              Thông tin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "members" && styles.tabActive]}
            onPress={() => setActiveTab("members")}
          >
            <Ionicons
              name="person"
              size={16}
              color={activeTab === "members" ? "#fff" : "#666"}
            />
            <Text style={[styles.tabText, activeTab === "members" && styles.tabTextActive]}>
              Thành viên
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* NỘI DUNG TAB */}
      <View style={styles.tabContent}>
        {activeTab === "campaigns" && (
          campaigns.length > 0 ? (
            <FlatList
              data={campaigns}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.campaignCard}
                  onPress={() => router.push(`/campaign/${item.id}` as any)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: item.coverImage || undefined }}
                    style={styles.campaignImage}
                  />
                  <View style={styles.campaignInfo}>
                    <Text style={styles.campaignTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.campaignAmount}>
                      {formatCurrency(item.receivedAmount)} / {formatCurrency(item.targetAmount)}
                    </Text>
                    <View style={styles.campaignProgressBg}>
                      <View
                        style={[
                          styles.campaignProgressFill,
                          { width: `${Math.min(item.fundingProgress || 0, 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.campaignMeta}>
                      {item.donationCount ?? 0} lượt ủng hộ • Còn {item.daysRemaining ?? 0} ngày
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="grid" size={40} color="#d7bfae" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>Chưa có chiến dịch nào</Text>
              <Text style={styles.emptyDesc}>Tổ chức này chưa tạo chiến dịch nào.</Text>
            </View>
          )
        )}

        {activeTab === "info" && (
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Thông tin liên hệ</Text>

              <View style={styles.infoItemRow}>
                <Ionicons name="location" size={18} color={PRIMARY} />
                <View style={styles.infoItemText}>
                  <Text style={styles.infoLabel}>Địa chỉ</Text>
                  <Text style={styles.infoValue}>{org?.address || "—"}</Text>
                </View>
              </View>

              <View style={styles.infoItemRow}>
                <Ionicons name="call" size={18} color={PRIMARY} />
                <View style={styles.infoItemText}>
                  <Text style={styles.infoLabel}>Số điện thoại</Text>
                  <Text style={styles.infoValue}>{org?.phone_number || "—"}</Text>
                </View>
              </View>

              <View style={styles.infoItemRow}>
                <Ionicons name="globe" size={18} color={PRIMARY} />
                <View style={styles.infoItemText}>
                  <Text style={styles.infoLabel}>Website</Text>
                  <Text style={[styles.infoValue, styles.infoLink]}>{org?.website || "—"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.repBox}>
              <Text style={styles.repTitle}>Người đại diện</Text>
              <View style={styles.repAvatar}>
                <Text style={styles.repAvatarText}>{org?.representative?.full_name?.[0] || ""}</Text>
              </View>
              <Text style={styles.repName}>{org?.representative?.full_name || "—"}</Text>
              <Text style={styles.repUsername}>{org?.representative?.user_name || ""}</Text>
              {!!org?.representative?.email && (
                <View style={styles.repEmailBox}>
                  <Ionicons name="mail" size={14} color={PRIMARY} />
                  <Text style={styles.repEmail}>{org.representative.email}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === "members" && (
          <FlatList
            data={org?.members || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{item.member?.full_name?.[0] || ""}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{item.member?.full_name || ""}</Text>
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
        )}
      </View>
    </SafeAreaView>
  );
}

function formatCurrency(v?: string | number | null) {
  const n = Number(v || 0);
  return n.toLocaleString("vi-VN") + " đ";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 170,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  backText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 14,
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  joinBtnText: {
    color: PRIMARY,
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 6,
  },

  orgCard: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  orgIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#fff5ee",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
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
  },
  orgStatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
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

  // Tabs
  tabsWrapper: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 999,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabActive: {
    backgroundColor: PRIMARY,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#fff",
  },

  tabContent: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 16,
  },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
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

  // Campaign card
  campaignCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  campaignImage: {
    width: 100,
    height: 100,
    backgroundColor: "#eee",
  },
  campaignInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  campaignTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  campaignAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: PRIMARY,
    marginBottom: 6,
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
  campaignMeta: {
    fontSize: 11,
    color: "#888",
  },

  // Info tab
  infoRow: {
    flexDirection: "column",      // ⬅️ trước là "row"
    gap: 12,                      // thêm khoảng cách giữa 2 card
    marginTop: 4,
  },
  infoBox: {
    // bỏ flex: 2
    width: "100%",                // card full chiều ngang
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,                  // padding dày thêm 1 chút
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: PRIMARY,
    marginBottom: 10,
  },
  infoItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,            // cách nhau thoáng hơn
  },
  infoItemText: {
    marginLeft: 10,
    flex: 1,
  },
  infoLabel: {
    color: "#999",
    fontWeight: "500",
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    color: "#222",
    fontSize: 13,
    fontWeight: "500",
  },
  infoLink: {
    color: PRIMARY,
  },

  repBox: {
    // bỏ flex: 1
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  repTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: PRIMARY,
    marginBottom: 8,
  },
  repAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  repAvatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },
  repName: {
    fontWeight: "700",
    fontSize: 14,
    color: "#222",
    marginBottom: 2,
    textAlign: "center",
  },
  repUsername: {
    color: "#888",
    fontSize: 12,
    marginBottom: 6,
    textAlign: "center",
  },
  repEmailBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff5ee",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  repEmail: {
    color: PRIMARY,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },

  // Members
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
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