import React, { FC, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  PixelRatio,
  StyleSheet,
  Text,
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
};

const PRIMARY = "#ad4e28";
const ACCENT = "#ff8800";

const Loading: FC<Props> = ({ visible = false, message = "Loading..." }) => {
  // Animation values
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Store references to all animations for proper cleanup
    let spinAnimation: Animated.CompositeAnimation | null = null;
    let pulseAnimation: Animated.CompositeAnimation | null = null;
    let dotAnimation1: Animated.CompositeAnimation | null = null;
    let dotAnimation2: Animated.CompositeAnimation | null = null;
    let dotAnimation3: Animated.CompositeAnimation | null = null;

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

      // Spinning animation
      spinAnimation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();

      // Pulse animation for the ring
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      // Bouncing dots animation
      const createDotAnimation = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: -8,
              duration: 300,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 300,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );

      dotAnimation1 = createDotAnimation(dotAnim1, 0);
      dotAnimation2 = createDotAnimation(dotAnim2, 150);
      dotAnimation3 = createDotAnimation(dotAnim3, 300);

      dotAnimation1.start();
      dotAnimation2.start();
      dotAnimation3.start();
    }

    return () => {
      // Cleanup ALL animations when component unmounts or visibility changes
      spinAnimation?.stop();
      pulseAnimation?.stop();
      dotAnimation1?.stop();
      dotAnimation2?.stop();
      dotAnimation3?.stop();

      // Reset all animation values
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      spinAnim.setValue(0);
      pulseAnim.setValue(1);
      dotAnim1.setValue(0);
      dotAnim2.setValue(0);
      dotAnim3.setValue(0);
    };
  }, [visible]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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
          {/* Custom spinner */}
          <View style={styles.spinnerContainer}>
            {/* Outer pulsing ring */}
            <Animated.View
              style={[
                styles.outerRing,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />

            {/* Spinning gradient ring */}
            <Animated.View
              style={[
                styles.spinnerRing,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <View style={styles.spinnerGradient} />
            </Animated.View>

            {/* Center icon */}
            <View style={styles.centerIcon}>
              <Image
                source={require("../assets/images/icon.png")}
                style={styles.iconImage}
              />
            </View>
          </View>

          {/* Message text */}
          <Text style={styles.text}>{message}</Text>

          {/* Animated dots */}
          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                { transform: [{ translateY: dotAnim1 }] },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                styles.dotMiddle,
                { transform: [{ translateY: dotAnim2 }] },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                { transform: [{ translateY: dotAnim3 }] },
              ]}
            />
          </View>

          {/* Subtle tagline */}
          <Text style={styles.tagline}>Chờ một chút nhé...</Text>
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
    maxWidth: moderateScale(260),
    backgroundColor: "#fff",
    borderRadius: moderateScale(22),
    paddingVertical: moderateScale(28),
    paddingHorizontal: moderateScale(22),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  spinnerContainer: {
    width: moderateScale(70),
    height: moderateScale(70),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(18),
  },
  outerRing: {
    position: "absolute",
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    borderWidth: 2,
    borderColor: "rgba(173, 78, 40, 0.15)",
  },
  spinnerRing: {
    position: "absolute",
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    borderWidth: 4,
    borderColor: "transparent",
    borderTopColor: PRIMARY,
    borderRightColor: ACCENT,
  },
  spinnerGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  centerIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#fff7f0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconImage: {
    width: moderateScale(25),
    height: moderateScale(25),
    resizeMode: "contain",
  },
  text: {
    color: "#333",
    fontSize: normalizeFontSize(15),
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  dotsContainer: {
    flexDirection: "row",
    marginTop: moderateScale(14),
    marginBottom: moderateScale(10),
  },
  dot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    backgroundColor: PRIMARY,
  },
  dotMiddle: {
    marginHorizontal: moderateScale(6),
    backgroundColor: ACCENT,
  },
  tagline: {
    color: "#999",
    fontSize: normalizeFontSize(11),
    fontWeight: "500",
    marginTop: moderateScale(4),
  },
});

export default Loading;
