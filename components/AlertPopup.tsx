import React, { FC, useEffect, useRef } from "react";
import {
    Animated,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
    visible?: boolean;
    message?: string;
    onClose?: () => void;
};

const PRIMARY = "#ad4e28";

const AlertPopup: FC<Props> = ({
    visible = false,
    message = "",
    onClose,
}) => {
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        if (visible) {
            // Fade in & scale up the box
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        }

        return () => {
            // Reset all animation values
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.8);
        };
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal visible transparent animationType="none">
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.box,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* Title */}
                    <Text style={styles.title}>Thông báo</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Close button */}
                    {onClose && (
                        <TouchableOpacity style={styles.button} onPress={onClose}>
                            <Text style={styles.buttonText}>Đóng</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
    },
    box: {
        width: "100%",
        maxWidth: 300,
        backgroundColor: "#fff",
        borderRadius: 24,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    title: {
        color: PRIMARY,
        fontSize: 20,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 16,
    },
    message: {
        color: "#333",
        fontSize: 16,
        fontWeight: "500",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 20,
    },
    button: {
        backgroundColor: PRIMARY,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 4,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default AlertPopup;
