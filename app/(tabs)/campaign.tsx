import CampaignCard from '@/components/CampaignCard';
import Loading from '@/components/Loading';
import CampaignService from '@/services/campaignService';
import type { CampaignItem } from '@/types/api/campaign';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomePage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await CampaignService.listCampaigns();
        if (mounted) setCampaigns(data);
      } catch (err: any) {
        console.warn('Load campaigns failed:', err?.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={loading} message="Loading campaigns..." />

      {/* top-left small round icon buttons */}
      <View style={styles.topButtons}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/search' as any)}>
          <Text style={styles.icon}>🔍</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/profile')}>
          <Text style={styles.icon}>👤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Chiến dịch nổi bật</Text>

        <FlatList
          data={campaigns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CampaignCard
              campaign={item}
              onPress={() => {
                router.push(`/campaign/${item.id}` as unknown as any);
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  // top-left icon buttons
  topButtons: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: { fontSize: 18 },

  content: { flex: 1, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8, paddingHorizontal: 16 },
});
