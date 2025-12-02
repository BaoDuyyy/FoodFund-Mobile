import Loading from '@/components/Loading';
import LoginRequire from '@/components/LoginRequire';
import AuthService from '@/services/authService';
import UserService from '@/services/userService';
import type { UserProfile } from '@/types/api/user';
import { Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY = '#ad4e28';
const BG = '#fbefe6';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginRequire, setLoginRequire] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await UserService.getMyProfile();
        if (mounted) setProfile(data);
      } catch (err: any) {
        // nếu backend trả lỗi chưa đăng nhập thì show popup yêu cầu login
        if (mounted) setLoginRequire(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // TODO: sau này map với API sao kê / thống kê ủng hộ
  const totalDonated = 0;

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={loading} message="Đang tải thông tin..." />
      <LoginRequire visible={loginRequire} onClose={() => setLoginRequire(false)} />

      {/* Cover + avatar */}
      <View style={styles.coverWrap}>
        <Image
          source={{
            uri:
              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          }}
          style={styles.coverImg}
        />
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Image
              source={{
                uri:
                  profile?.avatar_url ||
                  'https://api.dicebear.com/7.x/bottts-neutral/png?seed=foodfund',
              }}
              style={styles.avatarImg}
            />
          </View>
        </View>
      </View>

      {/* Thông tin hồ sơ */}
      <View style={styles.infoWrap}>
        <Text style={styles.fullName}>{profile?.full_name || 'Người dùng FoodFund'}</Text>
        <Text style={styles.username}>@{profile?.user_name || 'username'}</Text>

        <View style={styles.infoRow}>
          <MaterialIcons name="email" size={18} color="#777" />
          <Text style={styles.infoText}>{profile?.email || '—'}</Text>
        </View>

        {/* Badge nếu có */}
        {profile?.badge && (
          <View style={styles.badgeChip}>
            <Image source={{ uri: profile.badge.icon_url }} style={styles.badgeIcon} />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.badgeName}>{profile.badge.name}</Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>
                {profile.badge.description}
              </Text>
            </View>
          </View>
        )}

        {/* Nút hành động nhỏ: chỉnh sửa + chia sẻ */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn}>
            <Feather name="edit-3" size={18} color="#fff" />
            <Text style={styles.editBtnText}>Chỉnh sửa thông tin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => {
              // TODO: share profile link
            }}
          >
            <Feather name="share-2" size={18} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Nút đăng xuất */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await AuthService.signOut();
            await AuthService.removeTokens();
            setProfile(null);
            setLoginRequire(true);
            router.replace("/login");
          }}
        >
          <Text style={styles.logoutBtnText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Nội dung phía dưới: Tổng quan ủng hộ + Lịch sử ủng hộ */}
      <View style={styles.body}>
        {/* Tổng quan ủng hộ (chỉ 1 card: tổng số tiền) */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCardMoney}>
            <View style={styles.summaryIconWrapMoney}>
              <Text style={styles.summaryIconText}>$</Text>
            </View>
            <View>
              <Text style={styles.summaryValue}>
                {totalDonated.toLocaleString('vi-VN')} đ
              </Text>
              <Text style={styles.summaryLabel}>Tổng số tiền đã ủng hộ</Text>
            </View>
          </View>
        </View>

        {/* Lịch sử ủng hộ */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Lịch sử ủng hộ</Text>
          <Text style={styles.historySubtitle}>
            Danh sách các lần ủng hộ của bạn
          </Text>

          {/* Ngăn cách phần header và list */}
          <View style={styles.historyDivider} />

          {/* Empty state – sau này thay bằng FlatList giao dịch nếu có data */}
          <View style={styles.historyEmpty}>
            <FontAwesome name="heart-o" size={40} color="#c4cbd4" />
            <Text style={styles.historyEmptyText}>
              Bạn chưa có lượt ủng hộ nào
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/campaign' as any)}
            >
              <Text style={styles.exploreBtnText}>Khám phá chiến dịch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  coverWrap: {
    width: '100%',
    height: 150,
    position: 'relative',
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  coverImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.92,
  },
  avatarWrap: {
    position: 'absolute',
    left: 24,
    bottom: -34,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Info
  infoWrap: {
    marginTop: 50,
    paddingHorizontal: 20,
  },
  fullName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222',
  },
  username: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infoText: {
    marginLeft: 6,
    color: '#555',
    fontSize: 14,
  },

  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ffe3c7',
  },
  badgeIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
  },
  badgeDesc: {
    fontSize: 12,
    color: '#666',
    maxWidth: 220,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 14,
  },
  shareBtn: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ffd9c3',
  },
  logoutBtn: {
    marginTop: 18,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffd9c3',
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  logoutBtnText: {
    color: PRIMARY,
    fontWeight: '700',
    fontSize: 15,
  },

  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Summary
  summaryRow: {
    marginBottom: 16,
  },
  summaryCardMoney: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7e9',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffe0b7',
  },
  summaryIconWrapMoney: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryIconText: {
    color: PRIMARY,
    fontWeight: '800',
    fontSize: 18,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  // History card
  historyCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#edf0f5',
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PRIMARY,
  },
  historySubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 10,
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#edf0f5',
    marginHorizontal: -16,
    marginBottom: 24,
  },
  historyEmpty: {
    flex: 1,
    alignItems: 'center',
  },
  historyEmptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  exploreBtn: {
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  exploreBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
