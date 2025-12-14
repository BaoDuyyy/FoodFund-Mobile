import {
  CampaignCoverCard,
  DeliveryBottomBar,
  ExpenseProofCard,
  FundingProgressCard,
  ImageZoomOverlay,
  KitchenWorkflowCard,
} from "@/components/k-campaign";
import Loading from "@/components/Loading";
import TimelineTabs from "@/components/TimelineTabs";
import {
  INFO as ACCENT_BLUE,
  SUCCESS as ACCENT_GREEN,
  BG_KITCHEN as BG,
  BORDER,
  MUTED_TEXT as MUTED,
  PRIMARY,
  STRONG_TEXT as TEXT
} from "@/constants/colors";
import CampaignService from "@/services/campaignService";
import ExpenseProofService from "@/services/expenseProofService";
import UserService from "@/services/userService";
import type { CampaignDetail } from "@/types/api/campaign";
import type { ExpenseProof } from "@/types/api/expenseProof";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHtml from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";

type UserRole = "KITCHEN_STAFF" | "DELIVERY_STAFF" | string;

// Map phase status code -> Vietnamese label
const phaseStatusLabels: Record<string, string> = {
  PLANNING: "Đang lên kế hoạch",
  AWAITING_INGREDIENT_DISBURSEMENT: "Chờ giải ngân nguyên liệu",
  INGREDIENT_PURCHASE: "Đang mua nguyên liệu",
  AWAITING_AUDIT: "Chờ kiểm tra chứng từ",
  AWAITING_COOKING_DISBURSEMENT: "Chờ giải ngân chi phí nấu ăn",
  COOKING: "Đang nấu ăn",
  AWAITING_DELIVERY_DISBURSEMENT: "Chờ giải ngân chi phí vận chuyển",
  DELIVERY: "Đang vận chuyển",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  FAILED: "Thất bại",
  NULL: "Chưa xác định",
  DEFAULT: "Không xác định",
};

function getPhaseStatusLabel(status?: string | null): string {
  if (!status) return "Không xác định";
  const key = status.toUpperCase().trim();
  return phaseStatusLabels[key] || "Không xác định";
}

