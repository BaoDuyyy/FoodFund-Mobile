import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface DonateModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  setAmount: (v: number) => void;
  isAnonymous: boolean;
  setIsAnonymous: (v: boolean) => void;
  handleDonateSubmit: () => void;
  donating?: boolean;
  /** If true, user is guest - force anonymous and disable toggle */
  isGuest?: boolean;
}

export default function DonateModal({
  visible,
  onClose,
  amount,
  setAmount,
  isAnonymous,
  setIsAnonymous,
  handleDonateSubmit,
  donating,
  isGuest = false,
}: DonateModalProps) {
  // Force anonymous when guest
  useEffect(() => {
    if (isGuest && !isAnonymous) {
      setIsAnonymous(true);
    }
  }, [isGuest, isAnonymous, setIsAnonymous]);

  const handleToggleAnonymous = () => {
    // Don't allow toggle if guest
    if (isGuest) return;
    setIsAnonymous(!isAnonymous);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <TouchableOpacity style={styles.modalCloseIcon} onPress={onClose}>
            <MaterialIcons name="close" size={28} color="#ad4e28" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Ủng hộ chiến dịch</Text>

          {/* Login note box */}
          <View style={styles.loginNoteBox}>
            <Text style={styles.loginNoteText}>
              Nếu bạn muốn lưu họ tên chuyển khoản của mình, vui lòng <Text style={styles.loginNoteBold}>đăng nhập</Text> hoặc <Text style={styles.loginNoteBold}>đăng ký tài khoản</Text>. Nếu không đăng nhập, mọi thông tin ủng hộ của bạn sẽ bị <Text style={styles.loginNoteBold}>ẩn danh</Text>.
            </Text>
          </View>

          <Text style={styles.modalLabel}>Nhập số tiền ủng hộ *</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              value={amount ? amount.toString() : ""}
              onChangeText={v => setAmount(Number(v.replace(/[^0-9]/g, "")))}
              placeholder="0"
              placeholderTextColor="#bdbdbd"
            />
            <Text style={styles.amountUnit}>VNĐ</Text>
          </View>
          <View style={styles.quickRow}>
            {[50000, 100000, 200000, 500000].map(v => (
              <TouchableOpacity
                key={v}
                style={[
                  styles.quickBtn,
                  amount === v && styles.quickBtnActive,
                ]}
                onPress={() => setAmount(v)}
              >
                <LinearGradient
                  colors={amount === v ? ['#ffb86c', '#ad4e28'] : ['#f7f7f7', '#f7f7f7']}
                  style={styles.quickBtnGradient}
                >
                  <Text style={amount === v ? styles.quickTextActive : styles.quickText}>{v / 1000}k</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.checkRow, isGuest && styles.checkRowDisabled]}
            onPress={handleToggleAnonymous}
            disabled={isGuest}
          >
            <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
              {isAnonymous && <Ionicons name="checkmark" size={18} color="#fff" />}
            </View>
            <Text style={[styles.checkLabel, isGuest && styles.checkLabelDisabled]}>
              Ủng hộ ẩn danh
            </Text>
          </TouchableOpacity>
          <LinearGradient
            colors={['#ffb86c', '#ad4e28']}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.modalDonateBtn}
          >
            <TouchableOpacity
              style={{ width: "100%", alignItems: "center" }}
              onPress={handleDonateSubmit}
            >
              <Text style={styles.modalDonateText}>Ủng hộ</Text>
            </TouchableOpacity>
          </LinearGradient>
          <Text style={styles.modalNote}>
            <Text style={{ fontWeight: "700", color: "#ad4e28" }}>Lưu ý quan trọng:</Text> Vui lòng chuyển khoản đúng số tiền và nội dung để hệ thống có thể xác nhận tự động. Sau khi chuyển khoản thành công, khoản ủng hộ sẽ được cập nhật trong vòng 5-10 phút.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 26,
    alignItems: "center",
    shadowColor: "#ad4e28",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    position: "relative",
  },
  modalCloseIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ad4e28",
    marginBottom: 8,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  modalDesc: {
    fontSize: 15,
    color: "#555",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  loginNoteBox: {
    backgroundColor: "#e3f0ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    marginTop: 0,
    borderWidth: 1,
    borderColor: "#b3d1ff",
    alignItems: "center",
    justifyContent: "center",
  },
  loginNoteText: {
    color: "#1565c0",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  loginNoteBold: {
    color: "#1565c0",
    fontWeight: "900",
  },
  modalLabel: {
    fontWeight: "700",
    color: "#ad4e28",
    alignSelf: "flex-start",
    marginBottom: 4,
    marginTop: 8,
    fontSize: 15,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  amountInput: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 22,
    color: "#222",
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: "#ffb86c",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  amountUnit: {
    fontWeight: "800",
    color: "#ad4e28",
    fontSize: 18,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
    marginTop: 2,
  },
  quickBtn: {
    borderRadius: 12,
    marginHorizontal: 2,
    overflow: "hidden",
    borderWidth: 0,
  },
  quickBtnGradient: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  quickBtnActive: {
    borderWidth: 2,
    borderColor: "#ad4e28",
  },
  quickText: {
    color: "#ad4e28",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.5,
  },
  quickTextActive: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.5,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: "#ad4e28",
    backgroundColor: "#fff",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#ad4e28",
    borderColor: "#ad4e28",
  },
  checkboxDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  checkLabel: {
    color: "#ad4e28",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  checkRowDisabled: {
    opacity: 0.7,
  },
  checkLabelDisabled: {
    color: "#888",
  },
  modalDonateBtn: {
    borderRadius: 12,
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  modalDonateText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.5,
    paddingVertical: 10,
  },
  modalNote: {
    backgroundColor: "#fffbe6",
    borderRadius: 10,
    padding: 12,
    color: "#ad4e28",
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
    lineHeight: 20,
  },
});
