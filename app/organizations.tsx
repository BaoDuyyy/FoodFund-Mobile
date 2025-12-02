import OrganizationService from "@/services/organizationService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
