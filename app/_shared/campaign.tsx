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
  Dimensions,
  FlatList,
  Modal,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
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

  const currentSortLabel = CAMPAIGN_SORT_OPTIONS.find((s) => s.key === selectedSortKey)?.label || 'Sắp xếp';

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader showProfile={false} />
      <Loading visible={loading} message="Đang tải chiến dịch..." />

      <View style={styles.content}>
        <Text style={styles.title}>Chiến dịch nổi bật</Text>

        {/* Block filter: dòng 1 là trạng thái (scroll ngang), dòng 2 là danh mục */}
        <View style={styles.filterBlock}>
          {/* Row 1: trạng thái dạng thẻ ngang với màu sắc */}
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
                  style={[
                    styles.statusChip,
                    { backgroundColor: active ? tab.color : tab.bgColor, borderColor: tab.color },
                  ]}
                  onPress={() => handleSelectStatus(tab.key)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={active ? '#fff' : tab.color}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: active ? '#fff' : tab.color },
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
                  : 'Danh mục'}
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
            <Text style={styles.popupTitle}>Sắp xếp theo</Text>
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
            <Text style={styles.popupTitle}>Chọn danh mục</Text>
            <ScrollView>
              <TouchableOpacity
                style={[styles.popupItem, !categoryId && styles.popupItemActive]}
                onPress={() => {
                  setCategoryId(null);
                  setCategoryPopup(false);
                }}
              >
                <Text style={styles.popupItemTitle}>Tất cả danh mục</Text>
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
          contentContainerStyle={{ padding: moderateScale(14), paddingTop: moderateScale(8) }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  content: { flex: 1 },
  title: {
    fontSize: normalizeFontSize(20),
    fontWeight: '800',
    marginBottom: moderateScale(8),
    paddingHorizontal: '4%',
    marginTop: moderateScale(10),
  },

  // block filter: 2 dòng
  filterBlock: {
    paddingHorizontal: '4%',
    marginBottom: moderateScale(8),
  },

  // hàng status tags
  statusTabsRow: {
    paddingVertical: moderateScale(4),
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    marginRight: moderateScale(8),
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  statusChipText: {
    fontSize: normalizeFontSize(12),
    fontWeight: '700',
  },

  // Row 2: Sort + Category buttons
  filterRow2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginTop: moderateScale(8),
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#eee',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    gap: moderateScale(6),
    minHeight: moderateScale(36), // Ensure minimum touch target
  },
  filterBtnText: {
    color: '#ad4e28',
    fontWeight: '700',
    fontSize: normalizeFontSize(13),
  },

  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  popupBox: {
    position: 'absolute',
    top: '25%',
    left: '6%',
    right: '6%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    maxHeight: '60%',
  },
  popupTitle: {
    fontWeight: '800',
    fontSize: normalizeFontSize(17),
    color: '#ad4e28',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  popupItem: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(8),
    backgroundColor: '#f7f7f7',
    minHeight: moderateScale(44), // Ensure minimum touch target
  },
  popupItemActive: {
    backgroundColor: '#ffe3d1',
  },
  popupItemTitle: {
    fontWeight: '700',
    fontSize: normalizeFontSize(15),
    color: '#ad4e28',
    marginBottom: moderateScale(2),
  },
  popupItemDesc: {
    color: '#444',
    fontSize: normalizeFontSize(12),
  },
});
