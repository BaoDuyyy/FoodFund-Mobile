import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  return (
    <SafeAreaView style={styles.container}>
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
          onPress={() => {
            // simulate sign up -> navigate to main tabs
            router.replace('/(tabs)');
          }}
        >
          <Text style={styles.primaryButtonText}>Đăng ký ngay</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => {
            // stub: google sign-up -> navigate to main tabs
            router.replace('/(tabs)');
          }}
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
});
