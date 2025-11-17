import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'campaigns'>('accounts');

  const mockAccounts = [
    { id: 'a1', name: 'Lưu Trung Thái', handle: '@luutrungthai1' },
    { id: 'a2', name: 'CLB THIỆN NGUYỆN NHỮNG ĐÔI CHÂN TRẦN', handle: '@clbthiennguyen...' },
    { id: 'a3', name: 'Thiện nguyện Hoa Hướng Dương', handle: '@ngocanh1987' },
    { id: 'a4', name: 'Trương Tâm Như', handle: '@tamnhu9597' },
  ].filter((a) => (a.name + a.handle).toLowerCase().includes(query.toLowerCase()));

  const mockCampaigns = [
    { id: 'c1', title: 'kêu gọi ủng hộ ạaaa', supports: 2, daysLeft: 17, amount: '60.000 đ', percent: 1 },
    { id: 'c2', title: 'QUỸ GIEO 3CG', supports: 1, daysLeft: 1874, amount: '7.550.198 đ', percent: 2 },
    { id: 'c3', title: '12000 cuốn Kinh Dược Sư', supports: 1, daysLeft: 394, amount: '1.000.000 đ', percent: 0 },
    { id: 'c4', title: 'ÁO ẤM CHO EM 2025', supports: 0, daysLeft: 45, amount: 'Hãy là người ủng hộ đầu tiên', percent: 0 },
  ].filter((c) => (c.title).toLowerCase().includes(query.toLowerCase()));

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
            style={[styles.tabButton, activeTab === 'accounts' && styles.tabActive]}
            onPress={() => setActiveTab('accounts')}
          >
            <Text style={[styles.tabText, activeTab === 'accounts' && styles.tabTextActive]}>Tài khoản</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'campaigns' && styles.tabActive]}
            onPress={() => setActiveTab('campaigns')}
          >
            <Text style={[styles.tabText, activeTab === 'campaigns' && styles.tabTextActive]}>Chiến dịch</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'accounts' ? (
          <FlatList
            data={mockAccounts}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={styles.accountItem}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.split(' ').slice(-1)[0][0]}</Text></View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.accountName}>{item.name}</Text>
                  <Text style={styles.accountHandle}>{item.handle}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Không có kết quả</Text>}
          />
        ) : (
          <FlatList
            data={mockCampaigns}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  // navigate to campaign page with id
                  // example path: /campaign?id=c1
                  // expo-router will expose params on the campaign page
                  // keep it simple and use query param
                  router.push(`/campaign?id=${item.id}`);
                }}
                style={{}}
              >
                <View style={styles.campaignItem}>
                  <View style={styles.thumb} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.campaignTitle}>{item.title}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>{item.supports} lượt ủng hộ</Text>
                      <Text style={[styles.metaText, { marginLeft: 8 }]}>•</Text>
                      <Text style={[styles.metaText, { marginLeft: 8 }]}>Còn lại {item.daysLeft} ngày</Text>
                    </View>
                    {/* amount then progress bar below */}
                    <Text style={[styles.amount, { marginTop: 8 }]}>{item.amount}</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${Math.min(item.percent, 100)}%` }]} />
                    </View>
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
  thumb: { width: 84, height: 84, borderRadius: 10, backgroundColor: '#f2d9b8' },
  campaignTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  metaRow: { flexDirection: 'row', marginTop: 6, alignItems: 'center' },
  metaText: { color: '#9b9b9b', fontSize: 13 },
  /* amount displayed above progress */
  amount: { color: '#f59a2a', fontWeight: '700' },
  progressBar: { width: '100%', height: 8, backgroundColor: '#f0f0f0', borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#f59a2a', borderRadius: 8 },
});
