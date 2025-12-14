import Loading from "@/components/Loading";
import { BG_KITCHEN as BG, BORDER, MUTED_TEXT as MUTED, PRIMARY, TEXT } from "@/constants/colors";
import MealBatchService from "@/services/mealBatchService";
import type { MealBatch } from "@/types/api/mealBatch";
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

  const getStatusLabel = (status?: string | null) => {
    if (!status) return "Không xác định";
    const s = status.toUpperCase();
    if (s === "READY") return "Đã sẵn sàng";
    if (s === "PREPARING") return "Đang chuẩn bị";
    if (s === "DELIVERED") return "Đã giao";
    return status;
  };

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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.errorText, { marginTop: 16 }]}>{error || "Không tìm thấy suất ăn."}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBg} />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Text style={styles.headerBackIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Chi tiết suất ăn
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{batch.foodName}</Text>
          <Text style={styles.label}>Trạng thái</Text>
          <Text style={styles.value}>{getStatusLabel(batch.status)}</Text>

          <Text style={styles.label}>Số lượng</Text>
          <Text style={styles.value}>{batch.quantity}</Text>

          {batch.cookedDate && (
            <>
              <Text style={styles.label}>Ngày nấu</Text>
              <Text style={styles.value}>
                {new Date(batch.cookedDate).toLocaleString("vi-VN")}
              </Text>
            </>
          )}

          {batch.kitchenStaff && (
            <>
              <Text style={styles.label}>Bếp phụ trách</Text>
              <Text style={styles.value}>{batch.kitchenStaff.full_name}</Text>
            </>
          )}
        </View>

        {Array.isArray(batch.media) && batch.media.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hình ảnh / Video</Text>
            <View style={styles.mediaRow}>
              {batch.media.map((url, idx) => {
                if (!url) return null;
                const lower = url.toLowerCase();
                const isImage =
                  lower.endsWith(".jpg") ||
                  lower.endsWith(".jpeg") ||
                  lower.endsWith(".png") ||
                  lower.includes("image");
                if (!isImage) return null;
                return (
                  <TouchableOpacity
                    key={`${url}-${idx}`}
                    activeOpacity={0.9}
                    onPress={() => setZoomImageUrl(url)}
                  >
                    <Image source={{ uri: url }} style={styles.mediaImage} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Simple full-screen image viewer */}
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

  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff2e8",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackIcon: {
    color: PRIMARY,
    fontSize: 20,
    fontWeight: "800",
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: MUTED,
    marginTop: 6,
  },
  value: {
    fontSize: 14,
    color: TEXT,
    fontWeight: "600",
    marginTop: 2,
  },

  mediaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  mediaImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  backIcon: {
    color: PRIMARY,
    fontSize: 20,
    fontWeight: "800",
    marginRight: 4,
  },
  backText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: "700",
  },

  helperText: {
    textAlign: "center",
    marginTop: 8,
    color: MUTED,
    fontSize: 13,
  },
  errorText: {
    textAlign: "center",
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
  },

  // zoom overlay
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
    backgroundColor: "rgba(0,0,0,0.75)",
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
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  zoomCloseText: {
    color: PRIMARY,
    fontWeight: "700",
  },
});
