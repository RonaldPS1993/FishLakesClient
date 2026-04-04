import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MOON_EMOJI = {
  "New Moon": "🌑",
  "Waxing Crescent": "🌒",
  "First Quarter": "🌓",
  "Waxing Gibbous": "🌔",
  "Full Moon": "🌕",
  "Waning Gibbous": "🌖",
  "Last Quarter": "🌗",
  "Waning Crescent": "🌘",
};

/**
 * Home tab forecast summary — conditions strip and today's bite windows.
 * Only renders when forecast data is available (paid users).
 * @param {{ forecast: object|null }} props
 */
export default function ForecastSummary({ forecast }) {
  if (!forecast) return null;

  const pressureIcon = !forecast.pressure
    ? "remove-outline"
    : forecast.pressure.trend === "falling"
    ? "arrow-down-outline"
    : forecast.pressure.trend === "rising"
    ? "arrow-up-outline"
    : "remove-outline";

  const moonEmoji = MOON_EMOJI[forecast.moonPhase] ?? "🌙";

  return (
    <View style={styles.container}>
      {/* Conditions strip */}
      <Text style={styles.sectionLabel}>Today's Conditions</Text>
      <View style={styles.conditionsRow}>
        {forecast.weather != null && (
          <>
            <View style={styles.condItem}>
              <Text style={styles.condEmoji}>🌡</Text>
              <Text style={styles.condText}>{forecast.weather.tempF}°F</Text>
            </View>
            <View style={styles.condDivider} />
            <View style={styles.condItem}>
              <Ionicons name="speedometer-outline" size={18} color="#6B7280" />
              <Text style={styles.condText}>{forecast.weather.windMph} mph</Text>
            </View>
            <View style={styles.condDivider} />
          </>
        )}
        {forecast.moonPhase != null && (
          <>
            <View style={styles.condItem}>
              <Text style={styles.condEmoji}>{moonEmoji}</Text>
              <Text style={styles.condText} numberOfLines={1}>{forecast.moonPhase}</Text>
            </View>
            <View style={styles.condDivider} />
          </>
        )}
        {forecast.pressure != null && (
          <View style={styles.condItem}>
            <Ionicons name={pressureIcon} size={18} color="#6B7280" />
            <Text style={styles.condText}>{forecast.pressure.label}</Text>
          </View>
        )}
      </View>

      {/* Bite windows */}
      {forecast.bestBiteTimes && forecast.bestBiteTimes.length > 0 && (
        <View style={styles.biteSection}>
          <Text style={styles.sectionLabel}>Today's Best Times</Text>
          <View style={styles.biteRow}>
            {forecast.bestBiteTimes.slice(0, 4).map((bt, i) => (
              <View
                key={i}
                style={[styles.bitePill, bt.type === "major" ? styles.bitePillMajor : styles.bitePillMinor]}
              >
                <Ionicons
                  name={bt.type === "major" ? "star" : "star-outline"}
                  size={12}
                  color={bt.type === "major" ? "#F59E0B" : "#9CA3AF"}
                />
                <Text style={[styles.biteTime, bt.type === "minor" && styles.biteTimeMinor]}>
                  {bt.start} – {bt.end}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  sectionLabel: {
    fontFamily: "poppins_bold",
    fontSize: 13,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  conditionsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  condItem: { flex: 1, alignItems: "center", gap: 4 },
  condEmoji: { fontSize: 18, lineHeight: 22 },
  condText: { fontFamily: "poppins_regular", fontSize: 12, color: "#374151", textAlign: "center" },
  condDivider: { width: 1, height: 28, backgroundColor: "#E5E7EB" },
  biteSection: { marginTop: 20 },
  biteRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bitePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  bitePillMajor: { backgroundColor: "#FEF3C7" },
  bitePillMinor: { backgroundColor: "#F3F4F6" },
  biteTime: { fontFamily: "poppins_regular", fontSize: 12, color: "#1A1A2E" },
  biteTimeMinor: { color: "#6B7280" },
});
