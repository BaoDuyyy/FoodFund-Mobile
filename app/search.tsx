import CampaignService from '@/services/campaignService';
import OrganizationService from '@/services/organizationService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.topBack} onPress={() => router.back()}>
        <Text style={styles.topBackText}>{'‹'} Back</Text>
      </TouchableOpacity>

      <View style={styles.inner}>
        <Text style={styles.heading}>Tìm kiếm</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Nhập từ khóa tìm kiếm"
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#999"
        />

        {/* tabs ngay dưới search */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'campaigns' && styles.tabActive]}
            onPress={() => setActiveTab('campaigns')}
          >
            <Text style={[styles.tabText, activeTab === 'campaigns' && styles.tabTextActive]}>Chiến dịch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'organizations' && styles.tabActive]}
            onPress={() => setActiveTab('organizations')}
          >
            <Text style={[styles.tabText, activeTab === 'organizations' && styles.tabTextActive]}>Tổ chức</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'campaigns' ? (
          <FlatList
            data={campaigns}
            keyExtractor={(i) => i.id}
            refreshing={loading}
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
                    ) : null}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.campaignTitle}>{item.title}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>{item.donationCount ?? 0} lượt ủng hộ</Text>
                      <Text style={[styles.metaText, { marginLeft: 8 }]}>•</Text>
                      <Text style={[styles.metaText, { marginLeft: 8 }]}>Còn lại {item.daysLeft ?? '--'} ngày</Text>
                    </View>
                    <Text style={[styles.amount, { marginTop: 8 }]}>
                      {item.receivedAmount ? Number(item.receivedAmount).toLocaleString('vi-VN') + ' đ' : 'Hãy là người ủng hộ đầu tiên'}
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${Math.min(item.fundingProgress ?? 0, 100)}%` }]} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Không có kết quả</Text>}
          />
        ) : (
          <FlatList
            data={organizations}
            keyExtractor={(i) => i.id}
            refreshing={loading}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/organization/${item.id}`)}
              >
                <View style={styles.accountItem}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.accountName}>{item.name}</Text>
                    <Text style={styles.accountHandle}>{item.email || item.phone || ''}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Không có kết quả</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBack: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ad4e28',
  },
  topBackText: { color: '#fff', fontWeight: '700' },

  inner: { flex: 1, padding: 20, paddingTop: 64 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#333' },

  searchInput: {
    width: '100%',
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  tabContainer: { flexDirection: 'row', marginBottom: 12, backgroundColor: 'transparent' },
  tabButton: {
    flex: 1,
    backgroundColor: '#f3f3f3',
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  tabText: { color: '#333', fontWeight: '600' },
  tabTextActive: { color: '#000' },

  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultText: { fontSize: 16, color: '#333' },
  empty: { color: '#999', textAlign: 'center', marginTop: 24 },

  /* accounts */
  accountItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffb46b', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  accountName: { fontSize: 16, fontWeight: '700', color: '#111' },
  accountHandle: { fontSize: 13, color: '#9b9b9b', marginTop: 4 },

  /* campaigns */
  campaignItem: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', alignItems: 'flex-start' },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 10,
    backgroundColor: '#f2d9b8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  campaignTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  metaRow: { flexDirection: 'row', marginTop: 6, alignItems: 'center' },
  metaText: { color: '#9b9b9b', fontSize: 13 },
  /* amount displayed above progress */
  amount: { color: '#f59a2a', fontWeight: '700' },
  progressBar: { width: '100%', height: 8, backgroundColor: '#f0f0f0', borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#f59a2a', borderRadius: 8 },
});
