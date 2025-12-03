import IngredientService from "@/services/ingredientService";
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

export default function IngredientRequestPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await IngredientService.getMyIngredientRequests({
          limit: 10,
          offset: 0,
        });
        if (mounted) setRequests(data || []);
      } catch (err) {
        console.error("Error loading ingredient requests:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const formatCurrency = (v?: number | string | null) => {
    const n = Number(v || 0);
    if (Number.isNaN(n)) return "0 đ";
    return n.toLocaleString("vi-VN") + " đ";
  };

  const renderStatusChip = (status?: string) => {
    if (!status) return null;
    const s = String(status).toUpperCase();
    let color = "#999";
    let bg = "#f2f2f2";
    if (s === "PENDING") {
      color = "#b26a00";
      bg = "#fff4e0";
    } else if (s === "APPROVED") {
      color = "#1b873f";
      bg = "#e5f7ec";
    } else if (s === "REJECTED") {
      color = "#c82333";
      bg = "#ffe5e5";
    }
    return (
      <View style={[styles.statusChip, { backgroundColor: bg }]}>
        <Text style={[styles.statusChipText, { color }]}>{s}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header với nền cong nhẹ */}
      <View style={styles.headerBg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Yêu cầu nguyên liệu</Text>
        <Text style={styles.subtitle}>
          Xem lại các yêu cầu nguyên liệu đã gửi cho từng giai đoạn.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={PRIMARY} size="large" />
          <Text style={styles.loadingText}>Đang tải danh sách yêu cầu...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Header card */}
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    Yêu cầu #{item.shortCode || item.id?.slice(0, 8) || "—"}
                  </Text>
                  <Text style={styles.cardMeta}>
                    Ngày tạo:{" "}
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString("vi-VN")
                      : "—"}
                  </Text>
                </View>
                {renderStatusChip(item.status)}
              </View>

              {/* Tổng tiền */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng chi phí dự kiến</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(item.totalCost)}
                </Text>
              </View>

              {/* Danh sách nguyên liệu */}
              <View style={styles.divider} />
              <Text style={styles.cardSectionTitle}>Danh sách nguyên liệu</Text>
              {Array.isArray(item.items) && item.items.length > 0 ? (
                item.items.map((ing: any) => (
                  <View key={ing.id} style={styles.ingredientRow}>
                    <View style={styles.ingredientBullet} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ingredientName}>
                        {ing.ingredientName}
                      </Text>
                      <Text style={styles.ingredientDetail}>
                        Số lượng: {ing.quantity} • Thành tiền ước tính:{" "}
                        {formatCurrency(ing.estimatedTotalPrice)}
                      </Text>
                      {ing.supplier ? (
                        <Text style={styles.ingredientSupplier}>
                          Nhà cung cấp: {ing.supplier}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyItemsText}>
                  Không có nguyên liệu nào trong yêu cầu này.
                </Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>♡</Text>
              <Text style={styles.emptyTitle}>
                Bạn chưa có yêu cầu nguyên liệu nào
              </Text>
              <Text style={styles.emptyDesc}>
                Hãy tạo yêu cầu đầu tiên cho giai đoạn nấu ăn của bạn.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.back()}
              >
                <Text style={styles.emptyBtnText}>Tạo yêu cầu nguyên liệu</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Nút dưới cùng */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.actionBtnText}>Tạo yêu cầu nguyên liệu mới</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  backIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginRight: 2,
  },
  backText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#ffe8d4",
    marginTop: 2,
  },

  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 96,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: PRIMARY,
  },
  cardMeta: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "800",
    color: PRIMARY,
  },

  divider: {
    height: 1,
    backgroundColor: "#f1e4dd",
    marginVertical: 8,
  },

  cardSectionTitle: {
    fontWeight: "700",
    fontSize: 13,
    color: PRIMARY,
    marginBottom: 6,
  },

  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PRIMARY,
    marginTop: 6,
    marginRight: 8,
  },
  ingredientName: {
    fontWeight: "600",
    color: "#222",
    fontSize: 13,
  },
  ingredientDetail: {
    color: "#777",
    fontSize: 12,
    marginTop: 2,
  },
  ingredientSupplier: {
    color: "#999",
    fontSize: 12,
    marginTop: 1,
  },
  emptyItemsText: {
    fontSize: 12,
    color: "#999",
  },

  emptyBox: {
    flex: 1,
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
    color: "#e0c4b0",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: PRIMARY,
    marginBottom: 4,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginBottom: 14,
  },
  emptyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  buttonRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: BG,
  },
  actionBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
