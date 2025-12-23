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
  Dimensions,
  Image,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
    paddingHorizontal: "4%",
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(8),
    backgroundColor: '#fff',
  },
  backBtn: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    borderWidth: 1,
    borderColor: '#f3e1d6',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: normalizeFontSize(15),
    fontWeight: '700',
    color: PRIMARY,
  },
  content: {
    paddingHorizontal: "4%",
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(22),
  },

  sectionLabel: {
    fontSize: normalizeFontSize(12),
    fontWeight: '700',
    color: PRIMARY,
    marginTop: moderateScale(10),
    marginBottom: moderateScale(4),
  },

  // avatar
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImgBig: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    backgroundColor: '#eee',
  },
  avatarBtn: {
    marginLeft: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    minHeight: moderateScale(40), // Ensure minimum touch target
  },
  avatarBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: normalizeFontSize(12),
    marginLeft: moderateScale(6),
  },

  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    backgroundColor: '#fff',
    fontSize: normalizeFontSize(13),
    color: '#111827',
    minHeight: moderateScale(44), // Ensure minimum touch target
  },

  saveBtn: {
    marginTop: moderateScale(18),
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(48), // Ensure minimum touch target
  },
  saveBtnText: {
    color: '#fff',
    fontSize: normalizeFontSize(14),
    fontWeight: '800',
  },
});
