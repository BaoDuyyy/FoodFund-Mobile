import React from "react";
import {
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import type { CampaignItem } from "../types/api/campaign";

type Props = {
  campaign: CampaignItem;
  onPress?: () => void;
};

const PRIMARY = "#ad4e28";

function formatCurrency(v?: string | number | null) {
  const n = Number(v || 0);
  return n.toLocaleString("vi-VN") + " đ";
}

export default function CampaignCard({ campaign, onPress }: Props) {
  const progress = Math.max(0, Math.min(100, Number(campaign.fundingProgress || 0)));
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <ImageBackground
        source={{ uri: campaign.coverImage || undefined }}
        style={styles.image}
        imageStyle={styles.imageRadius}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{(campaign.donationCount ?? 0) + " lượt ủng hộ"}</Text>
        </View>

        <View style={styles.overlay}>
          <View style={styles.overlayRow}>
            <Text style={styles.amountText}>{formatCurrency(campaign.receivedAmount)}</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{`${Math.round(progress)}%`}</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </ImageBackground>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {campaign.title}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>🏠 {campaign.creator?.full_name || "—"}</Text>
          <Text style={styles.metaText}>📂 {campaign.category?.title || "—"}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Lượt ủng hộ</Text>
            <Text style={styles.statValue}>{campaign.donationCount ?? 0}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Đã ủng hộ</Text>
            <Text style={styles.statValue}>{formatCurrency(campaign.receivedAmount)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Mục tiêu</Text>
            <Text style={styles.statValue}>{formatCurrency(campaign.targetAmount)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    // shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    height: 160,
    backgroundColor: "#eee",
    justifyContent: "flex-end",
  },
  imageRadius: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  overlay: {
    backgroundColor: "rgba(255,255,255,0.55)",
    padding: 10,
    margin: 12,
    borderRadius: 10,
  },
  overlayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountText: { fontWeight: "800", fontSize: 18, color: "#333" },
  pill: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },
  pillText: { color: "#333", fontWeight: "700" },

  progressBar: {
    height: 8,
    backgroundColor: "#f0eae6",
    borderRadius: 8,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: PRIMARY,
    borderRadius: 8,
  },

  body: { padding: 12 },
  title: { fontSize: 16, fontWeight: "800", color: "#0b0b0b", marginBottom: 8 },

  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  metaText: { color: "#666", fontSize: 13 },

  statsRow: { borderTopWidth: 1, borderTopColor: "#f0e6e1", paddingTop: 12, flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center" },
  statLabel: { color: "#777", fontSize: 12 },
  statValue: { color: PRIMARY, fontWeight: "800", marginTop: 4 },
});
