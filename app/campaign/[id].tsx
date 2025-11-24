import Loading from "@/components/Loading";
import CampaignService from "@/services/campaignService";
import type { CampaignDetail, Phase } from "@/types/api/campaign";
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CampaignDetailPage() {
  const router = useRouter();
  // useLocalSearchParams is the correct hook in expo-router for local dynamic params
  const params = useLocalSearchParams() as { id?: string };
  const id = params?.id;
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function formatCurrency(v?: string | number | null) {
    const n = Number(v || 0);
    return n.toLocaleString("vi-VN") + " đ";
  }

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={loading} message="Loading campaign..." />

      <TouchableOpacity style={styles.topBack} onPress={() => router.back()}>
        <Text style={styles.topBackText}>‹ Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        {error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : campaign ? (
          <>
            <Image source={{ uri: campaign.coverImage || undefined }} style={styles.image} />
            <View style={styles.content}>
              <Text style={styles.title}>{campaign.title}</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Người tạo:</Text>
                <Text style={styles.value}>{campaign.creator?.full_name || "—"}</Text>
              </View>

              {/* Thông tin tổng quan chiến dịch */}
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Tiến độ gây quỹ</Text>
                <View style={styles.progressBarBox}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.max(0, Math.min(100, Number(campaign.fundingProgress || 0)))}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPercent}>
                    {Math.round(Number(campaign.fundingProgress || 0))}%
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <FontAwesome name="money" size={22} color="#43b46b" style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Đã nhận</Text>
                    <Text style={[styles.infoValue, { color: "#43b46b" }]}>
                      {formatCurrency(campaign.receivedAmount)}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <MaterialIcons name="emoji-events" size={22} color="#f7b500" style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Mục tiêu</Text>
                    <Text style={[styles.infoValue, { color: "#f7b500" }]}>
                      {formatCurrency(campaign.targetAmount)}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <FontAwesome name="user" size={22} color="#4285F4" style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Lượt đóng góp</Text>
                    <Text style={[styles.infoValue, { color: "#4285F4" }]}>
                      {campaign.donationCount ?? 0}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={22} color="#888" style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Ngày bắt đầu</Text>
                    <Text style={styles.infoValue}>
                      {campaign.fundraisingStartDate
                        ? new Date(campaign.fundraisingStartDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={22} color="#888" style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Ngày kết thúc</Text>
                    <Text style={styles.infoValue}>
                      {campaign.fundraisingEndDate
                        ? new Date(campaign.fundraisingEndDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.description}>{campaign.description || "—"}</Text>

              <Text style={styles.sectionTitle}>Các giai đoạn</Text>
              {(campaign.phases && campaign.phases.length) ? (
                campaign.phases.map((p: Phase) => (
                  <View key={p.id} style={styles.phase}>
                    <Text style={styles.phaseTitle}>{p.phaseName}</Text>
                    <Text style={styles.phaseMeta}>Địa điểm: {p.location || "—"}</Text>
                    <Text style={styles.phaseMeta}>Trạng thái: {p.status || "—"}</Text>
                    <View style={styles.phaseAmounts}>
                      <Text style={styles.phaseAmount}>Nguyên liệu: {formatCurrency(p.ingredientFundsAmount)}</Text>
                      <Text style={styles.phaseAmount}>Nấu nướng: {formatCurrency(p.cookingFundsAmount)}</Text>
                      <Text style={styles.phaseAmount}>Giao hàng: {formatCurrency(p.deliveryFundsAmount)}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.description}>Chưa có giai đoạn</Text>
              )}

              <TouchableOpacity style={styles.primaryButton} onPress={() => { /* TODO: donate flow */ }}>
                <Text style={styles.primaryButtonText}>Ủng hộ</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.center}>
            <Text style={styles.placeholder}>No campaign selected</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const PRIMARY = "#ad4e28";
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topBack: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: PRIMARY,
  },
  topBackText: { color: "#fff", fontWeight: "700" },

  scroll: { paddingTop: 56, paddingBottom: 32 },
  image: { width: "100%", height: 240, backgroundColor: "#eee" },
  content: { padding: 16 },

  title: { fontSize: 20, fontWeight: "800", color: "#111", marginBottom: 12 },
  row: { flexDirection: "row", marginBottom: 8 },
  label: { width: 110, color: "#666", fontWeight: "700" },
  value: { flex: 1, color: "#333" },

  infoBox: {
    backgroundColor: "#fdf7f0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoTitle: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 8,
    color: "#ad4e28",
  },
  progressBarBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#e6e6e6",
    borderRadius: 8,
    marginRight: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#ff8800",
    borderRadius: 8,
  },
  progressPercent: {
    fontWeight: "700",
    color: "#ad4e28",
    fontSize: 13,
    minWidth: 32,
    textAlign: "right",
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  infoItem: {
    width: "48%",
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  infoIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 2,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 12, marginBottom: 8, color: PRIMARY },

  description: { color: "#333", lineHeight: 20 },

  phase: { marginBottom: 12, padding: 12, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#f0e6e1" },
  phaseTitle: { fontWeight: "800", marginBottom: 6 },
  phaseMeta: { color: "#666", fontSize: 13, marginBottom: 4 },
  phaseAmounts: { marginTop: 8 },
  phaseAmount: { color: PRIMARY, fontWeight: "700" },

  primaryButton: { marginTop: 16, backgroundColor: PRIMARY, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "800" },

  center: { padding: 24, alignItems: "center" },
  errorText: { color: "red" },
  placeholder: { color: "#666" },
});
