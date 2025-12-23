import GuestMode from '@/services/guestMode';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ImageBackground, PixelRatio, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG = require('../assets/images/welcome.jpg');
// logo to the left of the small label above heading
const LOGO = require('../assets/images/logo.png');

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

// Responsive logo size (max 60% of screen width, min 150px)
const LOGO_SIZE = Math.min(Math.max(SCREEN_WIDTH * 0.55, 150), 280);

// Responsive font sizes
const HEADING_FONT_SIZE = Math.min(normalizeFontSize(28), 40);
const HEADING_LINE_HEIGHT = HEADING_FONT_SIZE * 1.2;

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSkip = async () => {
    await GuestMode.setGuestMode(true);
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={BG} style={styles.background} resizeMode="cover">
        {/* Skip button top right - respects safe area */}
        <TouchableOpacity
          style={[
            styles.skipBtn,
            { top: Math.max(insets.top, 16) + 8, right: moderateScale(16) }
          ]}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Bỏ qua &gt;</Text>
        </TouchableOpacity>

        {/* logo moved to top middle - respects safe area */}
        <View style={[styles.topLogo, { top: Math.max(insets.top, 16) + moderateScale(24) }]}>
          <Image
            source={LOGO}
            style={[styles.logo, { width: LOGO_SIZE, height: LOGO_SIZE }]}
            resizeMode="contain"
          />
        </View>

        {/* bottom overlay on top of the image */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom }]}>
          {/* dark translucent box to improve text readability */}
          <View style={styles.overlay}>
            <View style={styles.headingWrap}>
              <Text style={[styles.headingLineWhite, { fontSize: HEADING_FONT_SIZE, lineHeight: HEADING_LINE_HEIGHT }]}>
                Mừng bạn đến với
              </Text>
              <Text style={[styles.headingLineAccent, { fontSize: HEADING_FONT_SIZE, lineHeight: HEADING_LINE_HEIGHT }]}>
                nền tảng thiện nguyện minh bạch
              </Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.login]} onPress={() => router.push('/login')}>
                <Text style={[styles.buttonText, styles.loginText]}>Đăng nhập</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, styles.signup]} onPress={() => router.push('/signup')}>
                <Text style={[styles.buttonText, styles.signupText]}>Đăng ký</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  background: { flex: 1, width: '100%', height: '100%' },

  // Skip button - position values applied via inline styles for safe area
  skipBtn: {
    position: 'absolute',
    zIndex: 10,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: moderateScale(20),
  },
  skipText: {
    color: '#ad4e28',
    fontWeight: '700',
    fontSize: normalizeFontSize(14),
  },

  // top-centered logo (absolute) - top value applied via inline styles for safe area
  topLogo: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },

  // big heading: first line white, second line accent orange
  // font sizes applied via inline styles for responsiveness
  headingWrap: { marginBottom: moderateScale(12) },
  headingLineWhite: {
    color: '#fff',
    fontWeight: '800',
  },
  headingLineAccent: {
    color: '#f59a2a', // orange accent
    fontWeight: '800',
  },

  // small helper text (optional, kept for accessibility)
  welcomeTextSmall: {
    textAlign: 'left',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: moderateScale(10),
    fontSize: normalizeFontSize(13)
  },

  /* overlay box at bottom to increase contrast */
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.56)',
    paddingVertical: moderateScale(18),
    paddingHorizontal: '6%', // Use percentage for horizontal padding
    borderTopLeftRadius: moderateScale(18),
    borderTopRightRadius: moderateScale(18),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(8),
    gap: moderateScale(12), // Use gap for symmetric spacing between buttons
  },

  button: {
    flex: 1,
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(44), // Ensure minimum touch target size
  },

  login: {
    backgroundColor: '#f59a2a',
  },

  signup: {
    backgroundColor: '#fff',
    borderWidth: 0,
  },

  buttonText: {
    fontWeight: '700',
    fontSize: normalizeFontSize(15),
  },
  loginText: { color: '#fff' },
  signupText: { color: '#333' },

  // Logo size applied via inline styles for responsiveness
  logo: {
    marginBottom: moderateScale(16),
  },

  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

