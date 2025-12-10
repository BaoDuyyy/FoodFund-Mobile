import GuestMode from '@/services/guestMode';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BG = require('../assets/images/welcome.png');
// logo to the left of the small label above heading
const LOGO = require('../assets/images/logo.png');

export default function WelcomeScreen() {
  const router = useRouter();

  const handleSkip = async () => {
    await GuestMode.setGuestMode(true);
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={BG} style={styles.background} resizeMode="cover">
        {/* Skip button top right */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Bỏ qua &gt;</Text>
        </TouchableOpacity>

        {/* logo moved to top middle */}
        <View style={styles.topLogo}>
          <Image source={LOGO} style={styles.logo} />
        </View>

        {/* bottom overlay on top of the image */}
        <View style={styles.bottom}>
          {/* dark translucent box to improve text readability */}
          <View style={styles.overlay}>
            <View style={styles.headingWrap}>
              <Text style={styles.headingLineWhite}>Mừng bạn đến với</Text>
              <Text style={styles.headingLineAccent}>nền tảng thiện nguyện minh bạch</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  background: { flex: 1, width: '100%', height: '100%' },

  // Skip button
  skipBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
  },
  skipText: {
    color: '#ad4e28',
    fontWeight: '700',
    fontSize: 15,
  },

  // top-centered logo (absolute)
  topLogo: {
    position: 'absolute',
    top: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },

  // big heading: first line white, second line accent orange
  headingWrap: { marginBottom: 16 },
  headingLineWhite: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
  },
  headingLineAccent: {
    color: '#f59a2a', // orange accent
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
  },

  // small helper text (optional, kept for accessibility)
  welcomeTextSmall: { textAlign: 'left', color: 'rgba(255,255,255,0.85)', marginBottom: 12, fontSize: 14 },
  /* overlay box at bottom to increase contrast */
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.56)',
    paddingVertical: 20,
    paddingHorizontal: 24, // keep inner spacing from screen edges
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  login: { backgroundColor: '#f59a2a', marginRight: 12 },
  signup: { backgroundColor: '#fff', borderWidth: 0, marginLeft: 0 },
  buttonText: { fontWeight: '700', fontSize: 16 },
  loginText: { color: '#fff' },
  signupText: { color: '#333' },

  logo: { width: 250, height: 250, marginBottom: 20 },
  bottom: {
    position: 'absolute',
    left: 0,    // span full width
    right: 0,
    bottom: 0,  // touch bottom edge of screen
  },
});

