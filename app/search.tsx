import CampaignService from '@/services/campaignService';
import OrganizationService from '@/services/organizationService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, PixelRatio, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

const PRIMARY = '#ad4e28';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'campaigns' | 'organizations'>('campaigns');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        if (activeTab === 'campaigns') {
          const data = await CampaignService.listCampaigns({ sortBy: 'MOST_DONATED', limit: 20 });
          if (mounted) {
            const filtered = query
              ? data.filter((c: any) =>
                (c.title || '').toLowerCase().includes(query.toLowerCase())
              )
              : data;
            setCampaigns(filtered);
          }
        } else {
          const data = await OrganizationService.listActiveOrganizations();
          if (mounted) {
            const filtered = query
              ? data.filter((o: any) =>
                (o.name || '').toLowerCase().includes(query.toLowerCase())
              )
              : data;
            setOrganizations(filtered);
          }
        }
      } catch (err) {
        // handle error if needed
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
  }, [activeTab, query]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header with search */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm chiến dịch, tổ chức..."
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#999"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'campaigns' && styles.tabActive]}
          onPress={() => setActiveTab('campaigns')}
        >
          <Text style={[styles.tabText, activeTab === 'campaigns' && styles.tabTextActive]}>
            Chiến dịch
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'organizations' && styles.tabActive]}
          onPress={() => setActiveTab('organizations')}
        >
          <Text style={[styles.tabText, activeTab === 'organizations' && styles.tabTextActive]}>
            Tổ chức
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <View style={styles.content}>
        {activeTab === 'campaigns' ? (
          <FlatList
            data={campaigns}
            keyExtractor={(i) => i.id}
            refreshing={loading}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/campaign/${item.id}`)}
              >
                <View style={styles.campaignItem}>
                  <View style={styles.thumb}>
                    {item.coverImage ? (
                      <Image
                        source={{ uri: item.coverImage }}
                        style={styles.thumbImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="image-outline" size={28} color="#ccc" />
                    )}
                  </View>
                  <View style={styles.campaignInfo}>
                    <Text style={styles.campaignTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>{item.donationCount ?? 0} lượt ủng hộ</Text>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.metaText}>Còn {item.daysLeft ?? '--'} ngày</Text>
                    </View>
                    <Text style={styles.amount}>
                      {item.receivedAmount
                        ? Number(item.receivedAmount).toLocaleString('vi-VN') + ' đ'
                        : '0 đ'}
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${Math.min(item.fundingProgress ?? 0, 100)}%` }]} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#ddd" />
                <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={organizations}
            keyExtractor={(i) => i.id}
            refreshing={loading}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/organization/${item.id}`)}
              >
                <View style={styles.orgItem}>
                  <View style={styles.orgAvatar}>
                    <Text style={styles.orgAvatarText}>
                      {item.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.orgInfo}>
                    <Text style={styles.orgName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.orgMeta}>{item.email || item.phone || 'Tổ chức từ thiện'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="business-outline" size={48} color="#ddd" />
                <Text style={styles.emptyText}>Không tìm thấy tổ chức</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '4%',
    paddingVertical: moderateScale(10),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    marginRight: moderateScale(10),
    minHeight: moderateScale(42), // Ensure minimum touch target
  },
  searchInput: {
    flex: 1,
    fontSize: normalizeFontSize(14),
    color: '#333',
    padding: 0,
  },
  closeBtn: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(10),
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f3f3f3',
    minHeight: moderateScale(38), // Ensure minimum touch target
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: '4%',
    paddingVertical: moderateScale(10),
    gap: moderateScale(10),
  },
  tabButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    minHeight: moderateScale(42), // Ensure minimum touch target
  },
  tabActive: {
    backgroundColor: PRIMARY,
  },
  tabText: {
    color: '#666',
    fontWeight: '600',
    fontSize: normalizeFontSize(13),
  },
  tabTextActive: {
    color: '#fff',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: '4%',
  },

  // Campaign Item
  campaignItem: {
    flexDirection: 'row',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    alignItems: 'flex-start',
  },
  thumb: {
    width: moderateScale(75),
    height: moderateScale(75),
    borderRadius: moderateScale(10),
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  campaignInfo: {
    flex: 1,
    marginLeft: moderateScale(10),
  },
  campaignTitle: {
    fontSize: normalizeFontSize(14),
    fontWeight: '700',
    color: '#222',
    marginBottom: moderateScale(4),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  metaText: {
    color: '#999',
    fontSize: normalizeFontSize(11),
  },
  metaDot: {
    color: '#ccc',
    marginHorizontal: moderateScale(6),
  },
  amount: {
    color: PRIMARY,
    fontWeight: '700',
    fontSize: normalizeFontSize(13),
    marginBottom: moderateScale(6),
  },
  progressBar: {
    width: '100%',
    height: moderateScale(6),
    backgroundColor: '#f0f0f0',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: moderateScale(6),
    backgroundColor: PRIMARY,
    borderRadius: moderateScale(3),
  },

  // Organization Item
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    minHeight: moderateScale(44), // Ensure minimum touch target
  },
  orgAvatar: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: normalizeFontSize(17),
  },
  orgInfo: {
    flex: 1,
    marginLeft: moderateScale(10),
  },
  orgName: {
    fontSize: normalizeFontSize(14),
    fontWeight: '700',
    color: '#222',
  },
  orgMeta: {
    fontSize: normalizeFontSize(12),
    color: '#999',
    marginTop: moderateScale(2),
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(50),
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    marginTop: moderateScale(10),
    fontSize: normalizeFontSize(14),
  },
});

