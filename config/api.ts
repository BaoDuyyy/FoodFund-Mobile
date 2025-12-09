// src/config/api.ts
import { Platform } from "react-native";

// Lấy biến môi trường từ process.env hoặc globalThis (tùy môi trường build)
const REMOTE_API_URL =
  process.env.GRAPHQL_API_URL ||
  (globalThis as any).GRAPHQL_API_URL ||
  "https://api.minhphuoc.io.vn/graphql";

export function getGraphqlUrl(override?: string) {
  if (override) return override;

  // Nếu có biến môi trường, ưu tiên dùng remote API
  if (REMOTE_API_URL) return REMOTE_API_URL;

  if (Platform.OS === "android") {
    // Android emulator → localhost là 10.0.2.2
    return "http://10.0.2.2:8000/graphql";
  }

  if (Platform.OS === "ios") {
    // iOS dùng localhost bình thường
    return "http://localhost:8000/graphql";
  }

  // Real device → tự đổi IP của PC bạn
  return "http://192.168.1.5:8000/graphql";
}
