import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Locked forecast placeholder shown to free/unauthenticated users.
 * Same dimensions as ForecastCard to prevent layout shift.
 */
export default function LockedForecastCard() {
  return (
    <View style={styles.card}>
      <Ionicons name="lock-closed" size={32} color="#9CA3AF" />
      <Text style={styles.title}>Fishing Forecast</Text>
      <Text style={styles.subtitle}>Upgrade to unlock today's fishing forecast</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    minHeight: 180,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  title: {
    fontFamily: "poppins_bold",
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "poppins_regular",
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
});
