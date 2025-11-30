import Loading from '@/components/Loading';
import { GOOGLE_CLIENT_ID } from '@/config/google'; // dùng config
import AuthService from '@/services/authService';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!modalVisible) return;
    timerRef.current = (setTimeout(() => {
      setModalVisible(false);
      router.replace('/login');
    }, 5000) as unknown) as number;

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
        alert('Vui lòng điền đầy đủ thông tin');
        return;
      }
      if (password !== confirm) {
        alert('Mật khẩu và xác nhận mật khẩu không khớp');
        return;
      }

      const res = await AuthService.signup({ email, name, password });
      const message =
        res?.message ||
        (res?.emailSent ? 'Please check your email for verification' : 'Đăng ký thành công');
      // show modal with message, auto-close in 5s or allow user to go back immediately
      setModalMessage(message);
      setModalVisible(true);
    } catch (err: any) {
      alert(err?.message || 'Đăng ký thất bại');
    }
  }

  async function handleGoogleSignup() {
    try {
      setIsLoading(true);
      const redirectUri = AuthSession.makeRedirectUri({});
      const discovery = {
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
      };
      const config = {
        clientId: GOOGLE_CLIENT_ID,
        redirectUri,
        responseType: "id_token",
        scopes: ["openid", "profile", "email"],
        extraParams: { nonce: "randomnonce" },
      };
      const authRequest = new AuthSession.AuthRequest(config);
      const result = await authRequest.promptAsync(discovery);

      // Kiểm tra kiểu kết quả và lấy id_token đúng cách
      if (result.type === "success" && "id_token" in result.params) {
        const idToken = (result as AuthSession.AuthSessionResult & { params: { id_token: string } }).params.id_token;
        const payload = await AuthService.loginWithGoogle(idToken);
        await SecureStore.setItemAsync('accessToken', payload.accessToken || '');
        await SecureStore.setItemAsync('refreshToken', payload.refreshToken || '');
        router.replace('/(tabs)');
      } else {
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      alert(err?.message || 'Google signup failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={isLoading} message="Signing up..." />
      {/* in-page top-left back button (pill-style like login) */}
      <TouchableOpacity style={styles.topBack} onPress={() => router.back()}>
        <Text style={styles.topBackText}>{'‹'} Back</Text>
      </TouchableOpacity>

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

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSignup}
        >
          <Text style={styles.primaryButtonText}>Đăng ký ngay</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignup}
        >
          <View style={styles.googleLeft}>
            <Text style={styles.googleG}>G</Text>
          </View>
          <Text style={styles.googleText}>Đăng ký bằng Google</Text>
        </TouchableOpacity>

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
            <Text style={styles.modalTitle}>Please check your email</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleModalClose}>
              <Text style={styles.modalButtonText}>Back to login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const PRIMARY = '#ad4e28';
const BG = '#fbefe6';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // topBack (pill)
  topBack: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  topBackText: { fontSize: 14, color: '#fff', fontWeight: '700' },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: 18,
  },

  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 16,
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
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  dividerRow: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 18,
  },
  divider: { height: 1, backgroundColor: '#e0d6cf', width: '100%' },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  googleLeft: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  googleG: { fontWeight: '700', color: '#4285F4' },
  googleText: { color: '#333', fontSize: 15 },

  signupPrompt: {
    marginTop: 12,
    alignItems: 'center',
  },
  signupPromptText: {
    color: '#555',
    fontSize: 14,
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
    // subtle shadow like other inputs/buttons
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
