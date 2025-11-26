import Loading from "@/components/Loading";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QrCodePage() {
  const router = useRouter();
  const params = useLocalSearchParams() as {
    donationId?: string;
    qrCode?: string;
    bankName?: string;
    bankNumber?: string;
    bankAccountName?: string;
    bankLogo?: string;
    bankFullName?: string;
    amount?: string | number;
    description?: string;
  };
  const donationId = params.donationId;
  const [loading, setLoading] = useState(false);

  function formatCurrency(v?: string | number | null) {
    const n = Number(v || 0);
    return n.toLocaleString("vi-VN") + " đ";
  }

  async function handleCopy(text: string) {
    await Clipboard.setStringAsync(text);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={loading} message="Đang tải QR..." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.qrSection}>
          <View style={styles.qrIconWrap}>
            <MaterialIcons name="check-circle" size={38} color="#43b46b" />
          </View>
          <Text style={styles.qrTitle}>Thông tin chuyển khoản</Text>
          <Text style={styles.qrSubtitle}>Vui lòng chuyển khoản theo thông tin bên dưới</Text>
          <View style={styles.qrWrap}>
            <QRCode value={params.qrCode || ""} size={200} />
          </View>
          <Text style={styles.qrNote}>Quét mã QR để chuyển khoản nhanh</Text>
        </View>

        {/* Bank Info */}
        {(params.bankLogo || params.bankFullName || params.bankName) && (
          <View style={styles.infoBox}>
            <View style={styles.bankRow}>
              {params.bankLogo && (
                <Image source={{ uri: params.bankLogo }} style={styles.bankLogo} />
              )}
              <View>
                <Text style={styles.bankFullName}>{params.bankFullName || ""}</Text>
                <Text style={styles.bankName}>{params.bankName || ""}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Account Number */}
        {params.bankNumber && (
          <View style={[styles.infoBox, styles.infoBoxBlue]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số tài khoản</Text>
              <TouchableOpacity onPress={() => handleCopy(params.bankNumber!)}>
                <MaterialIcons name="content-copy" size={22} color="#1565c0" />
              </TouchableOpacity>
            </View>
            <Text style={styles.infoValue}>{params.bankNumber}</Text>
          </View>
        )}

        {/* Account Name */}
        {params.bankAccountName && (
          <View style={[styles.infoBox, styles.infoBoxGreen]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tên tài khoản</Text>
              <TouchableOpacity onPress={() => handleCopy(params.bankAccountName!)}>
                <MaterialIcons name="content-copy" size={22} color="#43b46b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.infoValue}>{params.bankAccountName}</Text>
          </View>
        )}

        {/* Amount */}
        {params.amount && (
          <View style={[styles.infoBox, styles.infoBoxYellow]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số tiền</Text>
            </View>
            <Text style={styles.infoValueYellow}>
              {formatCurrency(params.amount)}
            </Text>
          </View>
        )}

        {/* Description */}
        {params.description && (
          <View style={[styles.infoBox, styles.infoBoxPurple]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nội dung chuyển khoản</Text>
              <TouchableOpacity onPress={() => handleCopy(params.description!)}>
                <MaterialIcons name="content-copy" size={22} color="#7c4dff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.infoValue}>{params.description}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={20} color="#222" />
            <Text style={styles.actionBtnText}>Quay lại chiến dịch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnHome]}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.actionBtnTextHome}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fa" },
  content: { alignItems: "center", paddingTop: 20, paddingBottom: 20, paddingHorizontal: 12 },
  qrSection: { alignItems: "center", marginBottom: 16 },
  qrIconWrap: { marginBottom: 6 },
  qrTitle: { fontSize: 22, fontWeight: "900", color: "#222", marginBottom: 2 },
  qrSubtitle: { fontSize: 15, color: "#666", marginBottom: 6 },
  qrWrap: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrNote: { color: "#888", fontSize: 13, marginBottom: 6 },
  infoBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoBoxBlue: { backgroundColor: "#e3f0ff" },
  infoBoxGreen: { backgroundColor: "#e6fbe8" },
  infoBoxYellow: { backgroundColor: "#fff6e0" },
  infoBoxPurple: { backgroundColor: "#f5f0ff" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  infoLabel: { color: "#888", fontWeight: "700", fontSize: 15 },
  infoValue: { color: "#222", fontWeight: "700", fontSize: 18, marginBottom: 2 },
  infoValueYellow: { color: "#ad4e28", fontWeight: "900", fontSize: 22, marginBottom: 2 },
  bankRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  bankLogo: { width: 32, height: 32, marginRight: 8, borderRadius: 8, backgroundColor: "#fff" },
  bankFullName: { color: "#222", fontWeight: "800", fontSize: 16 },
  bankName: { color: "#888", fontWeight: "700", fontSize: 14 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 420,
    marginTop: 14,
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee",
    gap: 4,
  },
  actionBtnHome: {
    backgroundColor: "#ad4e28",
    borderColor: "#ad4e28",
  },
  actionBtnText: {
    color: "#222",
    fontWeight: "700",
    fontSize: 15,
  },
  actionBtnTextHome: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
