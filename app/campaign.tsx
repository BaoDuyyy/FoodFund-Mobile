import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CampaignPage() {
  const params = useLocalSearchParams();
  const id = (params as { id?: string }).id || 'c1';

  // mock data (same shape as search.tsx)
  const mockCampaigns = [
    { id: 'c1', title: 'kêu gọi ủng hộ', supports: 2, daysLeft: 17, amount: '60.000 đ', percent: 1 },
    { id: 'c2', title: 'QUỸ GIEO 3CG', supports: 1, daysLeft: 1874, amount: '7.550.198 đ', percent: 2 },
    { id: 'c3', title: '12000 cuốn Kinh Dược Sư', supports: 1, daysLeft: 394, amount: '1.000.000 đ', percent: 0 },
    { id: 'c4', title: 'ÁO ẤM CHO EM 2025', supports: 0, daysLeft: 45, amount: 'Hãy là người ủng hộ đầu tiên', percent: 0 },
  ];
  const item = mockCampaigns.find((c) => c.id === id) || mockCampaigns[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Image source={{ uri: 'https://picsum.photos/800/600?random=' + item.id }} style={styles.headerImage} />
        <View style={styles.card}>
          <View style={styles.tag}><Text style={styles.tagText}>Thiên tai</Text></View>
          <Text style={styles.title}>{item.title}</Text>

          <View style={styles.creatorRow}>
            <View style={styles.creatorAvatar}><Text style={styles.creatorAvatarText}>H</Text></View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.creatorLabel}>Tạo bởi</Text>
              <Text style={styles.creatorName}>Hội Chữ Thập Đỏ Tỉnh Cao Bằng</Text>
            </View>
            <TouchableOpacity style={styles.followBtn}><Text style={styles.followBtnText}>+</Text></TouchableOpacity>
          </View>

          <View style={styles.statsBox}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Mục tiêu chiến dịch</Text>
              <Text style={styles.statValue}>10.000.000 đ</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Thời gian còn lại</Text>
              <Text style={styles.statValue}>27 ngày</Text>
            </View>
          </View>

          {/* amount + progress */}
          <View style={styles.amountRow}>
            <Text style={styles.amountText}>{item.amount}</Text>
            <Text style={styles.percentText}>{item.percent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(item.percent,100)}%` }]} />
          </View>

          {/* tabs */}
          <View style={styles.infoTabs}>
            <Text style={[styles.tabActiveText]}>Tổng quan</Text>
            <Text style={styles.tabText}>Thông tin</Text>
            <Text style={styles.tabText}>Ảnh</Text>
          </View>

          <Text style={styles.description}>
            Vừa qua, hoàn lưu bão số 11 (Matmo) đã gây ra đợt mưa lũ lịch sử tại Cao Bằng, để lại hậu quả, thiệt hại hết sức nghiêm trọng.
            {'\n\n'}
            Theo thống kê sơ bộ, tính đến ngày 08/10/2025, mưa lũ đã khiến 7 người chết, 5 người bị thương. Trên 14.000 ngôi nhà ở bị thiệt hại...
          </Text>

          <View style={styles.supportSection}>
            <Text style={styles.supportHeading}>Lượt ủng hộ <Text style={styles.supportCount}>975</Text></Text>
            <View style={styles.noSupport}>
              <Text style={{ color: '#999' }}>Chưa có lượt ủng hộ nào</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.donateBtn}>
        <Text style={styles.donateText}>Ủng hộ</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerImage: { width: '100%', height: 300, resizeMode: 'cover' },
  card: {
    backgroundColor: '#fff',
    marginTop: -28,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  tag: { backgroundColor: '#e9f9ef', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  tagText: { color: '#2bb673', fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', marginTop: 12, marginBottom: 12, color: '#111' },

  creatorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f6f6f6', padding: 12, borderRadius: 12 },
  creatorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e6f7ee', alignItems: 'center', justifyContent: 'center' },
  creatorAvatarText: { color: '#2bb673', fontWeight: '700' },
  creatorLabel: { fontSize: 12, color: '#9b9b9b' },
  creatorName: { fontSize: 14, fontWeight: '700', color: '#111', marginTop: 2 },
  followBtn: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  followBtnText: { color: '#f59a2a', fontWeight: '700' },

  statsBox: { flexDirection: 'row', backgroundColor: '#fafafa', marginTop: 14, borderRadius: 12, padding: 14, alignItems: 'center' },
  statCol: { flex: 1 },
  statLabel: { color: '#9b9b9b', fontSize: 13 },
  statValue: { fontWeight: '800', marginTop: 6, fontSize: 16, color: '#111' },
  statDivider: { width: 1, height: 48, backgroundColor: '#eee', marginHorizontal: 12 },

  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  amountText: { color: '#f59a2a', fontWeight: '800', fontSize: 16 },
  percentText: { color: '#9b9b9b', fontSize: 13 },

  progressBar: { width: '100%', height: 8, backgroundColor: '#f0f0f0', borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#f59a2a' },

  infoTabs: { flexDirection: 'row', marginTop: 18, alignItems: 'center' },
  tabText: { marginRight: 18, color: '#9b9b9b' },
  tabActiveText: { marginRight: 18, color: '#f59a2a', borderBottomWidth: 2, borderBottomColor: '#f59a2a', paddingBottom: 6 },

  description: { marginTop: 12, color: '#444', lineHeight: 20 },

  supportSection: { marginTop: 20 },
  supportHeading: { fontWeight: '800', fontSize: 16 },
  supportCount: { backgroundColor: '#e9fbf0', color: '#2bb673', paddingHorizontal: 8, borderRadius: 12, fontWeight: '800', marginLeft: 8 },
  noSupport: { marginTop: 18, alignItems: 'center', paddingVertical: 20, borderRadius: 12 },

  donateBtn: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: '#f59a2a',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donateText: { color: '#fff', fontWeight: '800', fontSize: 18 },
});
