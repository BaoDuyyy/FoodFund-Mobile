import Loading from "@/components/Loading";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Image, PixelRatio, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
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

// Responsive QR code size
const QR_CODE_SIZE = Math.min(SCREEN_WIDTH * 0.5, 200);

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
            <MaterialIcons name="check-circle" size={moderateScale(36)} color="#43b46b" />
          </View>
          <Text style={styles.qrTitle}>Thông tin chuyển khoản</Text>
          <Text style={styles.qrSubtitle}>Vui lòng chuyển khoản theo thông tin bên dưới</Text>
          <View style={styles.qrWrap}>
            <QRCode value={params.qrCode || ""} size={QR_CODE_SIZE} />
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
              <TouchableOpacity onPress={() => handleCopy(params.bankNumber!)} style={styles.copyBtn}>
                <MaterialIcons name="content-copy" size={moderateScale(20)} color="#1565c0" />
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
              <TouchableOpacity onPress={() => handleCopy(params.bankAccountName!)} style={styles.copyBtn}>
                <MaterialIcons name="content-copy" size={moderateScale(20)} color="#43b46b" />
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
              <TouchableOpacity onPress={() => handleCopy(params.description!)} style={styles.copyBtn}>
                <MaterialIcons name="content-copy" size={moderateScale(20)} color="#7c4dff" />
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
            <MaterialIcons name="arrow-back" size={moderateScale(18)} color="#222" />
            <Text style={styles.actionBtnText}>Quay lại chiến dịch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnHome]}
            onPress={() => router.back()}
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
  content: {
    alignItems: "center",
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(18),
    paddingHorizontal: "4%",
  },
  qrSection: { alignItems: "center", marginBottom: moderateScale(14) },
  qrIconWrap: { marginBottom: moderateScale(6) },
  qrTitle: {
    fontSize: normalizeFontSize(20),
    fontWeight: "900",
    color: "#222",
    marginBottom: moderateScale(2),
  },
  qrSubtitle: {
    fontSize: normalizeFontSize(14),
    color: "#666",
    marginBottom: moderateScale(6),
  },
  qrWrap: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    marginBottom: moderateScale(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrNote: {
    color: "#888",
    fontSize: normalizeFontSize(12),
    marginBottom: moderateScale(6),
  },
  infoBox: {
    width: "100%",
    maxWidth: moderateScale(400),
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    marginBottom: moderateScale(10),
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
    marginBottom: moderateScale(2),
  },
  infoLabel: {
    color: "#888",
    fontWeight: "700",
    fontSize: normalizeFontSize(13),
  },
  infoValue: {
    color: "#222",
    fontWeight: "700",
    fontSize: normalizeFontSize(16),
    marginBottom: moderateScale(2),
  },
  infoValueYellow: {
    color: "#ad4e28",
    fontWeight: "900",
    fontSize: normalizeFontSize(20),
    marginBottom: moderateScale(2),
  },
  copyBtn: {
    padding: moderateScale(4),
    minWidth: moderateScale(32),
    minHeight: moderateScale(32),
    alignItems: "center",
    justifyContent: "center",
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(2),
  },
  bankLogo: {
    width: moderateScale(30),
    height: moderateScale(30),
    marginRight: moderateScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: "#fff",
  },
  bankFullName: {
    color: "#222",
    fontWeight: "800",
    fontSize: normalizeFontSize(15),
  },
  bankName: {
    color: "#888",
    fontWeight: "700",
    fontSize: normalizeFontSize(13),
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: moderateScale(400),
    marginTop: moderateScale(12),
    gap: moderateScale(8),
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    flex: 1,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee",
    gap: moderateScale(4),
    minHeight: moderateScale(44), // Ensure minimum touch target
  },
  actionBtnHome: {
    backgroundColor: "#ad4e28",
    borderColor: "#ad4e28",
  },
  actionBtnText: {
    color: "#222",
    fontWeight: "700",
    fontSize: normalizeFontSize(13),
  },
  actionBtnTextHome: {
    color: "#fff",
    fontWeight: "700",
    fontSize: normalizeFontSize(13),
  },
});

