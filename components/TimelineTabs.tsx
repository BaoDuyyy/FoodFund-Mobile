import type { CampaignDetail } from "@/types/api/campaign";
import React, { ReactNode, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type TimelineItem = {
  label: string;
  date: string;
  time: string;
  status: "done" | "current" | "upcoming";
};

function formatDateTime(dt?: string | null) {
  if (!dt) return { date: "—", time: "" };
  const d = new Date(dt);
  const date = d.toLocaleDateString("vi-VN");
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

function getTimeline(campaign: CampaignDetail): TimelineItem[] {
  const now = Date.now();
  const items: TimelineItem[] = [];

  // 3 mốc đầu
  const created = formatDateTime(campaign.created_at);
  items.push({
    label: "Tạo chiến dịch",
    date: created.date,
    time: created.time,
    status: now > new Date(campaign.created_at || 0).getTime() ? "done" : "upcoming",
  });

  const start = formatDateTime(campaign.fundraisingStartDate);
  items.push({
    label: "Bắt đầu gây quỹ",
    date: start.date,
    time: start.time,
    status: now > new Date(campaign.fundraisingStartDate || 0).getTime() ? "done" : "upcoming",
  });

  const end = formatDateTime(campaign.fundraisingEndDate);
  items.push({
    label: "Kết thúc gây quỹ",
    date: end.date,
    time: end.time,
    status: now > new Date(campaign.fundraisingEndDate || 0).getTime() ? "done" : "upcoming",
  });

  // Các phase
  const phases = (campaign.phases || []).slice();

  phases.forEach((p, idx) => {
    // Ingredient purchase
    if (p.ingredientPurchaseDate) {
      const dt = formatDateTime(p.ingredientPurchaseDate);
      items.push({
        label: `Mua nguyên liệu: ${p.phaseName}`,
        date: dt.date,
        time: dt.time,
        status: now > new Date(p.ingredientPurchaseDate).getTime() ? "done" : "upcoming",
      });
    }
    // Cooking
    if (p.cookingDate) {
      const dt = formatDateTime(p.cookingDate);
      items.push({
        label: `Nấu ăn: ${p.phaseName}`,
        date: dt.date,
        time: dt.time,
        status: now > new Date(p.cookingDate).getTime() ? "done" : "upcoming",
      });
    }
    // Delivery
    if (p.deliveryDate) {
      const dt = formatDateTime(p.deliveryDate);
      items.push({
        label: `Vận chuyển: ${p.phaseName}`,
        date: dt.date,
        time: dt.time,
        status: now > new Date(p.deliveryDate).getTime() ? "done" : "upcoming",
      });
    }
  });

  // Đánh dấu mốc hiện tại
  let currentIdx = items.findIndex(i => i.status === "upcoming");
  if (currentIdx === -1) currentIdx = items.length - 1;
  const finalItems: TimelineItem[] = items.map((item, idx) => ({
    ...item,
    status: idx < currentIdx
      ? "done"
      : idx === currentIdx
      ? "current"
      : "upcoming"
  }) as TimelineItem);

  return finalItems;
}

export default function TimelineTabs({
  campaign,
  children,
}: {
  campaign: CampaignDetail;
  children?: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"phases" | "timeline">("phases");
  const timeline = getTimeline(campaign);

  return (
    <View style={{ marginTop: 16 }}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "phases" && styles.tabActive]}
          onPress={() => setActiveTab("phases")}
        >
          <Text style={[styles.tabText, activeTab === "phases" && styles.tabTextActive]}>Giai đoạn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "timeline" && styles.tabActive]}
          onPress={() => setActiveTab("timeline")}
        >
          <Text style={[styles.tabText, activeTab === "timeline" && styles.tabTextActive]}>Mốc thời gian</Text>
        </TouchableOpacity>
      </View>
      {activeTab === "phases" ? (
        <View>
          {/* Render children (giai đoạn) từ parent */}
          {children}
        </View>
      ) : (
        <FlatList
          data={timeline}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={({ item }) => (
            <View style={styles.timelineItem}>
              <View
                style={[
                  styles.statusDot,
                  item.status === "done"
                    ? { backgroundColor: "#43b46b" }
                    : item.status === "current"
                    ? { backgroundColor: "#ffb86c" }
                    : { backgroundColor: "#ccc" },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineLabel}>{item.label}</Text>
                <Text style={styles.timelineDate}>{item.date} {item.time && `- ${item.time}`}</Text>
              </View>
              <View style={styles.statusBox}>
                {item.status === "done" && (
                  <Text style={styles.statusDone}>Hoàn thành</Text>
                )}
                {item.status === "current" && (
                  <Text style={styles.statusCurrent}>Đang thực hiện</Text>
                )}
                {item.status === "upcoming" && (
                  <Text style={styles.statusUpcoming}>Sắp tới</Text>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: "row", marginBottom: 12 },
  tabBtn: {
    flex: 1,
    backgroundColor: "#f3f3f3",
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  tabText: { color: "#333", fontWeight: "600" },
  tabTextActive: { color: "#ad4e28" },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statusDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 12,
  },
  timelineLabel: { fontWeight: "700", color: "#222", fontSize: 15 },
  timelineDate: { color: "#888", fontSize: 13, marginTop: 2 },
  statusBox: { marginLeft: 12 },
  statusDone: { color: "#43b46b", fontWeight: "700" },
  statusCurrent: { color: "#ffb86c", fontWeight: "700" },
  statusUpcoming: { color: "#888", fontWeight: "700" },
});
