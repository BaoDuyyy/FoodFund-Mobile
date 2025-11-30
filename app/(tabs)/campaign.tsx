import CampaignCard from '@/components/CampaignCard';
import Loading from '@/components/Loading';
import CampaignService from '@/services/campaignService';
import type { CampaignItem } from '@/types/api/campaign';
import { Feather, FontAwesome } from '@expo/vector-icons';
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

      {/* top-right modern icon buttons */}
      <View style={styles.topButtonsRight}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/search')}>
          <Feather name="search" size={22} color="#ad4e28" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/profile')}>
          <FontAwesome name="user-circle" size={22} color="#ad4e28" />
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
  // top-right modern icon buttons
  topButtonsRight: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#ad4e28',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f3f3',
  },

  content: { flex: 1, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8, paddingHorizontal: 16 },
});