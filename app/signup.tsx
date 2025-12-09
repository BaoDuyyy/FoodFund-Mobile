import Loading from '@/components/Loading';
import { GOOGLE_CLIENT_ID } from '@/config/google';
import { BG_AUTH as BG, PRIMARY } from '@/constants/colors';
import AuthService from '@/services/authService';
import { AntDesign } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
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
  return patterns.some(p => msg.includes(p));
}

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // modal state for "check your email" popup
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // animation cho nút
  const signupAnim = useRef(new Animated.Value(1)).current;
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

  useEffect(() => {
    if (!modalVisible) return;
    timerRef.current = setTimeout(() => {
      setModalVisible(false);
      router.replace('/login');
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [modalVisible, router]);

  function handleModalClose() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setModalVisible(false);
    router.replace('/login');
  }

  async function handleSignup() {
    try {
      if (!name || !email || !password || !confirm) {
        Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin');
        return;
      }
      if (password !== confirm) {
        Alert.alert('Mật khẩu không khớp', 'Mật khẩu và xác nhận mật khẩu không khớp');
        return;
      }

      setIsLoading(true);

      const res = await AuthService.signup({ email, name, password });
      const message =
        res?.message ||
        (res?.emailSent
          ? 'Vui lòng kiểm tra email để xác minh tài khoản'
          : 'Đăng ký thành công');

      setModalMessage(message);
      setModalVisible(true);
    } catch (err: any) {
      if (isNetworkError(err)) {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối tới máy chủ, hãy thử lại sau.');
      } else {
        Alert.alert('Đăng ký thất bại', err?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignup() {
    try {
      setIsLoading(true);

      const redirectUri = AuthSession.makeRedirectUri({});
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };
      const config = {
        clientId: GOOGLE_CLIENT_ID,
        redirectUri,
        responseType: 'id_token' as const,
        scopes: ['openid', 'profile', 'email'],
        extraParams: { nonce: 'randomnonce' },
      };

      const authRequest = new AuthSession.AuthRequest(config);
      const result = await authRequest.promptAsync(discovery);

      if (result.type === 'success' && 'id_token' in result.params) {
        const idToken = (result as AuthSession.AuthSessionResult & {
          params: { id_token: string };
        }).params.id_token;

        const payload = await AuthService.loginWithGoogle(idToken);
        await SecureStore.setItemAsync('accessToken', payload.accessToken || '');
        await SecureStore.setItemAsync('refreshToken', payload.refreshToken || '');

        router.replace('/(tabs)' as any);
      }
    } catch (err: any) {
      if (isNetworkError(err)) {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối tới máy chủ, hãy thử lại sau.');
      } else {
        Alert.alert(
          'Đăng ký bằng Google thất bại',
          err?.message || 'Có lỗi xảy ra, vui lòng thử lại.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={isLoading} message="Signing up..." />

      {/* Header với nút back giống login */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹'} Quay lại</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Đăng ký tài khoản</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Họ và tên"
          placeholderTextColor="#bdbdbd"
          style={styles.input}
          autoCapitalize="words"
        />

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#bdbdbd"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mật khẩu"
          placeholderTextColor="#bdbdbd"
          style={styles.input}
          secureTextEntry
        />

        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Xác nhận mật khẩu"
          placeholderTextColor="#bdbdbd"
          style={styles.input}
          secureTextEntry
        />

        <Animated.View style={{ transform: [{ scale: signupAnim }], width: '100%' }}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              animatePress(signupAnim);
              handleSignup();
            }}
          >
            <Text style={styles.primaryButtonText}>Đăng ký ngay</Text>
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
              handleGoogleSignup();
            }}
          >
            <View style={styles.googleIconWrap}>
              <AntDesign name="google" size={18} color="#4285F4" />
            </View>
            <Text style={styles.googleText}>Đăng ký bằng Google</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.signupPrompt}>
          <Text style={styles.signupPromptText}>
            Bạn đã có tài khoản FoodFund?{' '}
            <Text style={styles.signupLink} onPress={() => router.push('/login')}>
              Đăng nhập
            </Text>
          </Text>
        </View>
      </View>

      {/* verification modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Vui lòng kiểm tra email</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleModalClose}>
              <Text style={styles.modalButtonText}>Quay lại đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 160,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
