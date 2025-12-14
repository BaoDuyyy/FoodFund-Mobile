import AlertPopup from '@/components/AlertPopup';
import Loading from '@/components/Loading';
import { BG_CREAM as BG, PRIMARY } from '@/constants/colors';
import UserService from '@/services/userService';
import type { UserProfile } from '@/types/api/user';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfilePage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    full_name?: string;
    user_name?: string;
    phone_number?: string;
    address?: string;
    avatar_url?: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [fullName, setFullName] = useState(params.full_name ?? '');
  const [userName, setUserName] = useState(params.user_name ?? '');
  const [phoneNumber, setPhoneNumber] = useState(params.phone_number ?? '');
  const [address, setAddress] = useState(params.address ?? '');
  const [avatarUrl, setAvatarUrl] = useState(params.avatar_url ?? '');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await UserService.getMyProfile();
        if (!mounted) return;
        setProfile(data);
        setFullName(data.full_name ?? '');
        setUserName(data.user_name ?? '');
        setPhoneNumber(data.phone_number ?? '');
        setAddress(data.address ?? '');
        setAvatarUrl(data.avatar_url ?? '');
      } catch (err) {
        console.error('Error loading profile for edit:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Cần quyền truy cập thư viện ảnh để đổi avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const fileType = (asset.mimeType || 'image/jpeg').includes('png') ? 'png' : 'jpg';

    try {
      setSaving(true);
      // 1. Lấy uploadUrl
      const gen = await UserService.generateAvatarUploadUrl({ fileType });
      const { uploadUrl, cdnUrl } = gen.uploadUrl;

      // 2. Upload ảnh lên uploadUrl
      const resp = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': asset.mimeType || 'image/jpeg',
        },
        body: (await fetch(asset.uri)).body as any,
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`Upload avatar failed: ${resp.status} ${txt}`);
      }

      // 3. Cập nhật avatar_url local (cdnUrl)
      setAvatarUrl(cdnUrl);
      showAlert('Ảnh đại diện đã được tải lên, nhớ bấm Cập nhật.');
    } catch (err: any) {
      console.error('Upload avatar error:', err);
      showAlert(err?.message || 'Không thể tải lên ảnh đại diện.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await UserService.updateMyProfile({
        full_name: fullName,
        phone_number: phoneNumber || null,
        address,
        avatar_url: avatarUrl,
        bio: '', // hoặc thêm state bio nếu bạn có field trong UI
      });
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ cá nhân.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      console.error('updateMyProfile error:', err);
      showAlert(err?.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  const avatarSource = (avatarUrl || profile?.avatar_url)
    ? { uri: avatarUrl || profile?.avatar_url }
    : require('@/assets/images/avatar.jpg');

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={loading || saving} message="Đang xử lý..." />
      <AlertPopup
        visible={alertVisible}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <Text style={styles.sectionLabel}>Ảnh đại diện</Text>
        <View style={styles.avatarRow}>
          <Image source={avatarSource} style={styles.avatarImgBig} />
          <TouchableOpacity style={styles.avatarBtn} onPress={handlePickAvatar}>
            <Feather name="image" size={18} color="#fff" />
            <Text style={styles.avatarBtnText}>Chọn ảnh</Text>
          </TouchableOpacity>
        </View>

        {/* Họ và tên */}
        <Text style={styles.sectionLabel}>Họ và tên</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nhập họ và tên"
        />

        {/* Tên đăng nhập */}
        <Text style={styles.sectionLabel}>Tên đăng nhập</Text>
        <TextInput
          style={styles.input}
          value={userName}
          onChangeText={setUserName}
          placeholder="Nhập tên đăng nhập"
        />

        {/* Số điện thoại */}
        <Text style={styles.sectionLabel}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholder="Nhập số điện thoại"
        />

        {/* Địa chỉ */}
        <Text style={styles.sectionLabel}>Địa chỉ</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          value={address}
          onChangeText={setAddress}
          multiline
          placeholder="Nhập địa chỉ"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>Cập nhật</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // layout
  container: { flex: 1, backgroundColor: BG },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3e1d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
    marginTop: 12,
    marginBottom: 4,
  },

  // avatar
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImgBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
  },
  avatarBtn: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  avatarBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#111827',
  },

  saveBtn: {
    marginTop: 20,
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
