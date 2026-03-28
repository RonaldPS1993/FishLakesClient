import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Coming soon placeholder for the Catches tab.
 * Will be replaced with catch logging functionality in v2.
 */
export default function CatchesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="fish-outline" size={64} color="#6B7280" />
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>
          Catch logging is on its way. Stay tuned!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: "poppins_bold",
    fontSize: 24,
    color: "#1A1A2E",
    marginTop: 16,
  },
  subtitle: {
    fontFamily: "poppins_regular",
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
});
