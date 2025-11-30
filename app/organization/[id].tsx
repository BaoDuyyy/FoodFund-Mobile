import OrganizationService from "@/services/organizationService";
import type { Organization } from "@/types/api/organization";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrganizationDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [activeTab, setActiveTab] = useState<"campaigns" | "info" | "members">("campaigns");
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      try {
        const data = await OrganizationService.getOrganizationById(id);
        if (mounted) setOrg(data);
      } catch (err) {
        // handle error if needed
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBg} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Quay lại danh sách</Text>
        </TouchableOpacity>
        <View style={styles.orgIconBox}>
          <Ionicons name="business" size={48} color="#ad4e28" />
        </View>
        <Text style={styles.orgName}>{org?.name || ""}</Text>
        <Text style={styles.orgDesc}>{org?.description || ""}</Text>
        <View style={styles.orgStatsRow}>
          <View style={styles.orgStat}><Ionicons name="people" size={18} color="#fff" /><Text style={styles.orgStatText}>{org?.total_members ?? 0} thành viên</Text></View>
          <View style={styles.orgStat}><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={styles.orgStatText}>{org?.active_members ?? 0} đang hoạt động</Text></View>
          <View style={styles.orgStat}><Ionicons name="calendar" size={18} color="#fff" /><Text style={styles.orgStatText}>Thành lập: {org?.created_at ? new Date(org.created_at).toLocaleDateString("vi-VN") : ""}</Text></View>
        </View>
        <TouchableOpacity style={styles.joinBtn}>
          <Ionicons name="person-add" size={20} color="#ad4e28" />
          <Text style={styles.joinBtnText}>Yêu cầu tham gia</Text>
        </TouchableOpacity>
      </View>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "campaigns" && styles.tabActive]}
          onPress={() => setActiveTab("campaigns")}
        >
          <Ionicons name="grid" size={18} color={activeTab === "campaigns" ? "#ad4e28" : "#888"} />
          <Text style={[styles.tabText, activeTab === "campaigns" && styles.tabTextActive]}>Chiến dịch (0)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "info" && styles.tabActive]}
          onPress={() => setActiveTab("info")}
        >
          <Ionicons name="information-circle" size={18} color={activeTab === "info" ? "#ad4e28" : "#888"} />
          <Text style={[styles.tabText, activeTab === "info" && styles.tabTextActive]}>Thông tin</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "members" && styles.tabActive]}
          onPress={() => setActiveTab("members")}
        >
          <Ionicons name="person" size={18} color={activeTab === "members" ? "#ad4e28" : "#888"} />
          <Text style={[styles.tabText, activeTab === "members" && styles.tabTextActive]}>Thành viên</Text>
        </TouchableOpacity>
      </View>
      {/* Tab content */}
      <View style={styles.tabContent}>
        {activeTab === "campaigns" && (
          <View style={styles.emptyBox}>
            <Ionicons name="grid" size={48} color="#d7bfae" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>Chưa có chiến dịch nào</Text>
            <Text style={styles.emptyDesc}>Tổ chức này chưa tạo chiến dịch nào.</Text>
          </View>
        )}
        {activeTab === "info" && (
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Thông tin liên hệ</Text>
              <View style={styles.infoItemRow}>
                <Ionicons name="location" size={18} color="#ad4e28" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.infoLabel}>Địa chỉ</Text>
                  <Text style={styles.infoValue}>{org?.address || ""}</Text>
                </View>
              </View>
              <View style={styles.infoItemRow}>
                <Ionicons name="call" size={18} color="#ad4e28" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.infoLabel}>Số điện thoại</Text>
                  <Text style={styles.infoValue}>{org?.phone_number || ""}</Text>
                </View>
              </View>
              <View style={styles.infoItemRow}>
                <Ionicons name="globe" size={18} color="#ad4e28" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.infoLabel}>Website</Text>
                  <Text style={[styles.infoValue, { color: "#ad4e28" }]}>{org?.website || ""}</Text>
                </View>
              </View>
            </View>
            <View style={styles.repBox}>
              <Text style={styles.repTitle}>Người đại diện</Text>
              <View style={styles.repAvatar}>
                <Text style={styles.repAvatarText}>{org?.representative?.full_name?.[0] || ""}</Text>
              </View>
              <Text style={styles.repName}>{org?.representative?.full_name || ""}</Text>
              <Text style={styles.repUsername}>{org?.representative?.user_name || ""}</Text>
              <View style={styles.repEmailBox}>
                <Ionicons name="mail" size={16} color="#ad4e28" />
                <Text style={styles.repEmail}>{org?.representative?.email || ""}</Text>
              </View>
            </View>
          </View>
        )}
        {activeTab === "members" && (
          <FlatList
            data={org?.members || []}
            keyExtractor={item => item.id}
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
                    <Text style={styles.memberDate}>{item.joined_at ? new Date(item.joined_at).toLocaleDateString("vi-VN") : ""}</Text>
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

const PRIMARY = "#ad4e28";
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f4" },
  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140, // giảm chiều cao header cho mobile
    backgroundColor: PRIMARY,
    zIndex: 0,
  },
  header: {
    paddingTop: 12, // giảm padding
    paddingBottom: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 1,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 6,
    padding: 2,
    backgroundColor: "transparent",
  },
  backText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 4,
    fontSize: 14,
  },
  orgIconBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 10,
    marginBottom: 8,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  orgName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 2,
    textAlign: "center",
  },
  orgDesc: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  orgStatsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
    gap: 8,
  },
  orgStat: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
    gap: 4,
  },
  orgStatText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 4,
  },
  joinBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#ad4e28",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  joinBtnText: {
    color: "#ad4e28",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 6,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "transparent",
    marginTop: 6,
    marginBottom: 0,
    paddingHorizontal: 8,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#f3f3f3",
  },
  tabActive: {
    backgroundColor: "#ad4e28",
    borderColor: "#ad4e28",
  },
  tabText: {
    color: "#888",
    fontWeight: "700",
    fontSize: 13,
  },
  tabTextActive: {
    color: "#fff",
  },
  tabContent: {
    flex: 1,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyTitle: {
    fontWeight: "800",
    fontSize: 16,
    color: "#ad4e28",
    marginBottom: 4,
    textAlign: "center",
  },
  emptyDesc: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  infoBox: {
    flex: 2,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontWeight: "800",
    fontSize: 15,
    color: "#ad4e28",
    marginBottom: 8,
  },
  infoItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    color: "#ad4e28",
    fontWeight: "700",
    fontSize: 13,
  },
  infoValue: {
    color: "#222",
    fontSize: 13,
    fontWeight: "500",
  },
  repBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  repTitle: {
    fontWeight: "800",
    fontSize: 15,
    color: "#ad4e28",
    marginBottom: 8,
  },
  repAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ad4e28",
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
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  repEmail: {
    color: "#222",
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ad4e28",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
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
    marginBottom: 2,
  },
  memberMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  memberRole: {
    color: "#ad4e28",
    fontWeight: "700",
    fontSize: 12,
  },
  memberDot: {
    color: "#888",
    fontSize: 12,
    marginHorizontal: 6,
  },
  memberDate: {
    color: "#888",
    fontSize: 12,
  },
});
