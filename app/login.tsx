import AlertPopup from '@/components/AlertPopup';
import Loading from '@/components/Loading';
import { GOOGLE_CLIENT_ID } from '@/config/google';
import { BG_AUTH as BG, PRIMARY } from '@/constants/colors';
import { useAuth } from '@/hooks';
import AuthService from '@/services/authService';
import GuestMode from '@/services/guestMode';
import { AntDesign } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  PixelRatio,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// Responsive logo size
const LOGO_WIDTH = Math.min(Math.max(SCREEN_WIDTH * 0.6, 180), 280);
const LOGO_HEIGHT = LOGO_WIDTH * 0.28; // maintain aspect ratio

function isNetworkError(err: any) {
  const msg = String(err?.message || '');
  const patterns = [
    'Network',
    'Failed to fetch',
    'site could not be found',
    'could not connect',
    'ENOTFOUND',
  ];
  return patterns.some((p) => msg.includes(p));
}

export default function LoginScreen() {
  const router = useRouter();
  const { login: authLogin, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // animation cho nút
  const loginAnim = useRef(new Animated.Value(1)).current;
  const googleAnim = useRef(new Animated.Value(1)).current;

  function animatePress(anim: Animated.Value) {
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.94,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  async function handleLogin() {
    try {
      if (!email || !password) {
        showAlert('Vui lòng nhập email và mật khẩu');
        return;
      }
      setIsLoading(true);

      // Use login from useAuth hook
      const result = await authLogin(email, password);

      // Clear guest mode after successful login
      await GuestMode.setGuestMode(false);

      // Get user info after login to determine role-based routing
      const userInfo = await AuthService.getUserInfo();
      const role = userInfo?.role;

      if (role === 'KITCHEN_STAFF') {
        router.replace('/k-organization');
      } else if (role === 'DELIVERY_STAFF') {
        router.replace('/d-home');
      } else {
        router.replace('/home');
      }
    } catch (err: any) {
      if (isNetworkError(err)) {
        showAlert('Không thể kết nối tới máy chủ, hãy thử lại sau.');
      } else {
        showAlert(err?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ==== GOOGLE LOGIN – đã chỉnh usePKCE: false ====
  async function handleGoogleLogin() {
    try {
      setIsLoading(true);

      const redirectUri = AuthSession.makeRedirectUri({});
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };

      const config: AuthSession.AuthRequestConfig = {
        clientId: GOOGLE_CLIENT_ID, // Web client ID
        redirectUri,
        responseType: AuthSession.ResponseType.IdToken, // 'id_token'
        scopes: ['openid', 'profile', 'email'],
        extraParams: { nonce: 'randomnonce' },
        usePKCE: false,
      };

      const authRequest = new AuthSession.AuthRequest(config);

      // ❌ bỏ { useProxy: true } vì type không có
      const result = await authRequest.promptAsync(discovery);

      if (result.type === 'success' && 'id_token' in result.params) {
        const idToken = (result as AuthSession.AuthSessionResult & {
          params: { id_token: string };
        }).params.id_token;

        const payload = await AuthService.loginWithGoogle(idToken);
        await SecureStore.setItemAsync('accessToken', payload.accessToken || '');
        await SecureStore.setItemAsync('refreshToken', payload.refreshToken || '');

        // Clear guest mode after successful Google login
        await GuestMode.setGuestMode(false);

        // user Google -> group tabs thường
        router.replace('/(tabs)' as any);
      }
    } catch (err: any) {
      if (isNetworkError(err)) {
        showAlert('Không thể kết nối tới máy chủ, hãy thử lại sau.');
      } else {
        showAlert(err?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={isLoading} message="Đang đăng nhập..." />
      <AlertPopup
        visible={alertVisible}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      {/* Header với nút back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/welcome')} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹'} Quay lại</Text>
        </TouchableOpacity>
      </View>

      {/* Khối nội dung login được canh giữa phần còn lại của màn hình */}
      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
          />
        </View>
        <Text style={styles.title}>Đăng nhập</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#bdbdbd"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordWrap}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mật khẩu"
            placeholderTextColor="#bdbdbd"
            style={styles.input}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => {
              // TODO: điều hướng trang quên mật khẩu
            }}
          >
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={{ transform: [{ scale: loginAnim }], width: '100%' }}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              animatePress(loginAnim);
              handleLogin();
            }}
          >
            <Text style={styles.primaryButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Hoặc</Text>
          <View style={styles.divider} />
        </View>

        <Animated.View style={{ transform: [{ scale: googleAnim }], width: '100%' }}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => {
              animatePress(googleAnim);
              handleGoogleLogin();
            }}
          >
            <View style={styles.googleIconWrap}>
              <AntDesign name="google" size={18} color="#4285F4" />
            </View>
            <Text style={styles.googleText}>Đăng nhập bằng Google</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.signupPrompt}>
          <Text style={styles.signupPromptText}>
            Bạn chưa có tài khoản FoodFund?{' '}
            <Text style={styles.signupLink} onPress={() => router.push('/signup')}>
              Tạo tài khoản
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(8),
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  backText: {
    color: '#fff',
    fontSize: normalizeFontSize(13),
    fontWeight: '700',
  },

  content: {
    flex: 1,
    paddingHorizontal: '6%', // Use percentage for horizontal padding
    paddingBottom: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  title: {
    fontSize: normalizeFontSize(24),
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: moderateScale(18),
  },

  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    marginBottom: moderateScale(12),
    fontSize: normalizeFontSize(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minHeight: moderateScale(44), // Ensure minimum touch target size
  },

  passwordWrap: {
    width: '100%',
    marginBottom: moderateScale(18),
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: moderateScale(4),
  },
  forgotText: {
    color: PRIMARY,
    fontSize: normalizeFontSize(12),
    fontWeight: '600',
  },

  primaryButton: {
    width: '100%',
    backgroundColor: PRIMARY,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(4),
    minHeight: moderateScale(48), // Ensure minimum touch target size
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: normalizeFontSize(15),
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: moderateScale(18),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0d6cf',
  },
  dividerText: {
    marginHorizontal: moderateScale(10),
    color: '#999',
    fontSize: normalizeFontSize(11),
  },

  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(12),
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minHeight: moderateScale(48), // Ensure minimum touch target size
  },
  googleIconWrap: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(8),
  },
  googleText: {
    fontSize: normalizeFontSize(14),
    color: '#333',
    fontWeight: '500',
  },

  signupPrompt: {
    marginTop: moderateScale(14),
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
  },
  signupPromptText: {
    color: '#555',
    fontSize: normalizeFontSize(13),
    textAlign: 'center',
  },
  signupLink: {
    color: PRIMARY,
    fontWeight: '700',
  },
  logoWrapper: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    marginBottom: moderateScale(12),
    marginTop: moderateScale(-4),
  },
});
