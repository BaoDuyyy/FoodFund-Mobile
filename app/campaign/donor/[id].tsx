import Loading from "@/components/Loading";
import DonationService from "@/services/donationService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
      console.log("Donation statements response:", res);
      setDonors(res.transactions || []);
      setTotal(res.totalDonations || 0);
    } catch (e) {
      console.error("Error fetching donation statements:", e);
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
          <Ionicons name="arrow-back" size={20} color="#222" />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Danh sách người ủng hộ</Text>
      </View>

      {/* Search + Sort */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm người ủng hộ..."
          value={search}
          onChangeText={text => { setSearch(text); setPage(1); }}
        />
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setSort(sort === "desc" ? "asc" : "desc")}
        >
          <Text style={styles.sortText}>{sort === "desc" ? "Mới nhất" : "Cũ nhất"}</Text>
          <Ionicons name="chevron-down" size={16} color="#222" />
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
          contentContainerStyle={{ paddingBottom: 24 }}
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
  container: { flex: 1, backgroundColor: "#f8f6f4", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backBtn: { flexDirection: "row", alignItems: "center", marginRight: 8 },
  backText: { color: "#222", fontWeight: "600", marginLeft: 4, fontSize: 14 },
  title: { fontWeight: "800", fontSize: 18, color: "#222" },
  searchRow: { flexDirection: "row", marginBottom: 12 },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  sortText: { color: "#222", fontWeight: "600", fontSize: 13, marginRight: 4 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffb46b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 20 },
  name: { fontWeight: "700", fontSize: 16, color: "#111" },
  date: { color: "#888", fontSize: 13, marginTop: 2 },
  amountBox: { alignItems: "flex-end", marginLeft: 12 },
  amount: { color: "#ad4e28", fontWeight: "800", fontSize: 17 },
  amountUnit: { color: "#888", fontSize: 12, fontWeight: "600" },
  emptyBox: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
  emptyText: { color: "#888", fontSize: 15, fontWeight: "600" },
  pagingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 12,
  },
  pagingBtn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#eee",
  },
  pagingBtnDisabled: { opacity: 0.5 },
  pagingText: { color: PRIMARY, fontWeight: "700", fontSize: 14 },
  pagingInfo: { color: "#222", fontWeight: "600", fontSize: 14 },
});
