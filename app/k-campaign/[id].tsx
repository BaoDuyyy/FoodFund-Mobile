import TimelineTabs from "@/components/TimelineTabs";
import CampaignService from "@/services/campaignService";
import ExpenseProofService from "@/services/expenseProofService";
import type { CampaignDetail } from "@/types/api/campaign";
import type { ExpenseProof } from "@/types/api/expenseProof";
import { useLocalSearchParams, useRouter } from "expo-router";
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

const PRIMARY = "#ad4e28";
const BG = "#f8f6f4";

export default function CampaignDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenseProofs, setExpenseProofs] = useState<ExpenseProof[]>([]);
  const [loadingExpenseProofs, setLoadingExpenseProofs] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function load() {
      try {
        const detail = await CampaignService.getCampaign(id as string);
        if (!mounted) return;
        setCampaign(detail);

        // load expense proofs gắn với campaignId = campaign.id
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

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerBg} />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Text style={styles.headerBackText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Chi tiết chiến dịch
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* BODY SCROLL */}
      <FlatList
        data={[] as any[]}
        renderItem={() => null}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* COVER CARD */}
            <View style={styles.coverCard}>
              {campaign.coverImage ? (
                <Image
                  source={{ uri: campaign.coverImage }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.coverImage, { backgroundColor: "#eee" }]} />
              )}

              <View style={styles.coverOverlay}>
                <Text style={styles.campaignTitle}>{campaign.title}</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{campaign.status}</Text>
                </View>
              </View>
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
                  <View
                    style={[styles.progressBarFill, { width: `${progress}%` }]}
                  />
                </View>

                <View style={styles.smallMetaRow}>
                  <Text style={styles.smallMetaLabel}>Lượt quyên góp</Text>
                  <Text style={styles.smallMetaValue}>
                    {campaign.donationCount || 0}
                  </Text>
                </View>
                <View style={styles.smallMetaRow}>
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
                  <Text style={styles.cardSubTitle}>Người tạo</Text>
                  <Text style={styles.highlightValue}>
                    {campaign.creator.full_name}
                  </Text>
                  <Text style={styles.cardDesc}>Nhà gây quỹ</Text>
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
              <TimelineTabs campaign={campaign}>
                {Array.isArray(campaign.phases) && campaign.phases.length > 0 ? (
                  campaign.phases.map((phase, idx) => (
                    <View key={phase.id || idx} style={styles.phaseBox}>
                      <Text style={styles.phaseTitle}>{phase.phaseName}</Text>

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
                        <Text style={styles.phaseValue}>{phase.status}</Text>
                      </View>

                      <View style={styles.phaseRow}>
                        <Text style={styles.phaseLabel}>Mua nguyên liệu</Text>
                        <Text style={styles.phaseValue}>
                          {phase.ingredientPurchaseDate
                            ? new Date(
                                phase.ingredientPurchaseDate
                              ).toLocaleString("vi-VN")
                            : "—"}
                        </Text>
                      </View>

                      <View style={styles.phaseRow}>
                        <Text style={styles.phaseLabel}>Nấu ăn</Text>
                        <Text style={styles.phaseValue}>
                          {phase.cookingDate
                            ? new Date(phase.cookingDate).toLocaleString("vi-VN")
                            : "—"}
                        </Text>
                      </View>

                      <View style={styles.phaseRow}>
                        <Text style={styles.phaseLabel}>Vận chuyển</Text>
                        <Text style={styles.phaseValue}>
                          {phase.deliveryDate
                            ? new Date(phase.deliveryDate).toLocaleString("vi-VN")
                            : "—"}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.desc}>Không có giai đoạn nào.</Text>
                )}
              </TimelineTabs>
            </View>

            {/* EXPENSE PROOFS SECTION */}
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
                    <Text style={styles.expenseProofTitle}>
                      Chứng từ #{idx + 1}
                    </Text>
                    <Text style={styles.expenseProofAmount}>
                      Số tiền: {Number(proof.amount || 0).toLocaleString("vi-VN")} đ
                    </Text>
                    <Text style={styles.expenseProofMeta}>
                      Trạng thái: {proof.status}
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
                            <Image
                              key={`${proof.id}-img-${i}`}
                              source={{ uri: url }}
                              style={styles.expenseProofImage}
                              resizeMode="cover"
                            />
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
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>Giải ngân</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            router.push({
              pathname: "/ingredientRequestForm",
              params: { phases: JSON.stringify(campaign.phases || []) },
            })
          }
        >
          <Text style={styles.primaryText}>Yêu cầu nguyên liệu</Text>
        </TouchableOpacity>
      </View>
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
    height: 110,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff2e8",
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
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 150,
  },

  // Cover card
  coverCard: {
    marginTop: 8,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  coverImage: {
    width: "100%",
    height: 190,
  },
  coverOverlay: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  campaignTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  statusPillText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "700",
  },

  // Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 8,
  },
  cardSubTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: "#666",
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
    color: "#222",
  },

  // Progress
  progressRow: {
    marginTop: 4,
  },
  progressNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 14,
    fontWeight: "700",
    color: PRIMARY,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "800",
    color: "#444",
  },
  progressBarBg: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#f3f3f3",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: PRIMARY,
  },
  smallMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  smallMetaLabel: {
    fontSize: 12,
    color: "#888",
  },
  smallMetaValue: {
    fontSize: 12,
    color: "#222",
    fontWeight: "600",
  },

  // Description text
  desc: {
    fontSize: 14,
    color: "#222",
    lineHeight: 20,
  },

  // Phases
  phaseBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 6,
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
    color: "#222",
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    backgroundColor: BG,
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  primaryBtn: {
    flex: 1.4,
    backgroundColor: PRIMARY,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  primaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  secondaryText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: "700",
  },

  loadingText: {
    textAlign: "center",
    marginTop: 16,
    color: "#555",
  },
  errorText: {
    textAlign: "center",
    marginTop: 40,
    color: "red",
    fontWeight: "600",
  },

  // Expense Proofs
  expenseProofBlock: {
    marginTop: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1e4dd",
  },
  expenseProofTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: PRIMARY,
    marginBottom: 2,
  },
  expenseProofAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222",
  },
  expenseProofMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 1,
  },
  expenseProofNote: {
    fontSize: 12,
    color: "#b45309",
    marginTop: 2,
  },
  expenseProofImagesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 6,
  },
  expenseProofImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
});
