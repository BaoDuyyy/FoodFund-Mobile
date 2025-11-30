import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOCK_ORGS = [
  {
    id: "1",
    name: "Hội chữ thập đỏ thành phố Huế",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Red_Cross_logo.png",
    desc: "",
  },
  {
    id: "2",
    name: "Mặt trận Tổ quốc Việt Nam - Ban Vận động",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Mat_tran_to_quoc_vn.png",
    desc: "",
  },
  {
    id: "3",
    name: "MB Ageas Life",
    avatar: "https://mbageas.com.vn/assets/images/logo.png",
    desc: "",
  },
  {
    id: "4",
    name: "BAO HIEM XA HOI TINH AN GIANG",
    avatar: "https://foodfund.minhphuoc.io.vn/mock-org-4.jpg",
    desc: "",
  },
  {
    id: "5",
    name: "Hội Chữ thập đỏ Việt Nam",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Red_Cross_logo.png",
    desc: "Hội Chữ thập đỏ Việt Nam là tổ chức xã hội nhân đạo quần chúng, do Chủ tịch Hồ Chí Minh sáng lập.",
  },
  {
    id: "6",
    name: "CÔNG TY ANH EM",
    avatar: "https://foodfund.minhphuoc.io.vn/mock-org-6.jpg",
    desc: "",
  },
  {
    id: "7",
    name: "Hướng nghiệp Sông An",
    avatar: "https://foodfund.minhphuoc.io.vn/mock-org-7.jpg",
    desc: "Với mong muốn hướng nghiệp được lan tỏa đến nhiều người hơn, từ người cần được hướng nghiệp đến người muốn giúp đỡ.",
  },
  {
    id: "8",
    name: "THIÊN KIM FUND",
    avatar: "https://foodfund.minhphuoc.io.vn/mock-org-8.jpg",
    desc: "",
  },
  {
    id: "9",
    name: "Báo Tiền Phong",
    avatar: "https://foodfund.minhphuoc.io.vn/mock-org-9.jpg",
    desc: "",
  },
];

export default function OrganizationsPage() {
  const [search, setSearch] = useState("");

  const filteredOrgs = MOCK_ORGS.filter(org =>
    org.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#ad4e28" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách tổ chức gây quỹ</Text>
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#ad4e28" style={{ marginLeft: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Nhập tên tổ chức"
          placeholderTextColor="#bdbdbd"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filteredOrgs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.orgRow}>
            <Image source={{ uri: item.avatar }} style={styles.orgAvatar} />
            <View style={styles.orgInfo}>
              <Text style={styles.orgName} numberOfLines={1}>{item.name}</Text>
              {item.desc ? (
                <Text style={styles.orgDesc} numberOfLines={2}>{item.desc}</Text>
              ) : null}
            </View>
            <TouchableOpacity style={styles.orgAction}>
              <Ionicons name="person-add-outline" size={22} color="#ad4e28" />
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
    flex: 1,
    textAlign: "center",
    marginRight: 32,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#f3f3f3",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#222",
    marginLeft: 8,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  orgRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  orgAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  orgInfo: {
    flex: 1,
    justifyContent: "center",
  },
  orgName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#222",
    marginBottom: 2,
  },
  orgDesc: {
    color: "#666",
    fontSize: 13,
    marginTop: 2,
  },
  orgAction: {
    marginLeft: 12,
    backgroundColor: "#fff7f2",
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ffe3d1",
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "#f3f3f3",
    marginLeft: 72,
  },
});
