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

const PRIMARY = "#ad4e28";
const BG = "#f8f6f4";

type SelectedFile = {
  uri: string;
  type: ExpenseProofFileType;
  name: string;
};

export default function ExpenseProofPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = useMemo(
    () => (Array.isArray(params.requestId) ? params.requestId[0] : params.requestId),
    [params.requestId]
  );

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadUrls, setUploadUrls] = useState<ExpenseProofUploadUrl[]>([]);

  // Detect type từ file name / uri
  const detectTypeFromUri = (uri: string): ExpenseProofFileType => {
    const lower = uri.toLowerCase();
    if (lower.endsWith(".png")) return "png";
    if (lower.endsWith(".mp4")) return "mp4";
    return "jpg";
  };

  // Chọn file từ thư viện (ảnh/video)
  const handlePickFiles = async () => {
    try {
      // xin quyền (optional nhưng nice-to-have)
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Quyền truy cập", "Ứng dụng cần quyền truy cập thư viện để chọn file.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      const assets = result.assets.slice(0, 5); // tối đa 5 file
      const detectedFiles: SelectedFile[] = assets.map(
        (asset: ImagePicker.ImagePickerAsset) => ({
          uri: asset.uri,
          type: detectTypeFromUri(asset.fileName || asset.uri),
          name: asset.fileName || asset.uri.split("/").pop() || "file",
        })
      );

      setSelectedFiles(detectedFiles);
    } catch (err: any) {
      console.error("pick files error:", err);
      Alert.alert("Lỗi", "Không chọn được file, vui lòng thử lại.");
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
      Alert.alert("Lỗi", "Thiếu requestId, vui lòng quay lại và chọn yêu cầu.");
      return;
    }
    if (!amount) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền chi tiêu.");
      return;
    }
    if (selectedFiles.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất 1 file cần upload.");
      return;
    }

    const n = selectedFiles.length;
    const types = selectedFiles.map((f) => f.type);

    setSubmitting(true);
    try {
      // 1. Generate upload URLs
      const urls = await ExpenseProofService.generateExpenseProofUploadUrls({
        requestId,
        fileCount: n,
        fileTypes: types,
      });
      setUploadUrls(urls);

      if (urls.length !== n) {
        throw new Error("Số lượng uploadUrls trả về không khớp với số file đã chọn.");
      }

      // 2. Upload từng file
      for (let i = 0; i < n; i++) {
        const u = urls[i];
        const f = selectedFiles[i];
        await uploadSingleFile(u.uploadUrl, f.uri, types[i]);
      }

      // 3. Gọi createExpenseProof
      const fileKeys = urls.map((u) => u.fileKey);
      await ExpenseProofService.createExpenseProof({
        requestId,
        mediaFileKeys: fileKeys,
        amount,
      });

      Alert.alert("Thành công", "Đã tạo chứng từ chi tiêu.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      console.error("handleUploadAndCreate error:", err);
      Alert.alert("Lỗi", err?.message || "Không upload được file / tạo chứng từ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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

          <Text style={styles.label}>Số tiền chi tiêu (VND)</Text>
          <TextInput
            style={styles.inputFull}
            keyboardType="numeric"
            placeholder="Ví dụ: 9000000"
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ""))}
          />

          <Text style={[styles.label, { marginTop: 10 }]}>File chứng từ</Text>
          <TouchableOpacity style={styles.pickBtn} onPress={handlePickFiles}>
            <Text style={styles.pickBtnText}>Chọn ảnh / video từ thiết bị</Text>
          </TouchableOpacity>

          {selectedFiles.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              {selectedFiles.map((f, idx) => (
                <View key={idx} style={styles.fileChip}>
                  <Text style={styles.fileChipIndex}>#{idx + 1}</Text>
                  <Text style={styles.fileChipName} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <Text style={styles.fileChipType}>{f.type.toUpperCase()}</Text>
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

        {/* Kết quả uploadUrls (debug / tham khảo) */}
        {uploadUrls.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Kết quả upload URLs</Text>
            <Text style={styles.noteText}>
              Hệ thống đã tạo {uploadUrls.length} URL và dùng chúng để upload file.
              Trường <Text style={{ fontWeight: "700" }}>fileKey</Text> đã được gửi
              vào <Text style={{ fontWeight: "700" }}>mediaFileKeys</Text> khi gọi{" "}
              <Text style={{ fontWeight: "700" }}>createExpenseProof</Text>.
            </Text>

            {uploadUrls.map((u, idx) => (
              <View key={u.fileKey || idx} style={styles.urlItem}>
                <Text style={styles.urlIndex}>File #{idx + 1}</Text>
                <Text style={styles.urlMeta}>
                  Loại: {u.fileType} • Hết hạn:{" "}
                  {u.expiresAt
                    ? new Date(u.expiresAt).toLocaleString("vi-VN")
                    : "—"}
                </Text>
                <Text style={styles.urlLabel}>fileKey:</Text>
                <Text style={styles.urlValue}>{u.fileKey}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // layout
  container: { flex: 1, backgroundColor: BG },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },

  // header
  headerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  backIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginRight: 2,
  },
  backText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#ffe8d4",
    marginTop: 2,
  },
  requestInfo: {
    marginTop: 4,
    fontSize: 12,
    color: "#ffead0",
  },
  requestInfoBold: {
    fontWeight: "700",
  },
  requestInfoError: {
    marginTop: 4,
    fontSize: 12,
    color: "#ffd1d1",
  },

  // card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: PRIMARY,
    marginBottom: 8,
  },

  label: {
    fontSize: 13,
    color: "#555",
  },
  inputFull: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#222",
  },

  // upload
  pickBtn: {
    marginTop: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PRIMARY,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  pickBtnText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 14,
  },
  noFileText: {
    marginTop: 6,
    fontSize: 12,
    color: "#888",
  },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7ed",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  fileChipIndex: {
    fontWeight: "700",
    color: PRIMARY,
    marginRight: 6,
  },
  fileChipName: {
    flex: 1,
    fontSize: 12,
    color: "#222",
  },
  fileChipType: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: "600",
    color: PRIMARY,
  },

  actionBtn: {
    marginTop: 16,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // debug urls
  noteText: {
    fontSize: 12,
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
    fontSize: 13,
    fontWeight: "700",
    color: PRIMARY,
  },
  urlMeta: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },
  urlLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  urlValue: {
    fontSize: 12,
    color: "#222",
  },
});
