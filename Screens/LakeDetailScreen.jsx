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
import { useDispatch, useSelector } from "react-redux";
import { setFavoriteHylakId, clearFavorite } from "../store/lakesSlice";
import { supabase } from "../lib/supabase";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

/**
 * Lake Detail screen — shows hero photo, stats, directions, and favorite toggle.
 * @param {{ navigation: object, route: object }} props
 */
export default function LakeDetailScreen({ navigation, route }) {
  // lakeId may be a hylak_id integer (from hydrolakes) or a UUID string (from Google Places-only lakes)
  const { lakeId, hylakId } = route.params;
  const lakeIdentifier = lakeId ?? hylakId; // support both old and new navigation param names
  const [lake, setLake] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const favoriteHylakId = useSelector((state) => state.lakes.favoriteHylakId);
  const isFavorite = favoriteHylakId === lakeIdentifier;

  // Fetch lake detail on mount — lakeIdentifier may be hylak_id or UUID
  useEffect(() => {
    const loadLake = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("[LakeDetail] no session — cannot load lake");
        setLoading(false);
        return;
      }
      const token = session.access_token;
      try {
        const lakeRes = await fetch(`${SERVER_URL}/api/lakes/${lakeIdentifier}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const lakeJson = await lakeRes.json();
        if (lakeJson.status === "Success") {
          setLake(lakeJson.data);
        } else {
          console.error("[LakeDetail] lake fetch failed — status:", lakeRes.status, "body:", JSON.stringify(lakeJson));
        }
      } catch (error) {
        console.error("[LakeDetail] fetch threw:", error);
      } finally {
        setLoading(false);
      }
    };
    loadLake();
  }, [lakeIdentifier]);

  // Opens Apple Maps (iOS) or Google Maps (Android) with lake coordinates
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

  // Toggles favorite status — auth gate pushes Auth screen if not signed in
  const toggleFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigation.push("Auth", { fromGate: true });
      return;
    }
    try {
      const method = isFavorite ? "DELETE" : "POST";
      await fetch(`${SERVER_URL}/api/lakes/${lakeIdentifier}/favorite`, {
        method,
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      dispatch(isFavorite ? clearFavorite() : setFavoriteHylakId(lakeIdentifier));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0265BF" />
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
      <Image
        source={lake.photo_url ? { uri: lake.photo_url } : require("../assets/defaultLake.png")}
        style={styles.heroPhoto}
      />
      {!lake.photo_url && (
        <Text style={styles.representativePhotoText}>Showing representative photo</Text>
      )}

      <View style={styles.content}>
        {/* Lake name */}
        <Text style={styles.lakeName}>{lake.lake_name || "Unknown Lake"}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {lake.depth_avg != null && (
            <View style={styles.statItem}>
              <Ionicons name="water-outline" size={18} color="#0265BF" />
              <Text style={styles.statValue}>{lake.depth_avg.toFixed(1)} m</Text>
              <Text style={styles.statLabel}>Avg Depth</Text>
            </View>
          )}
          {lake.lake_area != null && (
            <View style={styles.statItem}>
              <Ionicons name="resize-outline" size={18} color="#0265BF" />
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
            color={isFavorite ? "#EF4444" : "#0265BF"}
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
  representativePhotoText: { fontFamily: "poppins_regular", fontSize: 12, color: "#9CA3AF", textAlign: "center", paddingVertical: 6 },
  content: { padding: 20 },
  lakeName: { fontFamily: "poppins_bold", fontSize: 24, color: "#1A1A2E" },
  statsRow: { flexDirection: "row", marginTop: 16, gap: 24 },
  statItem: { alignItems: "center" },
  statValue: { fontFamily: "poppins_bold", fontSize: 16, color: "#1A1A2E", marginTop: 4 },
  statLabel: { fontFamily: "poppins_regular", fontSize: 12, color: "#6B7280" },
  aboutSection: { marginTop: 20 },
  sectionTitle: { fontFamily: "poppins_bold", fontSize: 16, color: "#1A1A2E", marginBottom: 8 },
  aboutText: { fontFamily: "poppins_regular", fontSize: 14, color: "#6B7280", lineHeight: 22 },
  directionsButton: { backgroundColor: "#0265BF", borderRadius: 12, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 24 },
  directionsButtonText: { fontFamily: "poppins_bold", fontSize: 16, color: "#FFFFFF" },
  favoriteButton: { borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 12 },
  favoriteButtonText: { fontFamily: "poppins_bold", fontSize: 16, color: "#0265BF" },
});
