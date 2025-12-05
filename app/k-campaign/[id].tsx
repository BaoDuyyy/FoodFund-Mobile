import TimelineTabs from "@/components/TimelineTabs";
import CampaignService from "@/services/campaignService";
import ExpenseProofService from "@/services/expenseProofService";
import UserService from "@/services/userService";
import type { CampaignDetail } from "@/types/api/campaign";
import type { ExpenseProof } from "@/types/api/expenseProof";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHtml from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#ad4e28";     // màu brand của bạn
const BG = "#f3f4f8";

const TEXT = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const ACCENT_GREEN = "#16a34a";
const ACCENT_BLUE = "#2563eb";
const ACCENT_PURPLE = "#7c3aed";

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
        <ActivityIndicator color={PRIMARY} size="large" style={{ marginTop: 40 }} />
        <Text style={styles.loadingText}>Đang tải chiến dịch...</Text>
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

  const progress = Math.max(
    0,
    Math.min(100, Number(campaign.fundingProgress || 0))
  );

  const getStatusColor = () => {
    const s = (campaign.status || "").toLowerCase();
    if (s.includes("đang") || s.includes("active")) return ACCENT_BLUE;
    if (s.includes("hoàn") || s.includes("done")) return ACCENT_GREEN;
    if (s.includes("hủy") || s.includes("cancel")) return "#f97316";
    return PRIMARY;
  };

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
            <View style={styles.coverCard}>
              {campaign.coverImage ? (
                <Image
                  source={{ uri: campaign.coverImage }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.coverImage, { backgroundColor: "#e5e7eb" }]} />
              )}

              <View style={styles.coverOverlay}>
                <Text style={styles.campaignTitle}>{campaign.title}</Text>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: "#fff" },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor() },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: getStatusColor() },
                    ]}
                  >
                    {campaign.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* META CHIPS */}
            <View style={styles.metaChipsRow}>
              {campaign.category?.title && (
                <View style={[styles.metaChip, { backgroundColor: "#ecfdf3" }]}>
                  <View
                    style={[
                      styles.metaChipDot,
                      { backgroundColor: ACCENT_GREEN },
                    ]}
                  />
                  <Text style={styles.metaChipText}>
                    {campaign.category.title}
                  </Text>
                </View>
              )}
            </View>

            {/* PROGRESS CARD */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tiến độ gây quỹ</Text>

              <View style={styles.progressRow}>
                <View style={styles.progressNumbers}>
                  <Text style={styles.amountText}>
                    {campaign.receivedAmount} / {campaign.targetAmount} VND
                  </Text>
                  <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                </View>

                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>

                <View style={styles.progressMetaRow}>
                  <View style={styles.progressMetaItem}>
                    <Text style={styles.smallMetaLabel}>Lượt quyên góp</Text>
                    <Text style={styles.smallMetaValue}>
                      {campaign.donationCount || 0}
                    </Text>
                  </View>
                  <View style={styles.progressMetaItem}>
                    <Text style={styles.smallMetaLabel}>Thời gian gây quỹ</Text>
                    <Text style={styles.smallMetaValue}>
                      {campaign.fundraisingStartDate
                        ? new Date(
                            campaign.fundraisingStartDate
                          ).toLocaleDateString("vi-VN")
                        : "—"}{" "}
                      -{" "}
                      {campaign.fundraisingEndDate
                        ? new Date(
                            campaign.fundraisingEndDate
                          ).toLocaleDateString("vi-VN")
                        : "—"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* CATEGORY & CREATOR */}
            <View style={styles.horizontalCards}>
              {campaign.category && (
                <View style={[styles.card, styles.halfCard]}>
                  <Text style={styles.cardSubTitle}>Danh mục</Text>
                  <Text style={styles.highlightValue}>
                    {campaign.category.title}
                  </Text>
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
                Theo dõi các mốc mua nguyên liệu, nấu ăn và trao gửi để nhà tài
                trợ luôn được cập nhật.
              </Text>
              <TimelineTabs campaign={campaign}>
                {Array.isArray(campaign.phases) && campaign.phases.length > 0 ? (
                  campaign.phases.map((phase, idx) => (
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
                              ? new Date(
                                  phase.ingredientPurchaseDate
                                ).toLocaleString("vi-VN")
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
                              ? new Date(phase.deliveryDate).toLocaleString(
                                  "vi-VN"
                                )
                              : "—"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.desc}>Không có giai đoạn nào.</Text>
                )}
              </TimelineTabs>
            </View>

            {/* EXPENSE PROOFS */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Chứng từ chi tiêu</Text>

              {loadingExpenseProofs ? (
                <ActivityIndicator
                  color={PRIMARY}
                  size="small"
                  style={{ marginTop: 8 }}
                />
              ) : expenseProofs.length === 0 ? (
                <Text style={styles.desc}>
                  Chưa có chứng từ chi tiêu nào cho chiến dịch này.
                </Text>
              ) : (
                expenseProofs.map((proof, idx) => (
                  <View
                    key={proof.id || `${proof.requestId}-${idx}`}
                    style={styles.expenseProofBlock}
                  >
                    <View style={styles.expenseHeaderRow}>
                      <Text style={styles.expenseProofTitle}>
                        Chứng từ #{idx + 1}
                      </Text>
                      <Text style={styles.expenseStatus}>
                        {proof.status}
                      </Text>
                    </View>
                    <Text style={styles.expenseProofAmount}>
                      Số tiền:{" "}
                      {Number(proof.amount || 0).toLocaleString("vi-VN")} đ
                    </Text>
                    <Text style={styles.expenseProofMeta}>
                      Ngày tạo:{" "}
                      {proof.created_at
                        ? new Date(proof.created_at).toLocaleString("vi-VN")
                        : "—"}
                    </Text>

                    {Array.isArray(proof.media) && proof.media.length > 0 && (
                      <View style={styles.expenseProofImagesRow}>
                        {proof.media.map((url, i) => {
                          if (typeof url !== "string") return null;
                          const lower = url.toLowerCase();
                          const isImage =
                            lower.endsWith(".jpg") ||
                            lower.endsWith(".jpeg") ||
                            lower.endsWith(".png") ||
                            lower.includes("image");
                          if (!isImage) return null;

                          return (
                            <TouchableOpacity
                              key={`${proof.id}-img-${i}`}
                              activeOpacity={0.9}
                              onPress={() => setZoomImageUrl(url)}
                            >
                              <Image
                                source={{ uri: url }}
                                style={styles.expenseProofImage}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    {proof.adminNote ? (
                      <Text style={styles.expenseProofNote}>
                        Ghi chú: {proof.adminNote}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </View>
        }
      />

      {/* BOTTOM ACTION BAR */}
      {userRole === "KITCHEN_STAFF" ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() =>
              router.push({
                pathname: "/operationRequest",
                params: {
                  phases: JSON.stringify(
                    Array.isArray(campaign.phases)
                      ? campaign.phases.map((p) => ({
                          id: p.id,
                          phaseName: p.phaseName,
                          cookingFundsAmount: p.cookingFundsAmount,
                          deliveryFundsAmount: p.deliveryFundsAmount,
                        }))
                      : []
                  ),
                },
              })
            }
          >
            <Text style={styles.secondaryText}>Giải ngân</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              const phases = Array.isArray(campaign.phases)
                ? campaign.phases
                : [];
              let selectedPhaseId = "";
              let selectedPhaseName = "";

              if (phases.length > 0) {
                const now = new Date();
                const parseDate = (val: any) => {
                  if (!val) return null;
                  const d = new Date(val);
                  return isNaN(d.getTime()) ? null : d;
                };

                const futureOrToday = phases
                  .map((p) => ({
                    phase: p,
                    date: parseDate(p.ingredientPurchaseDate),
                  }))
                  .filter((x) => x.date && x.date >= now)
                  .sort((a, b) => a.date!.getTime() - b.date!.getTime());

                const chosen = futureOrToday[0]?.phase ?? phases[0];
                selectedPhaseId = chosen.id;
                selectedPhaseName = chosen.phaseName ?? "";
              }

              router.push({
                pathname: "/mealbatch",
                params: {
                  campaignId: campaign.id,
                  campaignPhaseId: selectedPhaseId,
                  campaignPhaseName: selectedPhaseName,
                },
              });
            }}
          >
            <Text style={styles.secondaryText}>Cập nhật suất ăn</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              const phases = Array.isArray(campaign.phases)
                ? campaign.phases
                : [];
              let selectedPhaseId = "";
              let selectedPhaseName = "";
              let ingredientFundsAmount: number | string | null = null;

              if (phases.length > 0) {
                const now = new Date();
                const parseDate = (val: any) => {
                  if (!val) return null;
                  const d = new Date(val);
                  return isNaN(d.getTime()) ? null : d;
                };

                const futureOrToday = phases
                  .map((p) => ({
                    phase: p,
                    date: parseDate(p.ingredientPurchaseDate),
                  }))
                  .filter((x) => x.date && x.date >= now)
                  .sort((a, b) => a.date!.getTime() - b.date!.getTime());

                const chosen = futureOrToday[0]?.phase ?? phases[0];
                selectedPhaseId = chosen.id;
                selectedPhaseName = chosen.phaseName ?? "";
                ingredientFundsAmount = chosen.ingredientFundsAmount ?? null;
              }

              router.push({
                pathname: "/ingredientRequestForm",
                params: {
                  phases: JSON.stringify(campaign.phases || []),
                  ingredientFundsAmount:
                    ingredientFundsAmount != null
                      ? String(ingredientFundsAmount)
                      : "",
                  campaignPhaseId: selectedPhaseId, // <--- add this param
                },
              });
            }}
          >
            <Text style={styles.primaryText}>Yêu cầu nguyên liệu</Text>
          </TouchableOpacity>
        </View>
      ) : userRole === "DELIVERY_STAFF" ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() =>
              router.push({
                pathname: "/operationRequest",
                params: {
                  phases: JSON.stringify(
                    Array.isArray(campaign.phases)
                      ? campaign.phases.map((p) => ({
                          id: p.id,
                          phaseName: p.phaseName,
                          cookingFundsAmount: p.cookingFundsAmount,
                          deliveryFundsAmount: p.deliveryFundsAmount,
                        }))
                      : []
                  ),
                },
              })
            }
          >
            <Text style={styles.secondaryText}>Giải ngân</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1.2 }]}
            onPress={() =>
              router.push({
                pathname: "/deliveryOrders",
                params: { campaignId: campaign.id },
              })
            }
          >
            <Text style={styles.primaryText}>Xem đơn giao hàng</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* IMAGE ZOOM OVERLAY FOR EXPENSE PROOFS */}
      {zoomImageUrl && (
        <View style={styles.zoomOverlay}>
          <TouchableOpacity
            style={styles.zoomBackdrop}
            activeOpacity={1}
            onPress={() => setZoomImageUrl(null)}
          />
          <View style={styles.zoomContent}>
            <Image
              source={{ uri: zoomImageUrl }}
              style={styles.zoomImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.zoomCloseBtn}
              onPress={() => setZoomImageUrl(null)}
            >
              <Text style={styles.zoomCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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

  // Cover
  coverCard: {
    marginTop: 4,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  coverImage: {
    width: "100%",
    height: 200,
  },
  coverOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    flexDirection: "row",
    alignItems: "center",
  },
  campaignTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
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
    fontSize: 11,
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
    fontSize: 15,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 6,
  },
  cardSubTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: MUTED,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
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

  // Progress
  progressRow: {
    marginTop: 4,
  },
  progressNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 6,
  },
  amountText: {
    fontSize: 14,
    fontWeight: "700",
    color: PRIMARY,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT,
  },
  progressBarBg: {
    height: 9,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: PRIMARY,
  },
  progressMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  progressMetaItem: {
    flex: 1,
  },
  smallMetaLabel: {
    fontSize: 11,
    color: MUTED,
  },
  smallMetaValue: {
    fontSize: 12,
    color: TEXT,
    fontWeight: "600",
    marginTop: 2,
  },

  desc: {
    fontSize: 14,
    color: TEXT,
    lineHeight: 20,
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

  // Bottom bar
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,          // ↓ bớt padding để không đụng mép/home indicator
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 6,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  primaryBtn: {
    flex: 1.4,
    backgroundColor: PRIMARY,
    borderRadius: 24,           // bớt “tròn như viên thuốc”
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,        // thấp hơn một chút
  },
  primaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  secondaryBtn: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  secondaryText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: "600",
  },

  loadingText: {
    textAlign: "center",
    marginTop: 16,
    color: MUTED,
  },
  errorText: {
    textAlign: "center",
    marginTop: 40,
    color: "#dc2626",
    fontWeight: "600",
  },

  // Expense proofs
  expenseProofBlock: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ffe7d6",
  },
  expenseHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expenseProofTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: PRIMARY,
  },
  expenseStatus: {
    fontSize: 11,
    fontWeight: "600",
    color: ACCENT_BLUE,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#dbeafe",
  },
  expenseProofAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT,
    marginTop: 2,
  },
  expenseProofMeta: {
    fontSize: 12,
    color: MUTED,
    marginTop: 1,
  },
  expenseProofNote: {
    fontSize: 12,
    color: "#b45309",
    marginTop: 4,
  },
  expenseProofImagesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 6,
  },
  expenseProofImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
  },

  // zoom overlay reused for chứng từ chi tiêu
  zoomOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
  },
  zoomBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  zoomContent: {
    width: "90%",
    height: "70%",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    backgroundColor: "#000",
  },
  zoomCloseBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  zoomCloseText: {
    color: PRIMARY,
    fontWeight: "700",
  },
});
