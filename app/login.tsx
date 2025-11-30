import Loading from '@/components/Loading';
import { GOOGLE_CLIENT_ID } from '@/config/google'; // dùng config
import AuthService from '@/services/authService';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    try {
      setIsLoading(true);
      if (!email || !password) {
        alert('Vui lòng nhập email và mật khẩu');
        setIsLoading(false);
        return;
      }

      const result = await AuthService.login(email, password);

      await SecureStore.setItemAsync('accessToken', result.accessToken || '');
      await SecureStore.setItemAsync('refreshToken', result.refreshToken || '');

      console.log('LOGIN SUCCESS:', result);
      // Kiểm tra role và chuyển hướng tab phù hợp
      const { role } = await AuthService.getUserInfo();
      if (role === "KITCHEN") {
        router.replace('/(kitchen-tabs)' as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      alert(err?.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
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
      alert(err?.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={isLoading} message="Signing in..." />

      {/* in-page top-left back button (updated to pill-style) */}
      <TouchableOpacity style={styles.topBack} onPress={() => router.back()}>
        <Text style={styles.topBackText}>{'‹'} Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
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

        {/* password wrap: contains password input + 'Quên mật khẩu' at bottom-right */}
        <View style={styles.passwordWrap}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mật khẩu"
            placeholderTextColor="#bdbdbd"
            style={styles.input}
            secureTextEntry
          />
          <TouchableOpacity style={styles.forgotInBox} onPress={() => { /* handle forgot */ }}>
            <Text style={styles.forgotInBoxText}>Quên mật khẩu</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleLogin}
        >
          <Text style={styles.primaryButtonText}>Đăng nhập</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
        >
          <View style={styles.googleLeft}>
            <Text style={styles.googleG}>G</Text>
          </View>
          <Text style={styles.googleText}>Đăng nhập bằng Google</Text>
        </TouchableOpacity>

        {/* signup prompt under google button */}
        <View style={styles.signupPrompt}>
          <Text style={styles.signupPromptText}>
            Bạn chưa có tài khoản của FoodFund?{' '}
            <Text style={styles.signupLink} onPress={() => router.push('/signup')}>
              Tạo tài khoản
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const PRIMARY = '#ad4e28';
const BG = '#fbefe6';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // topBack updated (pill)
  topBack: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    // subtle shadow to make it pop
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
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // wrapper for password field so forgot link can be positioned relative to it
  passwordWrap: {
    width: '100%',
    position: 'relative',
    marginBottom: 28, // increased to make room for the link below the input
  },
  forgotInBox: {
    position: 'absolute',
    right: 12,
    bottom: -20, // place the link below the input, aligned to the right
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  forgotInBoxText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '700',
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
    // shadow
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

  // signup prompt under google button
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
});
