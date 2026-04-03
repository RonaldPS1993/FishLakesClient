import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Lake card for the Home tab — shows photo, name, stats, and forecast score.
 * @param {{ lake: object, forecast: object|null, forecastLocked: boolean, onPress: Function }} props
 */
export default function HomeLakeCard({ lake, forecast, forecastLocked, onPress }) {
  return (
    <TouchableOpacity style={styles.lakeCard} activeOpacity={0.9} onPress={onPress}>
      <Image
        source={lake.photo_url ? { uri: lake.photo_url } : require("../assets/defaultLake.png")}
        style={styles.cardPhoto}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardLakeName} numberOfLines={1}>
          {lake.lake_name || "Unknown Lake"}
        </Text>
        <View style={styles.cardStats}>
          {lake.depth_avg != null && (
            <Text style={styles.cardStatText}>{lake.depth_avg.toFixed(1)} m deep</Text>
          )}
          {lake.depth_avg != null && lake.lake_area != null && (
            <Text style={styles.cardStatDot}> · </Text>
          )}
          {lake.lake_area != null && (
            <Text style={styles.cardStatText}>{lake.lake_area.toFixed(1)} km²</Text>
          )}
        </View>
        {/* Forecast score — per D-24 */}
        {forecastLocked ? (
          <View style={styles.forecastRow}>
            <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
            <Text style={styles.forecastLockedText}>Forecast locked</Text>
          </View>
        ) : forecast ? (
          <View style={styles.forecastRow}>
            <View style={[styles.scoreBadge, { backgroundColor: forecast.color }]}>
              <Text style={styles.scoreBadgeText}>{forecast.score}</Text>
            </View>
            <Text style={[styles.forecastLabel, { color: forecast.color }]}>{forecast.label}</Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  lakeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardPhoto: { width: 64, height: 64, borderRadius: 12 },
  cardContent: { flex: 1, marginLeft: 12 },
  cardLakeName: { fontFamily: "poppins_bold", fontSize: 16, color: "#1A1A2E" },
  cardStats: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  cardStatText: { fontFamily: "poppins_regular", fontSize: 13, color: "#6B7280" },
  cardStatDot: { fontFamily: "poppins_regular", fontSize: 13, color: "#6B7280" },
  forecastRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 },
  scoreBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  scoreBadgeText: { fontFamily: "poppins_bold", fontSize: 13, color: "#FFFFFF" },
  forecastLabel: { fontFamily: "poppins_bold", fontSize: 13 },
  forecastLockedText: { fontFamily: "poppins_regular", fontSize: 12, color: "#9CA3AF" },
});
