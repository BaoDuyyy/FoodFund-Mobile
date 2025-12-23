import Loading from "@/components/Loading";
import DonationService from "@/services/donationService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, PixelRatio, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Base width for scaling (based on standard phone width ~375px)
const BASE_WIDTH = 375;

// Responsive scaling functions
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Normalize font size based on pixel ratio for consistency across devices
const normalizeFontSize = (size: number) => {
  const newSize = scale(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

const PRIMARY = "#ad4e28";

export default function DonorListPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [donors, setDonors] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const fetchDonors = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await DonationService.listDonationStatements({
        campaignId: id,
        limit: 10,
        page,
        query: search || null,
        sortBy: sort === "desc" ? "NEWEST" : "OLDEST",
      });
      setDonors(res.transactions || []);
      setTotal(res.totalDonations || 0);
    } catch (e) {
      // Error fetching donation statements
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDonors();
  }, [id, search, page, sort]);

  const totalPages = Math.ceil(total / 10);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={moderateScale(18)} color="#222" />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Danh sách người ủng hộ</Text>
      </View>

      {/* Search + Sort */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm người ủng hộ..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={text => { setSearch(text); setPage(1); }}
        />
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setSort(sort === "desc" ? "asc" : "desc")}
        >
          <Text style={styles.sortText}>{sort === "desc" ? "Mới nhất" : "Cũ nhất"}</Text>
          <Ionicons name="chevron-down" size={moderateScale(14)} color="#222" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <Loading visible={loading} message="Đang tải danh sách..." />
      {!loading && (
        <FlatList
          data={donors}
          keyExtractor={item => String(item.no)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.donorName?.[0]?.toUpperCase() || "A"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.donorName || "Anonymous"}</Text>
                <Text style={styles.date}>
                  {new Date(item.transactionDateTime).toLocaleDateString("vi-VN")} |{" "}
                  {new Date(item.transactionDateTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.amountBox}>
                <Text style={styles.amount}>{Number(item.receivedAmount).toLocaleString("vi-VN")}</Text>
                <Text style={styles.amountUnit}>VNĐ</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Chưa có lượt ủng hộ nào</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: moderateScale(22) }}
        />
      )}

      {/* Paging */}
      <View style={styles.pagingRow}>
        <TouchableOpacity
          style={[styles.pagingBtn, page === 1 && styles.pagingBtnDisabled]}
          disabled={page === 1}
          onPress={() => setPage(page - 1)}
        >
          <Text style={styles.pagingText}>Trước</Text>
        </TouchableOpacity>
        <Text style={styles.pagingInfo}>
          Trang {page} / {totalPages || 1}
        </Text>
        <TouchableOpacity
          style={[styles.pagingBtn, page === totalPages && styles.pagingBtnDisabled]}
          disabled={page === totalPages || totalPages === 0}
          onPress={() => setPage(page + 1)}
        >
          <Text style={styles.pagingText}>Sau</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f6f4",
    paddingHorizontal: "4%",
    paddingTop: moderateScale(14),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: moderateScale(8),
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  backText: {
    color: "#222",
    fontWeight: "600",
    marginLeft: moderateScale(4),
    fontSize: normalizeFontSize(13),
  },
  title: {
    fontWeight: "800",
    fontSize: normalizeFontSize(17),
    color: "#222",
  },
  searchRow: {
    flexDirection: "row",
    marginBottom: moderateScale(12),
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    fontSize: normalizeFontSize(13),
    marginRight: moderateScale(8),
    borderWidth: 1,
    borderColor: "#eee",
    minHeight: moderateScale(40), // Ensure minimum touch target
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: "#eee",
    minHeight: moderateScale(40), // Ensure minimum touch target
  },
  sortText: {
    color: "#222",
    fontWeight: "600",
    fontSize: normalizeFontSize(12),
    marginRight: moderateScale(4),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    marginBottom: moderateScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#ffb46b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(10),
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: normalizeFontSize(18),
  },
  name: {
    fontWeight: "700",
    fontSize: normalizeFontSize(15),
    color: "#111",
  },
  date: {
    color: "#888",
    fontSize: normalizeFontSize(12),
    marginTop: moderateScale(2),
  },
  amountBox: {
    alignItems: "flex-end",
    marginLeft: moderateScale(10),
  },
  amount: {
    color: "#ad4e28",
    fontWeight: "800",
    fontSize: normalizeFontSize(16),
  },
  amountUnit: {
    color: "#888",
    fontSize: normalizeFontSize(11),
    fontWeight: "600",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(22),
  },
  emptyText: {
    color: "#888",
    fontSize: normalizeFontSize(14),
    fontWeight: "600",
  },
  pagingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(8),
    gap: moderateScale(10),
  },
  pagingBtn: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
    borderWidth: 1,
    borderColor: "#eee",
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  pagingBtnDisabled: { opacity: 0.5 },
  pagingText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: normalizeFontSize(13),
  },
  pagingInfo: {
    color: "#222",
    fontWeight: "600",
    fontSize: normalizeFontSize(13),
  },
});

