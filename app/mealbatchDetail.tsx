import Loading from "@/components/Loading";
import { BG_KITCHEN as BG, BORDER, MUTED_TEXT as MUTED, PRIMARY, TEXT } from "@/constants/colors";
import {
  getMealBatchStatusColors,
  getMealBatchStatusLabel
} from "@/constants/mealBatchStatus";
import MealBatchService from "@/services/mealBatchService";
import type { MealBatch } from "@/types/api/mealBatch";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MealBatchDetailPage() {
  const router = useRouter();
  const { mealBatchId } = useLocalSearchParams<{ mealBatchId?: string }>();

  const [batch, setBatch] = useState<MealBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mealBatchId) {
        setError("Thiếu thông tin suất ăn.");
        setLoading(false);
        return;
      }
      try {
        const data = await MealBatchService.getMealBatchById(
          mealBatchId as string
        );
        if (!mounted) return;
        setBatch(data);
      } catch (e: any) {
        if (mounted)
          setError(e?.message || "Không tải được chi tiết suất ăn.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [mealBatchId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading visible={loading} message="Đang tải chi tiết suất ăn..." />
      </SafeAreaView>
    );
  }

  if (error || !batch) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitleDark}>Chi tiết suất ăn</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
          </View>
          <Text style={styles.errorText}>{error || "Không tìm thấy suất ăn."}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColors = getMealBatchStatusColors(batch.status);
  const hasMedia = Array.isArray(batch.media) && batch.media.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitleDark}>Chi tiết suất ăn</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColors.text }]} />
              <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                {getMealBatchStatusLabel(batch.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{batch.foodName}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <View style={styles.heroStatIconWrap}>
                <Ionicons name="restaurant-outline" size={20} color={PRIMARY} />
              </View>
              <View>
                <Text style={styles.heroStatValue}>{batch.quantity}</Text>
                <Text style={styles.heroStatLabel}>Số lượng</Text>
              </View>
            </View>

            {batch.cookedDate && (
              <View style={styles.heroStatItem}>
                <View style={styles.heroStatIconWrap}>
                  <Ionicons name="calendar-outline" size={20} color={PRIMARY} />
                </View>
                <View>
                  <Text style={styles.heroStatValue}>
                    {new Date(batch.cookedDate).toLocaleDateString("vi-VN")}
                  </Text>
                  <Text style={styles.heroStatLabel}>Ngày nấu</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Kitchen Staff Card */}
        {batch.kitchenStaff && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardIconWrap}>
                <Ionicons name="person-outline" size={18} color={PRIMARY} />
              </View>
              <Text style={styles.infoCardTitle}>Bếp phụ trách</Text>
            </View>
            <View style={styles.staffInfo}>
              <View style={styles.staffAvatar}>
                <Text style={styles.staffAvatarText}>
                  {batch.kitchenStaff.full_name?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
              <Text style={styles.staffName}>{batch.kitchenStaff.full_name}</Text>
            </View>
          </View>
        )}

        {/* Ingredient Usages Card */}
        {batch.ingredientUsages && batch.ingredientUsages.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardIconWrap}>
                <Ionicons name="leaf-outline" size={18} color={PRIMARY} />
              </View>
              <Text style={styles.infoCardTitle}>Nguyên liệu sử dụng</Text>
            </View>
            <View style={styles.ingredientList}>
              {batch.ingredientUsages.map((usage, idx) => (
                <View key={idx} style={styles.ingredientItem}>
                  <View style={styles.ingredientDot} />
                  <Text style={styles.ingredientName}>
                    {usage.ingredientItem?.ingredientName || "N/A"}
                  </Text>
                  <Text style={styles.ingredientQty}>
                    x{usage.ingredientItem?.quantity || 0}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Media Card */}
        {hasMedia && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardIconWrap}>
                <Ionicons name="images-outline" size={18} color={PRIMARY} />
              </View>
              <Text style={styles.infoCardTitle}>Hình ảnh</Text>
              <View style={styles.mediaBadge}>
                <Text style={styles.mediaBadgeText}>{batch.media?.length ?? 0}</Text>
              </View>
            </View>
            <View style={styles.mediaGrid}>
              {batch.media?.map((url, idx) => {
                if (!url) return null;
                return (
                  <TouchableOpacity
                    key={`${url}-${idx}`}
                    style={styles.mediaThumb}
                    activeOpacity={0.9}
                    onPress={() => setZoomImageUrl(url)}
                  >
                    <Image source={{ uri: url }} style={styles.mediaImage} />
                    <View style={styles.mediaOverlay}>
                      <Ionicons name="expand-outline" size={20} color="#fff" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ID Info */}
        <View style={styles.idCard}>
          <Text style={styles.idLabel}>Mã suất ăn</Text>
          <Text style={styles.idValue}>{batch.id}</Text>
          {batch.campaignPhaseId && (
            <>
              <Text style={[styles.idLabel, { marginTop: 8 }]}>Mã giai đoạn</Text>
              <Text style={styles.idValue}>{batch.campaignPhaseId}</Text>
            </>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Image Zoom Overlay */}
      {zoomImageUrl && (
        <View style={styles.zoomOverlay}>
          <TouchableOpacity
            style={styles.zoomBackdrop}
            activeOpacity={1}
            onPress={() => setZoomImageUrl(null)}
          />
          <View style={styles.zoomContent}>
            <Image
              source={{ uri: zoomImageUrl }}
              style={styles.zoomImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.zoomCloseBtn}
              onPress={() => setZoomImageUrl(null)}
            >
              <Ionicons name="close" size={20} color={PRIMARY} />
              <Text style={styles.zoomCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleDark: {
    flex: 1,
    color: TEXT,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: "row",
    gap: 16,
  },
  heroStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef7f0",
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  heroStatIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
  },
  heroStatLabel: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },

  // Info Card
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  infoCardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoCardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
  },

  // Staff Info
  staffInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  staffAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  staffName: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
  },

  // Ingredient List
  ingredientList: {
    gap: 10,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 10,
  },
  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginRight: 10,
  },
  ingredientName: {
    flex: 1,
    fontSize: 14,
    color: TEXT,
  },
  ingredientQty: {
    fontSize: 14,
    fontWeight: "600",
    color: PRIMARY,
    backgroundColor: "#fff7ed",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  // Media
  mediaBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  mediaBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  mediaThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e5e7eb",
  },
  mediaOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
    borderTopLeftRadius: 10,
  },

  // ID Card
  idCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  idLabel: {
    fontSize: 11,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  idValue: {
    fontSize: 12,
    color: "#6b7280",
    fontFamily: "monospace",
    marginTop: 2,
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorText: {
    textAlign: "center",
    color: "#dc2626",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Zoom Overlay
  zoomOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  zoomBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  zoomContent: {
    width: "90%",
    height: "70%",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  zoomCloseBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#fff",
    gap: 6,
  },
  zoomCloseText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 14,
  },
});
