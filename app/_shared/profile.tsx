import Loading from '@/components/Loading';
import LoginRequire from '@/components/LoginRequire';
import { ACCENT, BG_CREAM as BG, PRIMARY } from '@/constants/colors';
import { useAuth, useNotificationPolling } from '@/hooks';
import DonationService from '@/services/donationService';
import GuestMode from '@/services/guestMode';
import UserService from '@/services/userService';
import type { UserProfile } from '@/types/api/user';
import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { unreadCount } = useNotificationPolling();
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

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterFromDate, setFilterFromDate] = useState<Date | null>(null);
  const [filterToDate, setFilterToDate] = useState<Date | null>(null);
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');

  // Date picker states
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('vi-VN');
  };

  // Filtered donations
  const filteredDonations = useMemo(() => {
    let result = donationSummary.donations;

    // Date filter
    if (filterFromDate) {
      result = result.filter((item: any) => {
        const d = item.donation?.transactionDatetime;
        if (!d) return false;
        const itemDate = new Date(d);
        return itemDate >= filterFromDate;
      });
    }
    if (filterToDate) {
      const toDateEnd = new Date(filterToDate);
      toDateEnd.setHours(23, 59, 59, 999);
      result = result.filter((item: any) => {
        const d = item.donation?.transactionDatetime;
        if (!d) return false;
        const itemDate = new Date(d);
        return itemDate <= toDateEnd;
      });
    }

    // Amount filter
    const minAmt = filterMinAmount ? Number(filterMinAmount.replace(/\D/g, '')) : 0;
    const maxAmt = filterMaxAmount ? Number(filterMaxAmount.replace(/\D/g, '')) : Infinity;
    if (minAmt > 0 || maxAmt < Infinity) {
      result = result.filter((item: any) => {
        const amt = Number(item.amount || item.receivedAmount || 0);
        return amt >= minAmt && amt <= maxAmt;
      });
    }

    return result;
  }, [donationSummary.donations, filterFromDate, filterToDate, filterMinAmount, filterMaxAmount]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // Check if user is in guest mode
        const isGuest = await GuestMode.isGuest();
        if (isGuest) {
          if (mounted) setLoginRequire(true);
          if (mounted) setLoading(false);
          return;
        }

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
        }
      } catch (err: any) {
        // Any error (including Internal server error) means user is not logged in
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
        {/* Removed external image dependency, using solid background color */}

        {/* Notification Bell */}
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => router.push('/notifications' as any)}
        >
          <Ionicons name="notifications-outline" size={22} color="#fff" />
          {unreadCount > 0 && (
            <View style={styles.notiBadge}>
              <Text style={styles.notiBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Image
              source={
                profile?.avatar_url
                  ? { uri: profile.avatar_url }
                  : require('@/assets/images/avatar.jpg')
              }
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
              style={styles.logoutBtn}
              onPress={async () => {
                // Check guest mode directly instead of using state
                const isGuest = await GuestMode.isGuest();
                if (isGuest || loginRequire) {
                  // If guest mode, go to welcome page
                  router.replace('/welcome');
                } else {
                  // Normal logout flow
                  try {
                    await logout();
                  } catch (err) {
                    // Ignore logout errors (e.g., if already logged out)
                  }
                  setProfile(null);
                  setLoginRequire(true);
                  router.replace('/login');
                }
              }}
            >
              <Feather name="log-out" size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>
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

        {/* LỊCH SỦ ỦNG HỘ */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.historyTitle}>Lịch sử ủng hộ</Text>
              <Text style={styles.historySubtitle}>
                Danh sách các lần ủng hộ của bạn
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.filterToggleBtn, showFilters && styles.filterToggleBtnActive]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons name="filter" size={16} color={showFilters ? '#fff' : PRIMARY} />
              <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>Lọc</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Panel */}
          {showFilters && (
            <View style={styles.filterPanel}>
              <Text style={styles.filterLabel}>Theo ngày</Text>
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={styles.filterDateBtn}
                  onPress={() => setShowFromPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color={PRIMARY} />
                  <Text style={filterFromDate ? styles.filterDateText : styles.filterDatePlaceholder}>
                    {filterFromDate ? formatDate(filterFromDate) : 'Từ ngày'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.filterDash}>—</Text>
                <TouchableOpacity
                  style={styles.filterDateBtn}
                  onPress={() => setShowToPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color={PRIMARY} />
                  <Text style={filterToDate ? styles.filterDateText : styles.filterDatePlaceholder}>
                    {filterToDate ? formatDate(filterToDate) : 'Đến ngày'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Date Pickers */}
              {showFromPicker && (
                <DateTimePicker
                  value={filterFromDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowFromPicker(Platform.OS === 'ios');
                    if (date) setFilterFromDate(date);
                  }}
                />
              )}
              {showToPicker && (
                <DateTimePicker
                  value={filterToDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowToPicker(Platform.OS === 'ios');
                    if (date) setFilterToDate(date);
                  }}
                />
              )}

              <Text style={styles.filterLabel}>Theo số tiền (đ)</Text>
              <View style={styles.filterRow}>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Từ"
                  placeholderTextColor="#999"
                  value={filterMinAmount}
                  onChangeText={setFilterMinAmount}
                  keyboardType="numeric"
                />
                <Text style={styles.filterDash}>—</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Đến"
                  placeholderTextColor="#999"
                  value={filterMaxAmount}
                  onChangeText={setFilterMaxAmount}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                style={styles.filterClearBtn}
                onPress={() => {
                  setFilterFromDate(null);
                  setFilterToDate(null);
                  setFilterMinAmount('');
                  setFilterMaxAmount('');
                }}
              >
                <Text style={styles.filterClearText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.historyDivider} />

          {filteredDonations.length === 0 ? (
            <View style={styles.historyEmpty}>
              <FontAwesome name="heart-o" size={40} color="#d1d5db" />
              <Text style={styles.historyEmptyText}>
                {donationSummary.donations.length === 0
                  ? 'Bạn chưa có lượt ủng hộ nào'
                  : 'Không có kết quả phù hợp với bộ lọc'}
              </Text>
              {donationSummary.donations.length === 0 && (
                <TouchableOpacity
                  style={styles.exploreBtn}
                  onPress={() => router.push('/campaign' as any)}
                >
                  <Text style={styles.exploreBtnText}>Khám phá chiến dịch</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              {filteredDonations.map((item: any, idx: number) => {
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
    marginBottom: 50, // Space for avatar to overlap
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
    paddingTop: 10, // Reduced since header has marginBottom now
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
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
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
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 4,
  },
  filterToggleBtnActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },
  filterToggleTextActive: {
    color: '#fff',
  },
  filterPanel: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fefce8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#854d0e',
    marginBottom: 6,
    marginTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111',
  },
  filterDash: {
    color: '#9ca3af',
    fontSize: 14,
  },
  filterClearBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterClearText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterDateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  filterDateText: {
    fontSize: 14,
    color: '#111',
  },
  filterDatePlaceholder: {
    fontSize: 14,
    color: '#999',
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

  // Notification bell styles
  notificationBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  notiBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notiBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
