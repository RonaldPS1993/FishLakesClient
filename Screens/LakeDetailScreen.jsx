import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

/**
 * Lake Detail screen — shows hero photo, stats, directions, and favorite toggle.
 * @param {{ navigation: object, route: object }} props
 */
export default function LakeDetailScreen({ navigation, route }) {
  const { hylakId } = route.params;
  const [lake, setLake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch lake detail and favorite status in parallel on mount
  useEffect(() => {
    const loadLake = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const token = session.access_token;
      try {
        const [lakeRes, favRes] = await Promise.all([
          fetch(`${SERVER_URL}/api/lakes/${hylakId}`, {
            headers: { "Authorization": `Bearer ${token}` },
          }),
          fetch(`${SERVER_URL}/api/users/me/favorite`, {
            headers: { "Authorization": `Bearer ${token}` },
          }),
        ]);
        const lakeJson = await lakeRes.json();
        const favJson = await favRes.json();
        if (lakeJson.status === "Success") setLake(lakeJson.data);
        if (favJson.status === "Success" && favJson.data) {
          setIsFavorite(favJson.data.hylak_id === hylakId);
        }
      } catch (error) {
        console.error("Error loading lake detail:", error);
      } finally {
        setLoading(false);
      }
    };
    loadLake();
  }, [hylakId]);

  /**
   * Opens Apple Maps (iOS) or Google Maps (Android) with lake coordinates.
   */
  const openDirections = () => {
    if (!lake) return;
    const label = encodeURIComponent(lake.lake_name || "Lake");
    const lat = lake.pour_lat;
    const lng = lake.pour_long;
    const url = Platform.OS === "ios"
      ? `maps://?q=${label}&ll=${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  /**
   * Toggles favorite status — auth gate pushes Auth screen if not signed in.
   */
  const toggleFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigation.push("Auth", { fromGate: true });
      return;
    }
    try {
      const method = isFavorite ? "DELETE" : "POST";
      await fetch(`${SERVER_URL}/api/lakes/${hylakId}/favorite`, {
        method,
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A3C6E" />
      </View>
    );
  }

  if (!lake) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#6B7280" />
        <Text style={styles.errorText}>Lake not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Hero photo */}
      {lake.photo_url ? (
        <Image source={{ uri: lake.photo_url }} style={styles.heroPhoto} />
      ) : (
        <View style={[styles.heroPhoto, styles.heroPlaceholder]}>
          <Ionicons name="image-outline" size={48} color="#9CA3AF" />
        </View>
      )}

      <View style={styles.content}>
        {/* Lake name */}
        <Text style={styles.lakeName}>{lake.lake_name || "Unknown Lake"}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {lake.depth_avg != null && (
            <View style={styles.statItem}>
              <Ionicons name="water-outline" size={18} color="#1A3C6E" />
              <Text style={styles.statValue}>{lake.depth_avg.toFixed(1)} m</Text>
              <Text style={styles.statLabel}>Avg Depth</Text>
            </View>
          )}
          {lake.lake_area != null && (
            <View style={styles.statItem}>
              <Ionicons name="resize-outline" size={18} color="#1A3C6E" />
              <Text style={styles.statValue}>{lake.lake_area.toFixed(1)} km²</Text>
              <Text style={styles.statLabel}>Area</Text>
            </View>
          )}
        </View>

        {/* About section */}
        {lake.about ? (
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{lake.about}</Text>
          </View>
        ) : null}

        {/* Get Directions button */}
        <TouchableOpacity style={styles.directionsButton} onPress={openDirections}>
          <Ionicons name="navigate-outline" size={20} color="#FFFFFF" />
          <Text style={styles.directionsButtonText}>Get Directions</Text>
        </TouchableOpacity>

        {/* Favorite button */}
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? "#EF4444" : "#1A3C6E"}
          />
          <Text style={[styles.favoriteButtonText, isFavorite && { color: "#EF4444" }]}>
            {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  errorText: { fontFamily: "poppins_regular", fontSize: 16, color: "#6B7280", marginTop: 12 },
  heroPhoto: { width: "100%", height: 240 },
  heroPlaceholder: { backgroundColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
  content: { padding: 20 },
  lakeName: { fontFamily: "poppins_bold", fontSize: 24, color: "#1A1A2E" },
  statsRow: { flexDirection: "row", marginTop: 16, gap: 24 },
  statItem: { alignItems: "center" },
  statValue: { fontFamily: "poppins_bold", fontSize: 16, color: "#1A1A2E", marginTop: 4 },
  statLabel: { fontFamily: "poppins_regular", fontSize: 12, color: "#6B7280" },
  aboutSection: { marginTop: 20 },
  sectionTitle: { fontFamily: "poppins_bold", fontSize: 16, color: "#1A1A2E", marginBottom: 8 },
  aboutText: { fontFamily: "poppins_regular", fontSize: 14, color: "#6B7280", lineHeight: 22 },
  directionsButton: {
    backgroundColor: "#1A3C6E",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
  },
  directionsButtonText: { fontFamily: "poppins_bold", fontSize: 16, color: "#FFFFFF" },
  favoriteButton: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  favoriteButtonText: { fontFamily: "poppins_bold", fontSize: 16, color: "#1A3C6E" },
});
