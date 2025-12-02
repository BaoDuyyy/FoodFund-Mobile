import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DonationList({ donationStats, campaign }: any) {
  const router = useRouter();
  return (
    <View style={styles.donationSection}>
      <View style={styles.donationHeader}>
        <Text style={styles.donationTitle}>Lượt ủng hộ</Text>
        <View style={styles.donationCountBadge}>
          <Text style={styles.donationCountText}>
            {donationStats?.totalDonations ?? campaign.donationCount ?? 0}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.donationSeeAll}
          onPress={() => router.push(`/campaign/donor/${campaign.id}`)}
        >
          <Text style={styles.donationSeeAllText}>Xem tất cả &gt;</Text>
        </TouchableOpacity>
      </View>
      {donationStats?.transactions?.length ? (
        <View style={styles.donationList}>
          {donationStats.transactions.slice(0, 5).map((tx: any) => (
            <View key={tx.no} style={styles.donationItem}>
              <View style={styles.donationAvatar}>
                <Text style={styles.donationAvatarText}>
                  {tx.donorName?.[0]?.toUpperCase() || "A"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.donationName}>{tx.donorName}</Text>
                <Text style={styles.donationDate}>
                  {new Date(tx.transactionDateTime).toLocaleDateString("vi-VN")} |{" "}
                  {new Date(tx.transactionDateTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.donationAmountBox}>
                <Text style={styles.donationAmount}>{tx.receivedAmount}</Text>
                <Text style={styles.donationAmountUnit}>VNĐ</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.donationEmpty}>
          <Text style={styles.donationEmptyText}>Chưa có lượt ủng hộ nào</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  donationSection: {
    marginBottom: 18,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  donationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  donationTitle: {
    fontWeight: "800",
    fontSize: 17,
    color: "#222",
  },
  donationCountBadge: {
    backgroundColor: "#43b46b",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 8,
  },
  donationCountText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  donationSeeAll: {
    marginLeft: "auto",
  },
  donationSeeAllText: {
    color: "#ff8800",
    fontWeight: "700",
    fontSize: 15,
  },
  donationList: {
    marginTop: 4,
  },
  donationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  donationAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffb46b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  donationAvatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 20,
  },
  donationName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#111",
  },
  donationDate: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  donationAmountBox: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  donationAmount: {
    color: "#ad4e28",
    fontWeight: "800",
    fontSize: 17,
  },
  donationAmountUnit: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  donationEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  donationEmptyText: {
    color: "#888",
    fontSize: 15,
    fontWeight: "600",
  },
});
