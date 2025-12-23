import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Modal, PixelRatio, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Responsive scaling functions
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_WIDTH = 375;
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
const normalizeFontSize = (size: number) => {
  const newSize = scale(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

type Props = {
  visible: boolean;
  onClose?: () => void;
};

const PRIMARY = "#ad4e28";

const LoginRequire: React.FC<Props> = ({ visible, onClose }) => {
  const router = useRouter();

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Bạn cần đăng nhập</Text>
          <Text style={styles.desc}>Vui lòng đăng nhập để sử dụng chức năng này.</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => {
              onClose?.();
              router.push("/login");
            }}
          >
            <Text style={styles.loginBtnText}>Đăng nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Hủy</Text>
          </TouchableOpacity>
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
    paddingHorizontal: "7%",
  },
  box: {
    width: "100%",
    maxWidth: moderateScale(320),
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(22),
    alignItems: "center",
  },
  title: {
    fontWeight: "900",
    fontSize: normalizeFontSize(17),
    color: PRIMARY,
    marginBottom: moderateScale(8),
  },
  desc: {
    color: "#333",
    fontSize: normalizeFontSize(14),
    marginBottom: moderateScale(16),
    textAlign: "center",
  },
  loginBtn: {
    backgroundColor: PRIMARY,
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(28),
    marginBottom: moderateScale(8),
    minHeight: moderateScale(44), // Ensure minimum touch target
  },
  loginBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: normalizeFontSize(15),
  },
  cancelBtn: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(22),
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  cancelBtnText: {
    color: "#ad4e28",
    fontWeight: "700",
    fontSize: normalizeFontSize(14),
  },
});

export default LoginRequire;
