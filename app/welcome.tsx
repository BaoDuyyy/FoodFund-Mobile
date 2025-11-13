import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BG = require('../assets/images/welcome.png');
// logo to the left of the small label above heading
const LOGO = require('../assets/images/logo.png');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={BG} style={styles.background} resizeMode="cover">
        {/* logo moved to top middle */}
        <View style={styles.topLogo}>
          <Image source={LOGO} style={styles.logo} />
        </View>

        {/* bottom overlay on top of the image */}
        <View style={styles.bottom}>          

          {/* large multi-line heading (white + highlighted orange) */}
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
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  background: { flex: 1, width: '100%', height: '100%' },

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
  headingWrap: { marginBottom: 12 },
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
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  login: { backgroundColor: '#ad4e28', marginRight: 12 },
  signup: { backgroundColor: '#fff' },
  buttonText: { fontWeight: '600' },
  loginText: { color: '#fff' },
  signupText: { color: '#000' },
  logo: { width: 250, height: 250, marginBottom: 20 },
  bottom: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 36,
  },
});
