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
  Dimensions,
  Image,
  PixelRatio,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    height: moderateScale(160),
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: moderateScale(22),
    borderBottomRightRadius: moderateScale(22),
    marginBottom: moderateScale(45), // Space for avatar to overlap
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
    bottom: moderateScale(-38),
    alignSelf: 'center',
  },
  avatarCircle: {
    width: moderateScale(85),
    height: moderateScale(85),
    borderRadius: moderateScale(43),
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
    paddingHorizontal: '5%',
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(22),
  },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fullName: {
    fontSize: normalizeFontSize(18),
    fontWeight: '800',
    color: '#222',
    textAlign: 'center',
  },
  username: {
    fontSize: normalizeFontSize(12),
    color: '#888',
    textAlign: 'center',
    marginTop: moderateScale(4),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(10),
  },
  infoText: {
    marginLeft: moderateScale(6),
    color: '#555',
    fontSize: normalizeFontSize(13),
  },

  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    backgroundColor: '#fff7eb',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  badgeIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
  },
  badgeName: {
    fontSize: normalizeFontSize(12),
    fontWeight: '700',
    color: ACCENT,
  },
  badgeDesc: {
    fontSize: normalizeFontSize(11),
    color: '#6b7280',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(14),
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: moderateScale(44), // Ensure minimum touch target
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: moderateScale(8),
    fontSize: normalizeFontSize(13),
  },
  shareBtn: {
    marginLeft: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ffe1cc',
  },
  logoutBtn: {
    marginLeft: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderRadius: 999,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    minHeight: moderateScale(44), // Ensure minimum touch target
    justifyContent: 'center',
    alignItems: 'center',
  },

  summaryCard: {
    marginTop: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ffe3c2',
  },
  summaryIconWrapMoney: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  summaryIconText: {
    color: PRIMARY,
    fontWeight: '800',
    fontSize: normalizeFontSize(16),
  },
  summaryValue: {
    fontSize: normalizeFontSize(17),
    fontWeight: '800',
    color: '#111',
  },
  summaryLabel: {
    fontSize: normalizeFontSize(12),
    color: '#6b7280',
    marginTop: moderateScale(2),
  },

  historyCard: {
    marginTop: moderateScale(14),
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    borderWidth: 1,
    borderColor: '#edf0f5',
  },
  historyTitle: {
    fontSize: normalizeFontSize(15),
    fontWeight: '800',
    color: PRIMARY,
  },
  historySubtitle: {
    fontSize: normalizeFontSize(12),
    color: '#6b7280',
    marginTop: moderateScale(2),
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(18),
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: moderateScale(4),
    minHeight: moderateScale(32), // Ensure minimum touch target
  },
  filterToggleBtnActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  filterToggleText: {
    fontSize: normalizeFontSize(12),
    fontWeight: '600',
    color: PRIMARY,
  },
  filterToggleTextActive: {
    color: '#fff',
  },
  filterPanel: {
    marginTop: moderateScale(10),
    padding: moderateScale(10),
    backgroundColor: '#fefce8',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  filterLabel: {
    fontSize: normalizeFontSize(11),
    fontWeight: '600',
    color: '#854d0e',
    marginBottom: moderateScale(6),
    marginTop: moderateScale(8),
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  filterInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    fontSize: normalizeFontSize(13),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111',
    minHeight: moderateScale(40), // Ensure minimum touch target
  },
  filterDash: {
    color: '#9ca3af',
    fontSize: normalizeFontSize(13),
  },
  filterClearBtn: {
    alignSelf: 'flex-end',
    marginTop: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: moderateScale(32), // Ensure minimum touch target
  },
  filterClearText: {
    fontSize: normalizeFontSize(11),
    color: '#6b7280',
    fontWeight: '500',
  },
  filterDateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: moderateScale(6),
    minHeight: moderateScale(40), // Ensure minimum touch target
  },
  filterDateText: {
    fontSize: normalizeFontSize(13),
    color: '#111',
  },
  filterDatePlaceholder: {
    fontSize: normalizeFontSize(13),
    color: '#999',
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#edf0f5',
    marginHorizontal: moderateScale(-14),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(16),
  },
  historyEmpty: {
    alignItems: 'center',
  },
  historyEmptyText: {
    marginTop: moderateScale(10),
    fontSize: normalizeFontSize(13),
    color: '#6b7280',
  },
  exploreBtn: {
    marginTop: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: 999,
    backgroundColor: PRIMARY,
    minHeight: moderateScale(44), // Ensure minimum touch target
  },
  exploreBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: normalizeFontSize(13),
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: '#edf0f5',
  },
  historyItemTitle: {
    fontSize: normalizeFontSize(13),
    fontWeight: '700',
    color: PRIMARY,
  },
  historyItemCampaign: {
    fontSize: normalizeFontSize(11),
    color: '#4b5563',
    marginTop: moderateScale(2),
  },
  historyItemMeta: {
    fontSize: normalizeFontSize(11),
    color: '#6b7280',
    marginTop: moderateScale(1),
  },
  historyItemAmountWrap: {
    marginLeft: moderateScale(10),
    alignItems: 'flex-end',
  },
  historyItemAmount: {
    fontSize: normalizeFontSize(13),
    fontWeight: '800',
    color: '#111827',
  },

  // Notification bell styles
  notificationBtn: {
    position: 'absolute',
    top: moderateScale(12),
    right: moderateScale(14),
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  notiBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: moderateScale(15),
    height: moderateScale(15),
    borderRadius: moderateScale(8),
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(3),
  },
  notiBadgeText: {
    color: '#fff',
    fontSize: normalizeFontSize(8),
    fontWeight: '700',
  },
});
