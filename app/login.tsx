import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.container}>
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
          onPress={() => {
            // simulate sign in -> navigate to main tabs
            router.replace('/(tabs)');
          }}
        >
          <Text style={styles.primaryButtonText}>Đăng nhập</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => {
            // stub: google sign-in -> navigate to main tabs
            router.replace('/(tabs)');
          }}
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