export default function CampaignDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenseProofs, setExpenseProofs] = useState<ExpenseProof[]>([]);
  const [loadingExpenseProofs, setLoadingExpenseProofs] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const { width } = useWindowDimensions();
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function load() {
      try {
        // campaign
        const detail = await CampaignService.getCampaign(id as string);
        if (!mounted) return;
        setCampaign(detail);

        // expense proofs
        if (detail?.id) {
          setLoadingExpenseProofs(true);
          try {
            const proofs = await ExpenseProofService.getExpenseProofs({
              filter: {
                campaignId: detail.id,
                campaignPhaseId: null,
                requestId: null,
                status: null,
              },
              limit: 5,
              offset: 0,
            });
            if (mounted) setExpenseProofs(proofs || []);
          } catch (err) {
            console.error("Error loading expense proofs:", err);
          } finally {
            if (mounted) setLoadingExpenseProofs(false);
          }
        }

        // user role
        try {
          let role: UserRole | null = null;
          const roleFromStore = await SecureStore.getItemAsync("userRole");
          if (roleFromStore) {
            role = roleFromStore as UserRole;
          }
          if (!role) {
            const me = await UserService.getMyProfile();
            role = (me as any)?.role || null;
          }
          if (mounted) {
            setUserRole(role);
            console.log("CampaignDetail userRole =", role);
          }
        } catch (err) {
          console.error("Error loading user role:", err);
        }
      } catch (err) {
        console.error("Error loading campaign detail:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading visible={loading} message="Đang tải chiến dịch..." />
      </SafeAreaView>
    );
  }

  if (!campaign) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy chiến dịch</Text>
      </SafeAreaView>
    );
  }

  const phases = Array.isArray(campaign.phases) ? campaign.phases : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER GRADIENT FAKE */}
      <View style={styles.headerBg} />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Text style={styles.headerBackText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Chi tiết chiến dịch
          </Text>
          <Text style={styles.headerSubtitle}>Minh bạch – Nhân ái – Kết nối</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* BODY */}
      <FlatList
        data={[] as any[]}
        renderItem={() => null}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* COVER */}
            <CampaignCoverCard
              coverImage={campaign.coverImage}
              title={campaign.title}
              status={campaign.status}
            />

            {/* META CHIPS */}
            {campaign.category?.title && (
              <View style={styles.metaChipsRow}>
                <View style={[styles.metaChip, { backgroundColor: "#ecfdf3" }]}>
                  <View
                    style={[styles.metaChipDot, { backgroundColor: ACCENT_GREEN }]}
                  />
                  <Text style={styles.metaChipText}>{campaign.category.title}</Text>
                </View>
              </View>
            )}

            {/* WORKFLOW CARD FOR KITCHEN STAFF */}
            {userRole === "KITCHEN_STAFF" && (
              <KitchenWorkflowCard campaignId={campaign.id} phases={phases} />
            )}

            {/* PROGRESS CARD */}
            <FundingProgressCard
              receivedAmount={campaign.receivedAmount}
              targetAmount={campaign.targetAmount}
              fundingProgress={campaign.fundingProgress}
              donationCount={campaign.donationCount}
              fundraisingStartDate={campaign.fundraisingStartDate}
              fundraisingEndDate={campaign.fundraisingEndDate}
            />

            {/* CATEGORY & CREATOR */}
            <View style={styles.horizontalCards}>
              {campaign.category && (
                <View style={[styles.card, styles.halfCard]}>
                  <Text style={styles.cardSubTitle}>Danh mục</Text>
                  <Text style={styles.highlightValue}>{campaign.category.title}</Text>
                  {!!campaign.category.description && (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {campaign.category.description}
                    </Text>
                  )}
                </View>
              )}

              {campaign.creator && (
                <View style={[styles.card, styles.halfCard]}>
                  <Text style={styles.cardSubTitle}>Người tạo chiến dịch</Text>
                  <Text style={styles.highlightValue}>
                    {campaign.creator.full_name}
                  </Text>
                  <Text style={[styles.cardDesc, { color: ACCENT_BLUE }]}>
                    Nhà gây quỹ / Bếp thiện nguyện
                  </Text>
                </View>
              )}
            </View>

            {/* DESCRIPTION */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Mô tả chiến dịch</Text>
              {campaign.description ? (
                <RenderHtml
                  contentWidth={width - 48}
                  source={{ html: campaign.description }}
                  baseStyle={styles.desc}
                />
              ) : (
                <Text style={styles.desc}>Không có mô tả</Text>
              )}
            </View>

            {/* PHASES + TIMELINE */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Kế hoạch thực hiện</Text>
              <Text style={styles.cardDesc}>
                Theo dõi các mốc mua nguyên liệu, nấu ăn và trao gửi để nhà tài trợ
                luôn được cập nhật.
              </Text>
              <TimelineTabs campaign={campaign}>
                {phases.length > 0 ? (
                  phases.map((phase, idx) => (
                    <View key={phase.id || idx} style={styles.phaseBox}>
                      <View style={styles.phaseHeaderRow}>
                        <View style={styles.phaseIndexCircle}>
                          <Text style={styles.phaseIndexText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.phaseTitle}>{phase.phaseName}</Text>
                      </View>

                      <View style={styles.phaseRow}>
                        <Text style={styles.phaseLabel}>Địa điểm</Text>
                        <Text style={styles.phaseValue}>{phase.location}</Text>
                      </View>

                      <View style={styles.phaseRow}>
                        <Text style={styles.phaseLabel}>Ngân sách</Text>
                        <Text style={styles.phaseValue}>
                          Nguyên liệu {phase.ingredientBudgetPercentage}% (
                          {phase.ingredientFundsAmount} VND){"\n"}
                          Nấu ăn {phase.cookingBudgetPercentage}% (
                          {phase.cookingFundsAmount} VND){"\n"}
                          Vận chuyển {phase.deliveryBudgetPercentage}% (
                          {phase.deliveryFundsAmount} VND)
                        </Text>
                      </View>

                      <View style={styles.phaseRow}>
                        <Text style={styles.phaseLabel}>Trạng thái</Text>
                        <Text style={styles.phaseValue}>
                          {getPhaseStatusLabel(phase.status)}
                        </Text>
                      </View>

                      <View style={styles.phaseDatesRow}>
                        <View style={styles.phaseDateItem}>
                          <Text style={styles.phaseDateLabel}>Mua nguyên liệu</Text>
                          <Text style={styles.phaseDateValue}>
                            {phase.ingredientPurchaseDate
                              ? new Date(phase.ingredientPurchaseDate).toLocaleString(
                                "vi-VN"
                              )
                              : "—"}
                          </Text>
                        </View>
                        <View style={styles.phaseDateItem}>
                          <Text style={styles.phaseDateLabel}>Nấu ăn</Text>
                          <Text style={styles.phaseDateValue}>
                            {phase.cookingDate
                              ? new Date(phase.cookingDate).toLocaleString("vi-VN")
                              : "—"}
                          </Text>
                        </View>
                        <View style={styles.phaseDateItem}>
                          <Text style={styles.phaseDateLabel}>Vận chuyển</Text>
                          <Text style={styles.phaseDateValue}>
                            {phase.deliveryDate
                              ? new Date(phase.deliveryDate).toLocaleString("vi-VN")
                              : "—"}
                          </Text>
                        </View>
                      </View>

                      {/* Planned Meals */}
                      {Array.isArray(phase.plannedMeals) && phase.plannedMeals.length > 0 && (
                        <View style={styles.plannedMealsSection}>
                          <Text style={styles.plannedMealsSectionTitle}>
                            Suất ăn dự kiến ({phase.plannedMeals.length} món)
                          </Text>
                          {phase.plannedMeals.map((meal, mealIdx) => (
                            <View key={meal.id || mealIdx} style={styles.plannedMealItem}>
                              <View style={styles.plannedMealDot} />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.plannedMealName}>{meal.name}</Text>
                                <Text style={styles.plannedMealQty}>
                                  {meal.quantity} suất
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.desc}>Không có giai đoạn nào.</Text>
                )}
              </TimelineTabs>
            </View>

            {/* EXPENSE PROOFS */}
            <ExpenseProofCard
              expenseProofs={expenseProofs}
              loading={loadingExpenseProofs}
              onImagePress={setZoomImageUrl}
            />
          </View>
        }
      />

      {/* BOTTOM ACTION BAR - Only for Delivery Staff */}
      {userRole === "DELIVERY_STAFF" && (
        <DeliveryBottomBar campaignId={campaign.id} phases={phases} />
      )}

      {/* IMAGE ZOOM OVERLAY FOR EXPENSE PROOFS */}
      <ImageZoomOverlay
        imageUrl={zoomImageUrl}
        onClose={() => setZoomImageUrl(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: PRIMARY,
    opacity: 0.95,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffe4d5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackText: {
    color: PRIMARY,
    fontSize: 20,
    fontWeight: "800",
    marginTop: -2,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  headerSubtitle: {
    color: "#fed7aa",
    fontSize: 11,
    marginLeft: 12,
    marginTop: 2,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 150,
  },

  metaChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  metaChipText: {
    fontSize: 13,
    color: MUTED,
  },

  // Card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 8,
  },
  cardSubTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: MUTED,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 14,
    color: MUTED,
    marginTop: 4,
  },

  horizontalCards: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  halfCard: {
    flex: 1,
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
  },

  desc: {
    fontSize: 15,
    color: TEXT,
    lineHeight: 22,
  },

  // Phases
  phaseBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  phaseHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  phaseIndexCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ffedd5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  phaseIndexText: {
    fontSize: 11,
    fontWeight: "700",
    color: PRIMARY,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: PRIMARY,
  },
  phaseRow: {
    marginBottom: 4,
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#b45309",
  },
  phaseValue: {
    fontSize: 13,
    color: TEXT,
  },
  phaseDatesRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  phaseDateItem: {
    flex: 1,
    padding: 6,
    borderRadius: 10,
    backgroundColor: "#fefce8",
  },
  phaseDateLabel: {
    fontSize: 11,
    color: "#854d0e",
    fontWeight: "600",
  },
  phaseDateValue: {
    fontSize: 12,
    color: TEXT,
    marginTop: 2,
  },

  errorText: {
    textAlign: "center",
    marginTop: 40,
    color: "#dc2626",
    fontWeight: "600",
  },

  // Planned Meals styles
  plannedMealsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#fde68a",
  },
  plannedMealsSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY,
    marginBottom: 8,
  },
  plannedMealItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  plannedMealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT_GREEN,
    marginRight: 10,
  },
  plannedMealName: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
  },
  plannedMealQty: {
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },
});
