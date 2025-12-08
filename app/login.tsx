import Loading from '@/components/Loading';
import { GOOGLE_CLIENT_ID } from '@/config/google';
import { BG_AUTH as BG, PRIMARY } from '@/constants/colors';
import AuthService from '@/services/authService';
import { AntDesign } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  async function handleLogin() {
    try {
      if (!email || !password) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu');
        return;
      }
      setIsLoading(true);

      const result = await AuthService.login(email, password);
      await SecureStore.setItemAsync('accessToken', result.accessToken || '');
      await SecureStore.setItemAsync('refreshToken', result.refreshToken || '');

      const { role } = await AuthService.getUserInfo();

      if (role === 'KITCHEN_STAFF') {
        router.replace('/k-organization');
      } else if (role === 'DELIVERY_STAFF') {
        router.replace('/d-home');
      } else {
        router.replace('/home');
      }
    } catch (err: any) {
      if (isNetworkError(err)) {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối tới máy chủ, hãy thử lại sau.');
      } else {
        Alert.alert('Đăng nhập thất bại', err?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
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

        // user Google -> group tabs thường
        router.replace('/(tabs)' as any);
      }
    } catch (err: any) {
      if (isNetworkError(err)) {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối tới máy chủ, hãy thử lại sau.');
      } else {
        Alert.alert(
          'Đăng nhập Google thất bại',
          err?.message || 'Có lỗi xảy ra, vui lòng thử lại.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={isLoading} message="Signing in..." />

      {/* Header với nút back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
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
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  backText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: 20,
  },

  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  passwordWrap: {
    width: '100%',
    marginBottom: 20,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '600',
  },

  primaryButton: {
    width: '100%',
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0d6cf',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 12,
  },

  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  googleText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },

  signupPrompt: {
    marginTop: 14,
    alignItems: 'center',
  },
  signupPromptText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
  },
  signupLink: {
    color: PRIMARY,
    fontWeight: '700',
  },
  logoWrapper: {
    width: 250,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    marginTop: -4,
  },
});
