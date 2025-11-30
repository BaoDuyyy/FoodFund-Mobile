import { useRouter } from "expo-router";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
    paddingHorizontal: 28,
  },
  box: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontWeight: "900",
    fontSize: 18,
    color: PRIMARY,
    marginBottom: 8,
  },
  desc: {
    color: "#333",
    fontSize: 15,
    marginBottom: 18,
    textAlign: "center",
  },
  loginBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 8,
  },
  loginBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  cancelBtnText: {
    color: "#ad4e28",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default LoginRequire;
