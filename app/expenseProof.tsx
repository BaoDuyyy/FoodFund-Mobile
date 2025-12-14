import AlertPopup from "@/components/AlertPopup";
import { BG_KITCHEN as BG, PRIMARY } from "@/constants/colors";
import ExpenseProofService, {
  ExpenseProofFileType,
  ExpenseProofUploadUrl,
} from "@/services/expenseProofService";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Helpers cho tiền VND */
const digitsOnly = (value: string) => value.replace(/\D/g, "");

const formatVnd = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  const str = typeof value === "number" ? String(value) : value;
  const digits = digitsOnly(str);
  if (!digits) return "";
  const n = Number(digits);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("vi-VN");
};

type SelectedFile = {
  uri: string;
  type: ExpenseProofFileType;
  name: string;
};

export default function ExpenseProofPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string; totalCost?: string }>();

  const requestId = useMemo(
    () => (Array.isArray(params.requestId) ? params.requestId[0] : params.requestId),
    [params.requestId]
  );

  const expectedTotalCost = useMemo(() => {
    const raw = Array.isArray(params.totalCost)
      ? params.totalCost[0]
      : params.totalCost;
    const n = Number(digitsOnly(raw || ""));
    return Number.isNaN(n) ? 0 : n;
  }, [params.totalCost]);

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [amount, setAmount] = useState<string>(""); // lưu dạng "80000"
  const [submitting, setSubmitting] = useState(false);
  const [uploadUrls, setUploadUrls] = useState<ExpenseProofUploadUrl[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Detect type từ file name / uri
  const detectTypeFromUri = (uri: string): ExpenseProofFileType => {
    const lower = uri.toLowerCase();
    if (lower.endsWith(".png")) return "png";
    if (lower.endsWith(".mp4")) return "mp4";
    return "jpg";
  };

  const mapAssetsToFiles = (
    assets: ImagePicker.ImagePickerAsset[]
  ): SelectedFile[] =>
    assets.map((asset) => ({
      uri: asset.uri,
      type: detectTypeFromUri(asset.fileName || asset.uri),
      name: asset.fileName || asset.uri.split("/").pop() || "file",
    }));

  // Chọn file từ camera hoặc thư viện (ảnh/video)
  const handlePickMedia = async () => {
    try {
      Alert.alert("Thêm chứng từ", "Chọn nguồn hình ảnh / video", [
        {
          text: "Chụp từ camera",
          onPress: async () => {
            try {
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if (!perm.granted) {
                Alert.alert(
                  "Quyền truy cập",
                  "Ứng dụng cần quyền sử dụng camera."
                );
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                quality: 0.8,
              });

              if (result.canceled || !result.assets?.length) return;

              const files = mapAssetsToFiles(result.assets);
              // ghép vào danh sách hiện tại, giới hạn tối đa 5
              setSelectedFiles((prev) => [...prev, ...files].slice(0, 5));
            } catch (err: any) {
              console.error("camera error:", err);
              Alert.alert("Lỗi", "Không chụp được ảnh/video, vui lòng thử lại.");
            }
          },
        },
        {
          text: "Chọn từ thư viện",
          onPress: async () => {
            try {
              const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!perm.granted) {
                Alert.alert(
                  "Quyền truy cập",
                  "Ứng dụng cần quyền truy cập thư viện để chọn file."
                );
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsMultipleSelection: true,
                quality: 0.8,
              });

              if (result.canceled || !result.assets) return;

              const assets = result.assets.slice(0, 5); // tối đa 5 file
              const detectedFiles = mapAssetsToFiles(assets);
              setSelectedFiles(detectedFiles);
            } catch (err: any) {
              console.error("pick files error:", err);
              Alert.alert("Lỗi", "Không chọn được file, vui lòng thử lại.");
            }
          },
        },
        { text: "Hủy", style: "cancel" },
      ]);
    } catch (err: any) {
      console.error("pick media error:", err);
      Alert.alert("Lỗi", "Không thể mở lựa chọn file, vui lòng thử lại.");
    }
  };

  // Upload 1 file lên signed URL (DigitalOcean Spaces / S3 compatible)
  const uploadSingleFile = async (
    uploadUrl: string,
    localUri: string,
    type: ExpenseProofFileType
  ) => {
    const contentTypeMap: Record<ExpenseProofFileType, string> = {
      jpg: "image/jpeg",
      png: "image/png",
      mp4: "video/mp4",
    };

    const res = await fetch(localUri);
    const blob = await res.blob();

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentTypeMap[type] || "application/octet-stream",
        "x-amz-acl": "public-read",
      },
      body: blob,
    });

    if (!putRes.ok) {
      const text = await putRes.text().catch(() => "");
      throw new Error(`Upload failed (${putRes.status}): ${text}`);
    }
  };

  // Flow đầy đủ: generate URL -> upload file -> createExpenseProof
  const handleUploadAndCreate = async () => {
    if (!requestId) {
      showAlert("Thiếu requestId, vui lòng quay lại và chọn yêu cầu.");
      return;
    }

    const amountNumber = amount ? Number(digitsOnly(amount)) : 0;
    if (!amountNumber) {
      showAlert("Vui lòng nhập số tiền chi tiêu.");
      return;
    }
    if (selectedFiles.length === 0) {
      showAlert("Vui lòng chọn ít nhất 1 file cần upload.");
      return;
    }

    const n = selectedFiles.length;
    const types = selectedFiles.map((f) => f.type);

    setSubmitting(true);
    try {
      const urls = await ExpenseProofService.generateExpenseProofUploadUrls({
        requestId,
        fileCount: n,
        fileTypes: types,
      });
      setUploadUrls(urls);

      if (urls.length !== n) {
        throw new Error("Số lượng uploadUrls trả về không khớp với số file đã chọn.");
      }

      for (let i = 0; i < n; i++) {
        const u = urls[i];
        const f = selectedFiles[i];
        await uploadSingleFile(u.uploadUrl, f.uri, types[i]);
      }

      const fileKeys = urls.map((u) => u.fileKey);
      await ExpenseProofService.createExpenseProof({
        requestId,
        mediaFileKeys: fileKeys,
        amount: amount,              // ✅ dùng string "80000"
        // hoặc amount: digitsOnly(amount) nếu muốn chắc chắn
      });

      Alert.alert("Thành công", "Đã tạo chứng từ chi tiêu.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error("handleUploadAndCreate error:", err);
      showAlert(err?.message || "Không upload được file / tạo chứng từ.");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <AlertPopup
        visible={alertVisible}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
      {/* Header */}
      <View style={styles.headerBg} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Chứng từ chi tiêu</Text>
        <Text style={styles.subtitle}>
          Chọn ảnh / video hóa đơn, hệ thống sẽ tự upload và tạo chứng từ.
        </Text>
        {requestId ? (
          <Text style={styles.requestInfo}>
            Request ID: <Text style={styles.requestInfoBold}>{requestId}</Text>
          </Text>
        ) : (
          <Text style={styles.requestInfoError}>
            Không tìm thấy requestId trong URL.
          </Text>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Upload chứng từ */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Upload chứng từ</Text>

          {expectedTotalCost > 0 && (
            <View style={styles.expectedBox}>
              <Text style={styles.expectedLabel}>Tổng chi phí dự kiến</Text>
              <Text style={styles.expectedValue}>
                {formatVnd(expectedTotalCost)} VND
              </Text>
              <Text style={styles.expectedHint}>
                Số tiền chi tiêu thực tế nên gần bằng hoặc bằng tổng chi phí dự
                kiến này.
              </Text>
            </View>
          )}

          <Text style={styles.label}>Số tiền chi tiêu (VND)</Text>
          <TextInput
            style={styles.inputFull}
            keyboardType="numeric"
            placeholder="Ví dụ: 9.000.000"
            value={formatVnd(amount)}
            onChangeText={(t) => setAmount(digitsOnly(t))}
          />

          <Text style={[styles.label, { marginTop: 14 }]}>File chứng từ</Text>
          <TouchableOpacity style={styles.pickBtn} onPress={handlePickMedia}>
            <Text style={styles.pickBtnText}>
              Chụp ảnh / Chọn ảnh, video từ thiết bị
            </Text>
          </TouchableOpacity>

          {selectedFiles.length > 0 ? (
            <View style={{ marginTop: 10 }}>
              {selectedFiles.map((f, idx) => (
                <View key={idx} style={styles.fileChip}>
                  <Text style={styles.fileChipIndex}>#{idx + 1}</Text>
                  <Text style={styles.fileChipName} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <Text style={styles.fileChipType}>
                    {f.type.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noFileText}>Chưa chọn file nào.</Text>
          )}

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: submitting ? "#d08863" : PRIMARY },
            ]}
            onPress={handleUploadAndCreate}
            disabled={submitting || !requestId}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>Upload & tạo chứng từ</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // layout
  container: { flex: 1, backgroundColor: BG },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 26,
  },

  // header
  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  backIcon: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginRight: 4,
  },
  backText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#ffe8d4",
    marginTop: 4,
  },
  requestInfo: {
    marginTop: 4,
    fontSize: 13,
    color: "#ffead0",
  },
  requestInfoBold: {
    fontWeight: "700",
  },
  requestInfoError: {
    marginTop: 4,
    fontSize: 13,
    color: "#ffd1d1",
  },

  // card
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 17,
    color: PRIMARY,
    marginBottom: 10,
  },

  label: {
    fontSize: 14,
    color: "#444",
    fontWeight: "600",
  },
  inputFull: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#222",
  },

  // upload
  pickBtn: {
    marginTop: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PRIMARY,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  pickBtnText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 15,
  },
  noFileText: {
    marginTop: 8,
    fontSize: 13,
    color: "#888",
  },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7ed",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 6,
  },
  fileChipIndex: {
    fontWeight: "700",
    color: PRIMARY,
    marginRight: 8,
    fontSize: 14,
  },
  fileChipName: {
    flex: 1,
    fontSize: 13,
    color: "#222",
  },
  fileChipType: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY,
  },

  actionBtn: {
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  // debug urls
  noteText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  urlItem: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1e4dd",
  },
  urlIndex: {
    fontSize: 14,
    fontWeight: "700",
    color: PRIMARY,
  },
  urlMeta: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  urlLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  urlValue: {
    fontSize: 13,
    color: "#222",
  },

  expectedBox: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
  },
  expectedLabel: {
    fontSize: 13,
    color: "#b45309",
    fontWeight: "600",
  },
  expectedValue: {
    marginTop: 4,
    fontSize: 16,
    color: PRIMARY,
    fontWeight: "800",
  },
  expectedHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#6b7280",
  },
});
