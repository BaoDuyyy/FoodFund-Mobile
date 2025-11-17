// src/config/api.ts
import { Platform } from "react-native";

export function getGraphqlUrl(override?: string) {
  if (override) return override;

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
