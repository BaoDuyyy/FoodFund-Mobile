import React from "react";
import type { DimensionValue } from "react-native";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";




const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_SIZE = Math.min(110, SCREEN_WIDTH * 0.3);

function formatCurrency(v?: string | number | null) {
  const n = Number(v || 0);
  return n.toLocaleString("vi-VN") + " đ";
}

export default function PhaseBudget({ phase }: any) {
  const ingredientFunds = Number(phase.ingredientFundsAmount ?? 0);
  const cookingFunds = Number(phase.cookingFundsAmount ?? 0);
  const deliveryFunds = Number(phase.deliveryFundsAmount ?? 0);

  const total = ingredientFunds + cookingFunds + deliveryFunds;

  const ingredientPercent = Number(phase.ingredientBudgetPercentage ?? 0);
  const cookingPercent = Number(phase.cookingBudgetPercentage ?? 0);
  const deliveryPercent = Number(phase.deliveryBudgetPercentage ?? 0);

  const ingredientReceived = ingredientFunds;
  const cookingReceived = cookingFunds;
  const deliveryReceived = deliveryFunds;

  const allFunds = ingredientFunds + cookingFunds + deliveryFunds;
  const ingredientExpected = Math.round((ingredientPercent / 100) * allFunds);
  const cookingExpected = Math.round((cookingPercent / 100) * allFunds);
  const deliveryExpected = Math.round((deliveryPercent / 100) * allFunds);

  const chartData = [
    {
      name: "Nguyên liệu",
      population: ingredientPercent,
      color: "#ff8800",
      legendFontColor: "#222",
      legendFontSize: 12,
    },
    {
      name: "Nấu ăn",
      population: cookingPercent,
      color: "#4b5cff",
      legendFontColor: "#222",
      legendFontSize: 12,
    },
    {
      name: "Vận chuyển",
      population: deliveryPercent,
      color: "#43b46b",
      legendFontColor: "#222",
      legendFontSize: 12,
    },
  ];

  const getProgressWidth = (
    received: number,
    expected: number
  ): DimensionValue => {
    if (!expected) return 0;
    const percent = Math.min(100, (received / expected) * 100);
    // progress dạng "XX%" để thanh chạy theo phần trăm chiều rộng
    return `${percent}%`;
  };

  return (
    <View style={styles.box}>
      <Text style={styles.title} numberOfLines={3}>
        {phase.phaseName} - {phase.location}
      </Text>

      <Text style={styles.totalLabel}>Tổng giai đoạn</Text>
      <Text style={styles.totalValue}>{formatCurrency(total)}</Text>

      <View style={styles.row}>
        <View style={styles.chartWrapper}>
          <PieChart
            data={chartData}
            width={CHART_SIZE}
            height={CHART_SIZE}
            chartConfig={{
              color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"0"}
            hasLegend={false}
            center={[0, 0]}
            style={styles.chart}
          />
        </View>

        <View style={styles.legendContainer}>
          {chartData.map((item) => (
            <View key={item.name} style={styles.legendRow}>
              <View
                style={[styles.legendDot, { backgroundColor: item.color }]}
              />
              <Text style={styles.legendLabel}>{item.name}</Text>
              <Text style={styles.legendPercent}>{item.population}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Nguyên liệu */}
      <View style={[styles.section, { borderColor: "#ff8800" }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: "#ff8800" }]} />
          <Text style={styles.sectionTitle}>Nguyên liệu</Text>
          <View style={styles.sectionPercent}>
            <Text style={[styles.sectionPercentText, { color: "#ff8800" }]}>
              {ingredientPercent}%
            </Text>
          </View>
        </View>
        <Text style={styles.sectionReceived}>
          Đã nhận:{" "}
          <Text style={styles.sectionReceivedBold}>
            {formatCurrency(ingredientReceived)}
          </Text>
        </Text>
        <Text style={styles.sectionExpected}>
          Dự kiến: {formatCurrency(ingredientExpected)}
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: "#ff8800",
                width: getProgressWidth(ingredientReceived, ingredientExpected),
              },
            ]}
          />
        </View>
      </View>

      {/* Nấu ăn */}
      <View style={[styles.section, { borderColor: "#4b5cff" }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: "#4b5cff" }]} />
          <Text style={styles.sectionTitle}>Nấu ăn</Text>
          <View style={styles.sectionPercent}>
            <Text style={[styles.sectionPercentText, { color: "#4b5cff" }]}>
              {cookingPercent}%
            </Text>
          </View>
        </View>
        <Text style={styles.sectionReceived}>
          Đã nhận:{" "}
          <Text style={styles.sectionReceivedBold}>
            {formatCurrency(cookingReceived)}
          </Text>
        </Text>
        <Text style={styles.sectionExpected}>
          Dự kiến: {formatCurrency(cookingExpected)}
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: "#4b5cff",
                width: getProgressWidth(cookingReceived, cookingExpected),
              },
            ]}
          />
        </View>
      </View>

      {/* Vận chuyển */}
      <View style={[styles.section, { borderColor: "#43b46b" }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: "#43b46b" }]} />
          <Text style={styles.sectionTitle}>Vận chuyển</Text>
          <View style={styles.sectionPercent}>
            <Text style={[styles.sectionPercentText, { color: "#43b46b" }]}>
              {deliveryPercent}%
            </Text>
          </View>
        </View>
        <Text style={styles.sectionReceived}>
          Đã nhận:{" "}
          <Text style={styles.sectionReceivedBold}>
            {formatCurrency(deliveryReceived)}
          </Text>
        </Text>
        <Text style={styles.sectionExpected}>
          Dự kiến: {formatCurrency(deliveryExpected)}
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: "#43b46b",
                width: getProgressWidth(deliveryReceived, deliveryExpected),
              },
            ]}
          />
        </View>
      </View>

      {/* Planned Meals */}
      {Array.isArray(phase.plannedMeals) && phase.plannedMeals.length > 0 && (
        <View style={styles.plannedSection}>
          <Text style={styles.plannedTitle}>🍴 Suất ăn dự kiến</Text>
          {phase.plannedMeals.map((meal: any, idx: number) => (
            <View key={meal.id || idx} style={styles.plannedItem}>
              <View style={styles.plannedDot} />
              <Text style={styles.plannedName}>{meal.name}</Text>
              <Text style={styles.plannedQty}>x{meal.quantity}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Planned Ingredients */}
      {Array.isArray(phase.plannedIngredients) && phase.plannedIngredients.length > 0 && (
        <View style={styles.plannedSection}>
          <Text style={styles.plannedTitle}>🥬 Nguyên liệu dự kiến</Text>
          {phase.plannedIngredients.map((ing: any, idx: number) => (
            <View key={ing.id || idx} style={styles.plannedItem}>
              <View style={[styles.plannedDot, { backgroundColor: "#ff8800" }]} />
              <Text style={styles.plannedName}>{ing.name}</Text>
              <Text style={styles.plannedQty}>
                {ing.quantity} {ing.unit}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 16,
    // card look trên mobile
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontWeight: "800",
    fontSize: 14,
    lineHeight: 18,
    color: "#ad4e28",
    marginBottom: 4,
  },
  totalLabel: {
    color: "#888",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 2,
  },
  totalValue: {
    color: "#ad4e28",
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",      // cho chart + legend căn giữa
    marginBottom: 10,
  },
  chartWrapper: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,             // QUAN TRỌNG: không cho flex bóp nhỏ
  },
  chart: {
    flexShrink: 0,             // phòng xa, chart không bị thu hẹp
  },
  legendContainer: {
    marginLeft: 14,
    flex: 1,
    paddingTop: 4,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendLabel: {
    color: "#222",
    fontWeight: "600",
    fontSize: 13,
    marginRight: 6,
  },
  legendPercent: {
    color: "#888",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: "auto",
  },
  section: {
    backgroundColor: "#f7f8fa",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionBar: {
    width: 3,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 14,
    color: "#222",
    marginRight: 8,
  },
  sectionPercent: {
    marginLeft: "auto",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  sectionPercentText: {
    fontWeight: "700",
    fontSize: 11,
  },
  sectionReceived: {
    color: "#222",
    fontSize: 13,
    marginBottom: 2,
  },
  sectionReceivedBold: {
    fontWeight: "700",
  },
  sectionExpected: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },

  // Planned Meals & Ingredients
  plannedSection: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  plannedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16a34a",
    marginBottom: 8,
  },
  plannedItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  plannedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16a34a",
    marginRight: 10,
  },
  plannedName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  plannedQty: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
});
