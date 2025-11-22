import React, { FC } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

type Props = {
  visible?: boolean;
  message?: string;
};

const PRIMARY = "#ad4e28";

const Loading: FC<Props> = ({ visible = false, message = "Loading..." }) => {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.text}>{message}</Text>
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
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 5,
  },
  text: {
    marginTop: 12,
    color: "#333",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default Loading;
