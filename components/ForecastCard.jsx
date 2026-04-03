import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Forecast card for paid users — shows composite fishing score, bite times, weather, moon, pressure.
 * @param {{ forecast: object }} props
 */
export default function ForecastCard({ forecast }) {
  const pressureIcon = !forecast.pressure ? "remove-outline"
    : forecast.pressure.trend === "falling" ? "arrow-down-outline"
    : forecast.pressure.trend === "rising" ? "arrow-up-outline"
    : "remove-outline";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={[styles.scoreNumber, { color: forecast.color }]}>
          {forecast.score != null ? Number(forecast.score).toFixed(1) : "--"}
        </Text>
        <View style={styles.labelColumn}>
          <Text style={[styles.label, { color: forecast.color }]}>{forecast.label}</Text>
          <Text style={styles.subtitle}>Fishing Forecast</Text>
        </View>
      </View>

      {forecast.bestBiteTimes && forecast.bestBiteTimes.length > 0 && (
        <View style={styles.biteTimesSection}>
          {forecast.bestBiteTimes.slice(0, 2).map((bt, i) => (
            <View key={i} style={styles.biteTimeRow}>
              <Ionicons name={bt.type === "major" ? "star" : "star-outline"} size={16} color="#F59E0B" />
              <Text style={styles.biteTimeRange}>{bt.start} - {bt.end}</Text>
              <Text style={styles.biteTimeLabel}> · {bt.label}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.miniRow}>
        {forecast.weather != null && (
          <>
            <View style={styles.miniItem}>
              <Text style={styles.miniEmoji}>🌡</Text>
              <Text style={styles.miniText}>{forecast.weather.tempF}°F</Text>
            </View>
            <View style={styles.miniItem}>
              <Ionicons name="speedometer-outline" size={16} color="#6B7280" />
              <Text style={styles.miniText}>{forecast.weather.windMph} mph</Text>
            </View>
          </>
        )}
        {forecast.moonPhase != null && (
          <View style={styles.miniItem}>
            <Text style={styles.miniEmoji}>🌕</Text>
            <Text style={styles.miniText}>{forecast.moonPhase}</Text>
          </View>
        )}
        {forecast.pressure != null && (
          <View style={styles.miniItem}>
            <Ionicons name={pressureIcon} size={16} color="#6B7280" />
            <Text style={styles.miniText}>{forecast.pressure.label}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginTop: 16, marginBottom: 8, minHeight: 180, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: "#F3F4F6" },
  topRow: { flexDirection: "row", alignItems: "center" },
  scoreNumber: { fontFamily: "poppins_bold", fontSize: 36, lineHeight: 44 },
  labelColumn: { marginLeft: 12, justifyContent: "center" },
  label: { fontFamily: "poppins_bold", fontSize: 18 },
  subtitle: { fontFamily: "poppins_regular", fontSize: 12, color: "#6B7280" },
  biteTimesSection: { marginTop: 16, gap: 6 },
  biteTimeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  biteTimeRange: { fontFamily: "poppins_regular", fontSize: 14, color: "#1A1A2E" },
  biteTimeLabel: { fontFamily: "poppins_regular", fontSize: 12, color: "#6B7280" },
  miniRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  miniItem: { alignItems: "center", gap: 4 },
  miniEmoji: { fontSize: 16, lineHeight: 20 },
  miniText: { fontFamily: "poppins_regular", fontSize: 12, color: "#6B7280" },
});
