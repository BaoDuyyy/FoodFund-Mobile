import AppHeader from '@/components/AppHeader';
import CampaignCard from '@/components/CampaignCard';
import Loading from '@/components/Loading';
import {
  CAMPAIGN_SORT_OPTIONS,
  CAMPAIGN_STATUS_OPTIONS,
  DEFAULT_SORT,
  DEFAULT_STATUS,
  type CampaignSortKey,
  type CampaignStatusKey,
  type StatusOption
} from '@/constants/campaignFilters';
import CampaignService from '@/services/campaignService';
import CategoryService from '@/services/categoryService';
import type { CampaignItem } from '@/types/api/campaign';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomePage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [statusTabs, setStatusTabs] = useState<StatusOption[]>(CAMPAIGN_STATUS_OPTIONS);
  const [selectedStatusKey, setSelectedStatusKey] = useState<CampaignStatusKey>(DEFAULT_STATUS);

  // Sort state
  const [selectedSortKey, setSelectedSortKey] = useState<CampaignSortKey>(DEFAULT_SORT);
  const [sortPopup, setSortPopup] = useState(false);

  // Category state
  const [categories, setCategories] = useState<
    { id: string; title: string; description?: string }[]
  >([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryPopup, setCategoryPopup] = useState(false);

  // Load categories
  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      try {
        const data = await CategoryService.listCategories();
        if (mounted) {
          setCategories(
            data.map((c) => ({
              id: c.id,
              title: c.title,
              description: c.description,
            })),
          );
        }
      } catch {
        // ignore
      }
    }
    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  // Load campaigns theo filter
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const current = statusTabs.find((t) => t.key === selectedStatusKey) || CAMPAIGN_STATUS_OPTIONS[0];
        const statusFilter =
          current.backendStatus === null ? null : [current.backendStatus];

        const data = await CampaignService.listCampaigns({
          filter: {
            status: statusFilter as any,
            creatorId: null,
            categoryId: categoryId || null,
          },
          search: '',
          sortBy: selectedSortKey,
          limit: 10,
          offset: 0,
        });
        if (mounted) setCampaigns(data);
      } catch (err: any) {
        console.warn('Load campaigns failed:', err?.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [selectedStatusKey, selectedSortKey, categoryId, statusTabs]);

  const handleSelectStatus = (key: CampaignStatusKey) => {
    setSelectedStatusKey(key);
    setStatusTabs((prev) => {
      const idx = prev.findIndex((t) => t.key === key);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.unshift(item);
      return copy;
    });
  };

  const handleSelectSort = (key: CampaignSortKey) => {
    setSelectedSortKey(key);
    setSortPopup(false);
  };

  const currentSortLabel = CAMPAIGN_SORT_OPTIONS.find((s) => s.key === selectedSortKey)?.label || 'Sort';

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader showProfile={false} />
      <Loading visible={loading} message="Loading campaigns..." />

      <View style={styles.content}>
        <Text style={styles.title}>Chiến dịch nổi bật</Text>

        {/* Block filter: dòng 1 là trạng thái (scroll ngang), dòng 2 là danh mục */}
        <View style={styles.filterBlock}>
          {/* Row 1: trạng thái dạng thẻ ngang */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusTabsRow}
          >
            {statusTabs.map((tab) => {
              const active = tab.key === selectedStatusKey;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.statusChip, active && styles.statusChipActive]}
                  onPress={() => handleSelectStatus(tab.key)}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      active && styles.statusChipTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Row 2: Sort + Category buttons */}
          <View style={styles.filterRow2}>
            {/* Sort Dropdown */}
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setSortPopup(true)}
            >
              <Text style={styles.filterBtnText} numberOfLines={1}>
                {currentSortLabel}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#ad4e28" />
            </TouchableOpacity>

            {/* Category Dropdown */}
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setCategoryPopup(true)}
            >
              <Text
                style={styles.filterBtnText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {categoryId
                  ? categories.find((c) => c.id === categoryId)?.title || 'Category'
                  : 'Category'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#ad4e28" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sort Popup */}
        <Modal visible={sortPopup} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setSortPopup(false)}>
            <View style={styles.popupOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.popupBox}>
            <Text style={styles.popupTitle}>Sort By</Text>
            <ScrollView>
              {CAMPAIGN_SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.popupItem,
                    selectedSortKey === option.key && styles.popupItemActive,
                  ]}
                  onPress={() => handleSelectSort(option.key)}
                >
                  <Text style={styles.popupItemTitle}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>

        {/* Category Popup */}
        <Modal visible={categoryPopup} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setCategoryPopup(false)}>
            <View style={styles.popupOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.popupBox}>
            <Text style={styles.popupTitle}>Select Category</Text>
            <ScrollView>
              <TouchableOpacity
                style={[styles.popupItem, !categoryId && styles.popupItemActive]}
                onPress={() => {
                  setCategoryId(null);
                  setCategoryPopup(false);
                }}
              >
                <Text style={styles.popupItemTitle}>All Categories</Text>
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.popupItem,
                    categoryId === c.id && styles.popupItemActive,
                  ]}
                  onPress={() => {
                    setCategoryId(c.id);
                    setCategoryPopup(false);
                  }}
                >
                  <Text style={styles.popupItemTitle}>{c.title}</Text>
                  {c.description ? (
                    <Text style={styles.popupItemDesc}>{c.description}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>

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
          )
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  content: { flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },

  // block filter: 2 dòng
  filterBlock: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  // hàng status tags
  statusTabsRow: {
    paddingVertical: 4,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f7f7f7',
    marginRight: 8,
  },
  statusChipActive: {
    backgroundColor: '#ad4e28',
    borderColor: '#ad4e28',
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ad4e28',
  },
  statusChipTextActive: {
    color: '#fff',
  },

  // Row 2: Sort + Category buttons
  filterRow2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  filterBtnText: {
    color: '#ad4e28',
    fontWeight: '700',
    fontSize: 14,
  },

  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  popupBox: {
    position: 'absolute',
    top: '25%',
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    maxHeight: '60%',
  },
  popupTitle: {
    fontWeight: '800',
    fontSize: 18,
    color: '#ad4e28',
    marginBottom: 12,
    textAlign: 'center',
  },
  popupItem: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f7f7f7',
  },
  popupItemActive: {
    backgroundColor: '#ffe3d1',
  },
  popupItemTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#ad4e28',
    marginBottom: 2,
  },
  popupItemDesc: {
    color: '#444',
    fontSize: 13,
  },
});
