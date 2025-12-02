import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  onClose?: () => void;
  onAgree?: () => void;
};

const PRIMARY = "#ad4e28";

const RefundPolicyPopup: React.FC<Props> = ({ visible, onClose, onAgree }) => {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.headerRow}>
            <Ionicons name="shield-checkmark" size={22} color={PRIMARY} />
            <Text style={styles.title}>Quy định về hoàn tiền và sử dụng quỹ</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>
          <Text style={styles.desc}>
            Vui lòng đọc kỹ các quy định dưới đây trước khi tiến hành ủng hộ.
          </Text>

          <View style={styles.sectionWarning}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="warning" size={18} color="#ff8800" />
              <Text style={styles.sectionTitle}>Trường hợp chiến dịch bị hủy</Text>
            </View>
            <Text style={styles.sectionText}>
              Nếu chiến dịch bị hủy do phát hiện gian lận hoặc vi phạm chính sách của nền tảng (do Admin hủy), toàn bộ số tiền bạn đã ủng hộ sẽ được <Text style={styles.bold}>hoàn trả lại 100%</Text>.
            </Text>
          </View>

          <View style={styles.sectionInfo}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="information-circle" size={18} color="#4285F4" />
              <Text style={styles.sectionTitle}>Trường hợp không đạt mục tiêu</Text>
            </View>
            <Text style={styles.sectionText}>
              Nếu chiến dịch kết thúc mà <Text style={styles.bold}>không đạt được 50% mục tiêu</Text> gây quỹ ban đầu, số tiền bạn đã ủng hộ sẽ được chuyển vào <Text style={styles.bold}>Quỹ chung của hệ thống</Text> để hỗ trợ các chiến dịch khó khăn khác (Sung công quỹ).
            </Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.agreeBtn} onPress={onAgree}>
              <Text style={styles.agreeBtnText}>Đồng ý và tiếp tục</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  box: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "stretch",
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontWeight: "900",
    fontSize: 19,
    color: PRIMARY,
    flex: 1,
    marginLeft: 8,
  },
  closeBtn: {
    padding: 4,
  },
  desc: {
    color: "#333",
    fontSize: 15,
    marginBottom: 16,
    textAlign: "left",
  },
  sectionWarning: {
    backgroundColor: "#fff6ea",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ffe3c1",
  },
  sectionInfo: {
    backgroundColor: "#f2f7ff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#cfe2ff",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 15,
    color: "#222",
    marginLeft: 4,
  },
  sectionText: {
    color: "#333",
    fontSize: 14,
    lineHeight: 21,
  },
  bold: {
    fontWeight: "700",
    color: "#ad4e28",
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cancelBtnText: {
    color: "#ad4e28",
    fontWeight: "700",
    fontSize: 15,
  },
  agreeBtn: {
    backgroundColor: "#ad4e28",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  agreeBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default RefundPolicyPopup;
