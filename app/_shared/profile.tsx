import Loading from '@/components/Loading';
import LoginRequire from '@/components/LoginRequire';
import { ACCENT, BG_CREAM as BG, PRIMARY } from '@/constants/colors';
import AuthService from '@/services/authService';
import DonationService from '@/services/donationService';
import UserService from '@/services/userService';
import type { UserProfile } from '@/types/api/user';
import { Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginRequire, setLoginRequire] = useState(false);
  const [donationSummary, setDonationSummary] = useState<{
    totalAmount: number;
    donations: any[];
  }>({
    totalAmount: 0,
    donations: [],
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await UserService.getMyProfile();
        if (mounted) setProfile(data);

        // load lịch sử ủng hộ
        try {
          const myDonations = await DonationService.getMyDonations(undefined, {
            skip: 0,
            take: 10,
          });
          if (mounted && myDonations) {
            const totalAmountNum = Number(myDonations.totalAmount || 0);
            setDonationSummary({
              totalAmount: Number.isNaN(totalAmountNum) ? 0 : totalAmountNum,
              donations: Array.isArray(myDonations.donations)
                ? myDonations.donations
                : [],
            });
          }
        } catch (err) {
          // không chặn profile nếu lịch sử ủng hộ lỗi
          console.error('Error loading my donations:', err);
        }
      } catch (err: any) {
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

  const totalDonated = donationSummary.totalAmount;

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={loading} message="Đang tải thông tin..." />
      <LoginRequire
        visible={loginRequire}
        onClose={() => setLoginRequire(false)}
      />

      {/* COVER + AVATAR */}
      <View style={styles.coverWrap}>
        <Image
          source={{
            uri:
              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          }}
          style={styles.coverImg}
        />
        <View style={styles.coverOverlay} />
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD THÔNG TIN HỒ SƠ */}
        <View style={styles.profileCard}>
          <Text style={styles.fullName}>
            {profile?.full_name || 'Người dùng FoodFund'}
          </Text>
          <Text style={styles.username}>
            @{profile?.user_name || 'username'}
          </Text>

          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={18} color="#888" />
            <Text style={styles.infoText}>{profile?.email || '—'}</Text>
          </View>

          {/* Badge */}
          {profile?.badge && (
            <View style={styles.badgeChip}>
              <Image
                source={{ uri: profile.badge.icon_url }}
                style={styles.badgeIcon}
              />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.badgeName}>{profile.badge.name}</Text>
                <Text style={styles.badgeDesc} numberOfLines={2}>
                  {profile.badge.description}
                </Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                router.push({
                  pathname: '/editProfile',
                  params: {
                    // optional: truyền nhanh 1 ít info, màn edit có thể gọi lại getMyProfile
                    full_name: profile?.full_name ?? '',
                    user_name: profile?.user_name ?? '',
                    phone_number: profile?.phone_number ?? '',
                    address: profile?.address ?? '',
                    avatar_url: profile?.avatar_url ?? '',
                  },
                });
              }}
            >
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

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              await AuthService.signOut();
              await AuthService.removeTokens();
              setProfile(null);
              setLoginRequire(true);
              router.replace('/login');
            }}
          >
            <Text style={styles.logoutBtnText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        {/* TỔNG QUAN ỦNG HỘ */}
        <View style={styles.summaryCard}>
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

        {/* LỊCH SỬ ỦNG HỘ */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Lịch sử ủng hộ</Text>
          <Text style={styles.historySubtitle}>
            Danh sách các lần ủng hộ của bạn
          </Text>

          <View style={styles.historyDivider} />

          {donationSummary.donations.length === 0 ? (
            <View style={styles.historyEmpty}>
              <FontAwesome name="heart-o" size={40} color="#d1d5db" />
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
          ) : (
            <View>
              {donationSummary.donations.map((item: any, idx: number) => {
                const d = item.donation;
                const amountNum = Number(
                  item.amount || item.receivedAmount || 0
                );
                const campaignId = d?.campaignId;
                const donorName = d?.isAnonymous
                  ? 'Người dùng ẩn danh'
                  : d?.donorName || 'Bạn';
                const createdAt = d?.transactionDatetime;

                return (
                  <View key={item.orderCode || idx} style={styles.historyItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyItemTitle}>
                        Ủng hộ chiến dịch
                      </Text>
                      <Text style={styles.historyItemCampaign}>
                        Mã đơn: {item.orderCode}
                      </Text>
                      {campaignId && (
                        <Text style={styles.historyItemCampaign}>
                          Chiến dịch: {campaignId}
                        </Text>
                      )}
                      <Text style={styles.historyItemMeta}>
                        Người ủng hộ: {donorName}
                      </Text>
                      <Text style={styles.historyItemMeta}>
                        Trạng thái: {item.transactionStatus} /{' '}
                        {item.paymentAmountStatus}
                      </Text>
                      <Text style={styles.historyItemMeta}>
                        Thời gian:{' '}
                        {createdAt
                          ? new Date(createdAt).toLocaleString('vi-VN')
                          : '—'}
                      </Text>
                    </View>
                    <View style={styles.historyItemAmountWrap}>
                      <Text style={styles.historyItemAmount}>
                        {amountNum.toLocaleString('vi-VN')} đ
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  coverWrap: {
    width: '100%',
    height: 170,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  coverImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  avatarWrap: {
    position: 'absolute',
    bottom: -40,
    alignSelf: 'center',
  },
  avatarCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 56, // để avatar không bị che
    paddingBottom: 24,
  },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fullName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222',
    textAlign: 'center',
  },
  username: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  infoText: {
    marginLeft: 6,
    color: '#555',
    fontSize: 14,
  },

  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff7eb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  badgeIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
    color: ACCENT,
  },
  badgeDesc: {
    fontSize: 12,
    color: '#6b7280',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    justifyContent: 'center',
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 14,
  },
  shareBtn: {
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ffe1cc',
  },
  logoutBtn: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffe1cc',
    paddingHorizontal: 32,
    paddingVertical: 10,
  },
  logoutBtnText: {
    color: PRIMARY,
    fontWeight: '700',
    fontSize: 14,
  },

  summaryCard: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ffe3c2',
  },
  summaryIconWrapMoney: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },

  historyCard: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#edf0f5',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PRIMARY,
  },
  historySubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#edf0f5',
    marginHorizontal: -16,
    marginTop: 12,
    marginBottom: 18,
  },
  historyEmpty: {
    alignItems: 'center',
  },
  historyEmptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  exploreBtn: {
    marginTop: 14,
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
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#edf0f5',
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
  },
  historyItemCampaign: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2,
  },
  historyItemMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  historyItemAmountWrap: {
    marginLeft: 10,
    alignItems: 'flex-end',
  },
  historyItemAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
});
