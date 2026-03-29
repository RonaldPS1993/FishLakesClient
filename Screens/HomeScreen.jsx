import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { supabase } from "../lib/supabase";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

/**
 * Home tab screen — shows greeting and favorite or nearest lake card.
 * @param {{ navigation: object, session: object|null }} props
 */
export default function HomeScreen({ navigation, session }) {
  const [lake, setLake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");

  // Auth gate — push Auth screen when no session
  useEffect(() => {
    if (!session) {
      navigation.push("Auth", { fromGate: true });
    }
  }, [session]);

  // Load favorite or nearest lake when session is available
  useEffect(() => {
    if (!session) return;
    const loadData = async () => {
      const token = session.access_token;
      const email = session.user?.email || "";
      const username = email.includes("@") ? email.split("@")[0] : email;
      setGreeting(username);

      try {
        // Step 1: Check for favorite lake
        const favRes = await fetch(`${SERVER_URL}/api/users/me/favorite`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const favJson = await favRes.json();

        if (favJson.status === "Success" && favJson.data && favJson.data.hylak_id) {
          // Favorite found — fetch full lake detail for depth/area
          const detailRes = await fetch(`${SERVER_URL}/api/lakes/${favJson.data.hylak_id}`, {
            headers: { "Authorization": `Bearer ${token}` },
          });
          const detailJson = await detailRes.json();
          if (detailJson.status === "Success") {
            setLake(detailJson.data);
          } else {
            // Fallback: use what we have from favorite response
            setLake(favJson.data);
          }
        } else {
          // No favorite — get nearest lake
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const position = await Location.getCurrentPositionAsync({
              accuracy: Location.LocationAccuracy.Lowest,
            });
            const nearbyRes = await fetch(
              `${SERVER_URL}/api/lakes/nearby?lat=${position.coords.latitude}&lng=${position.coords.longitude}&radius=50000`,
              { headers: { "Authorization": `Bearer ${token}` } }
            );
            const nearbyJson = await nearbyRes.json();
            if (nearbyJson.status === "Success" && nearbyJson.data?.length > 0) {
              setLake(nearbyJson.data[0]);
            }
          }
        }
      } catch (error) {
        console.error("Error loading home data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [session]);

  // No session — auth gate handles push, return null while redirecting
  if (!session) return null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A3C6E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.greetingSection}>
        <Text style={styles.greetingText}>Welcome, {greeting}</Text>
        <Text style={styles.greetingSubtitle}>Ready to find your next catch?</Text>
      </View>

      {lake ? (
        <TouchableOpacity
          style={styles.lakeCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("LakeDetail", { hylakId: lake.hylak_id })}
        >
          {lake.photo_url ? (
            <Image source={{ uri: lake.photo_url }} style={styles.cardPhoto} />
          ) : (
            <View style={[styles.cardPhoto, styles.photoPlaceholder]}>
              <Ionicons name="image-outline" size={32} color="#9CA3AF" />
            </View>
          )}
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
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="fish-outline" size={48} color="#6B7280" />
          <Text style={styles.emptyText}>No lakes found nearby</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  greetingSection: { marginTop: 20, marginBottom: 24 },
  greetingText: { fontFamily: "poppins_bold", fontSize: 24, color: "#1A1A2E" },
  greetingSubtitle: { fontFamily: "poppins_regular", fontSize: 14, color: "#6B7280", marginTop: 4 },
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
  photoPlaceholder: { backgroundColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
  cardContent: { flex: 1, marginLeft: 12 },
  cardLakeName: { fontFamily: "poppins_bold", fontSize: 16, color: "#1A1A2E" },
  cardStats: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  cardStatText: { fontFamily: "poppins_regular", fontSize: 13, color: "#6B7280" },
  cardStatDot: { fontFamily: "poppins_regular", fontSize: 13, color: "#6B7280" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontFamily: "poppins_regular", fontSize: 16, color: "#6B7280", marginTop: 12 },
});
