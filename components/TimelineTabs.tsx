import type { CampaignDetail } from "@/types/api/campaign";
import React, { ReactNode, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type PlannedIngredientItem = {
  name: string;
  quantity: number;
  unit: string;
};

type PlannedMealItem = {
  name: string;
  quantity: number;
};

type TimelineItem = {
  label: string;
  date: string;
  time: string;
  status: "done" | "current" | "upcoming";
  type?: "ingredient" | "cooking" | "delivery" | "other";
  plannedIngredients?: PlannedIngredientItem[];
  plannedMeals?: PlannedMealItem[];
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

  phases.forEach((p) => {
    // Ingredient purchase
    if (p.ingredientPurchaseDate) {
      const dt = formatDateTime(p.ingredientPurchaseDate);
      items.push({
        label: `${p.phaseName} - Mua nguyên liệu`,
        date: dt.date,
        time: dt.time,
        status: now > new Date(p.ingredientPurchaseDate).getTime() ? "done" : "upcoming",
        type: "ingredient",
        plannedIngredients: (p.plannedIngredients || []).map((ing) => ({
          name: ing.name || "",
          quantity: Number(ing.quantity) || 0,
          unit: ing.unit || "",
        })),
      });
    }
    // Cooking
    if (p.cookingDate) {
      const dt = formatDateTime(p.cookingDate);
      items.push({
        label: `${p.phaseName} - Nấu ăn`,
        date: dt.date,
        time: dt.time,
        status: now > new Date(p.cookingDate).getTime() ? "done" : "upcoming",
        type: "cooking",
        plannedMeals: (p.plannedMeals || []).map((meal) => ({
          name: meal.name || "",
          quantity: Number(meal.quantity) || 0,
        })),
      });
    }
    // Delivery
    if (p.deliveryDate) {
      const dt = formatDateTime(p.deliveryDate);
      items.push({
        label: `${p.phaseName} - Giao hàng`,
        date: dt.date,
        time: dt.time,
        status: now > new Date(p.deliveryDate).getTime() ? "done" : "upcoming",
        type: "delivery",
      });
    }
  });

  // Đánh dấu mốc hiện tại
  let currentIdx = items.findIndex((i) => i.status === "upcoming");
  if (currentIdx === -1) currentIdx = items.length - 1;

  const finalItems: TimelineItem[] = items.map((item, idx) => ({
    ...item,
    status:
      idx < currentIdx
        ? "done"
        : idx === currentIdx
          ? "current"
          : "upcoming",
  }));

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
          <Text
            style={[
              styles.tabText,
              activeTab === "phases" && styles.tabTextActive,
            ]}
          >
            Giai đoạn
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "timeline" && styles.tabActive]}
          onPress={() => setActiveTab("timeline")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "timeline" && styles.tabTextActive,
            ]}
          >
            Mốc thời gian
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "phases" ? (
        <View>{children}</View>
      ) : (
        <FlatList<TimelineItem>
          data={timeline}
          keyExtractor={(_, idx) => idx.toString()}
          contentContainerStyle={{ paddingTop: 4 }}
          renderItem={({ item, index }) => {
            const isFirst = index === 0;
            const isLast = index === timeline.length - 1;

            const statusColor =
              item.status === "done"
                ? "#16a34a"
                : item.status === "current"
                  ? "#f97316"
                  : "#d4d4d4";

            const statusText =
              item.status === "done"
                ? "Hoàn thành"
                : item.status === "current"
                  ? "Đang thực hiện"
                  : "Sắp tới";

            const cardBg =
              item.status === "done"
                ? "#ecfdf3"
                : item.status === "current"
                  ? "#fff7ed"
                  : "#f9fafb";

            return (
              <View style={styles.timelineRow}>
                {/* Cột line + chấm tròn */}
                <View style={styles.timelineCol}>
                  {!isFirst && <View style={styles.line} />}
                  <View
                    style={[
                      styles.bulletOuter,
                      { borderColor: statusColor },
                    ]}
                  >
                    <View
                      style={[
                        styles.bulletInner,
                        { backgroundColor: statusColor },
                      ]}
                    />
                  </View>
                  {!isLast && <View style={styles.line} />}
                </View>

                {/* Card nội dung */}
                <View style={[styles.timelineCard, { backgroundColor: cardBg }]}>
                  <Text style={styles.timelineLabel}>{item.label}</Text>
                  <View style={styles.dateRow}>
                    <Text style={styles.calendarIcon}>🗓</Text>
                    <Text style={styles.timelineDate}>
                      {item.date}
                      {item.time ? ` | ${item.time}` : ""}
                    </Text>
                  </View>

                  {/* Planned Ingredients for "Mua nguyên liệu" */}
                  {item.type === "ingredient" &&
                    item.plannedIngredients &&
                    item.plannedIngredients.length > 0 && (
                      <View style={styles.detailBox}>
                        <Text style={styles.detailTitle}>⚙ Nguyên liệu dự kiến</Text>
                        {item.plannedIngredients.map((ing, ingIdx) => (
                          <View key={ingIdx} style={styles.detailRow}>
                            <Text style={styles.detailName}>{ing.name}</Text>
                            <Text style={styles.detailValue}>
                              {ing.quantity} {ing.unit}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                  {/* Planned Meals for "Nấu ăn" */}
                  {item.type === "cooking" &&
                    item.plannedMeals &&
                    item.plannedMeals.length > 0 && (
                      <View style={styles.detailBox}>
                        <Text style={styles.detailTitle}>🍴 Món ăn dự kiến</Text>
                        {item.plannedMeals.map((meal, mealIdx) => (
                          <View key={mealIdx} style={styles.detailRow}>
                            <Text style={styles.detailName}>{meal.name}</Text>
                            <Text style={styles.detailValue}>x{meal.quantity}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                </View>
              </View>
            );
          }}
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
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tabText: { color: "#333", fontWeight: "600" },
  tabTextActive: { color: "#ad4e28" },

  // Timeline
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  timelineCol: {
    width: 34,
    alignItems: "center",
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#f97316",
  },
  bulletOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  bulletInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineCard: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  timelineLabel: {
    fontWeight: "700",
    color: "#222",
    fontSize: 15,
    flexShrink: 1,
  },
  statusBadge: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  calendarIcon: {
    marginRight: 6,
  },
  timelineDate: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
  },

  // Detail box for ingredients/meals
  detailBox: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16a34a",
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailName: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
});
