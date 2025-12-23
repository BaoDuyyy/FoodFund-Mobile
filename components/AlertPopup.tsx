import React, { FC, useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    PixelRatio,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

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
        paddingHorizontal: "7%",
    },
    box: {
        width: "100%",
        maxWidth: moderateScale(280),
        backgroundColor: "#fff",
        borderRadius: moderateScale(22),
        paddingVertical: moderateScale(26),
        paddingHorizontal: moderateScale(22),
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    title: {
        color: PRIMARY,
        fontSize: normalizeFontSize(19),
        fontWeight: "700",
        textAlign: "center",
        marginBottom: moderateScale(14),
    },
    message: {
        color: "#333",
        fontSize: normalizeFontSize(15),
        fontWeight: "500",
        textAlign: "center",
        lineHeight: moderateScale(22),
        marginBottom: moderateScale(18),
    },
    button: {
        backgroundColor: PRIMARY,
        paddingVertical: moderateScale(10),
        paddingHorizontal: moderateScale(28),
        borderRadius: moderateScale(10),
        marginTop: moderateScale(4),
        minHeight: moderateScale(44), // Ensure minimum touch target
    },
    buttonText: {
        color: "#fff",
        fontSize: normalizeFontSize(15),
        fontWeight: "600",
    },
});

export default AlertPopup;
