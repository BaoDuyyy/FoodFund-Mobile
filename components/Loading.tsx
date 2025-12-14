import React, { FC, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
    paddingHorizontal: 28,
  },
  box: {
    width: "100%",
    maxWidth: 280,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  spinnerContainer: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  outerRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(173, 78, 40, 0.15)",
  },
  spinnerRing: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  text: {
    color: "#333",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  dotsContainer: {
    flexDirection: "row",
    marginTop: 16,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
  },
  dotMiddle: {
    marginHorizontal: 6,
    backgroundColor: ACCENT,
  },
  tagline: {
    color: "#999",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
});

export default Loading;
