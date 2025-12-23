import OrganizationService from "@/services/organizationService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, Image, PixelRatio, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function OrganizationsPage() {
  const [search, setSearch] = useState("");
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function loadOrgs() {
      setLoading(true);
      try {
        const data = await OrganizationService.listActiveOrganizations();
        if (mounted) setOrgs(data);
      } catch (e) {
        setOrgs([]);
      }
      setLoading(false);
    }
    loadOrgs();
    return () => { mounted = false; };
  }, []);

  const filteredOrgs = orgs.filter(org =>
    org.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
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
          <TouchableOpacity
            style={styles.orgRow}
            onPress={() => router.push(`/organization/${item.id}`)}
          >
            <Image source={{ uri: item.avatar || item.logo || "" }} style={styles.orgAvatar} />
            <View style={styles.orgInfo}>
              <Text style={styles.orgName} numberOfLines={1}>{item.name}</Text>
              {item.desc || item.description ? (
                <Text style={styles.orgDesc} numberOfLines={2}>{item.desc || item.description}</Text>
              ) : null}
            </View>
            <TouchableOpacity style={styles.orgAction}>
              <Ionicons name="person-add-outline" size={22} color="#ad4e28" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshing={loading}
        onRefresh={() => {
          setLoading(true);
          OrganizationService.listActiveOrganizations().then(data => {
            setOrgs(data);
            setLoading(false);
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "4%",
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(10),
    backgroundColor: "#fff",
  },
  backBtn: {
    marginRight: moderateScale(8),
    padding: moderateScale(4),
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  headerTitle: {
    fontSize: normalizeFontSize(19),
    fontWeight: "800",
    color: "#222",
    flex: 1,
    textAlign: "center",
    marginRight: moderateScale(30),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: moderateScale(16),
    marginHorizontal: "4%",
    marginBottom: moderateScale(8),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    borderWidth: 1,
    borderColor: "#f3f3f3",
    minHeight: moderateScale(42), // Ensure minimum touch target
  },
  searchInput: {
    flex: 1,
    fontSize: normalizeFontSize(15),
    color: "#222",
    marginLeft: moderateScale(8),
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  orgRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(12),
    paddingHorizontal: "4%",
    backgroundColor: "#fff",
    minHeight: moderateScale(44), // Ensure minimum touch target
  },
  orgAvatar: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    marginRight: moderateScale(10),
    backgroundColor: "#eee",
  },
  orgInfo: {
    flex: 1,
    justifyContent: "center",
  },
  orgName: {
    fontWeight: "700",
    fontSize: normalizeFontSize(15),
    color: "#222",
    marginBottom: moderateScale(2),
  },
  orgDesc: {
    color: "#666",
    fontSize: normalizeFontSize(12),
    marginTop: moderateScale(2),
  },
  orgAction: {
    marginLeft: moderateScale(10),
    backgroundColor: "#fff7f2",
    borderRadius: moderateScale(16),
    padding: moderateScale(8),
    borderWidth: 1,
    borderColor: "#ffe3d1",
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  separator: {
    height: 1,
    backgroundColor: "#f3f3f3",
    marginLeft: moderateScale(62),
  },
});
