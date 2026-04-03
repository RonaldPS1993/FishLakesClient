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
import ForecastCard from "../components/ForecastCard";
import LockedForecastCard from "../components/LockedForecastCard";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;
const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const getSatelliteUrl = (lat, lng) => {
  if (!lat || !lng || !GOOGLE_MAPS_KEY) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=640x380&scale=2&maptype=satellite&key=${GOOGLE_MAPS_KEY}`;
};

export default function LakeDetailScreen({ navigation, route }) {
  const { lakeId, hylakId } = route.params;
  const lakeIdentifier = lakeId ?? hylakId;
  const [lake, setLake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState(null);
  const [forecastLocked, setForecastLocked] = useState(false);
  const dispatch = useDispatch();
  const favoriteHylakId = useSelector((state) => state.lakes.favoriteHylakId);
  const isFavorite = favoriteHylakId === lakeIdentifier;

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const token = session.access_token;
      const headers = { "Authorization": `Bearer ${token}` };
      try {
        const [lakeRes, forecastRes] = await Promise.all([
          fetch(`${SERVER_URL}/api/lakes/${lakeIdentifier}`, { headers }),
          fetch(`${SERVER_URL}/api/lakes/${lakeIdentifier}/forecast`, { headers }),
        ]);
        const lakeJson = await lakeRes.json();
        if (lakeJson.status === "Success") {
          setLake(lakeJson.data);
        }
        if (forecastRes.status === 403) {
          setForecastLocked(true);
        } else {
          const forecastJson = await forecastRes.json();
          if (forecastJson.status === "Success") {
            setForecast(forecastJson.data);
          }
        }
      } catch {
        // fetch error — loading state cleared in finally
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [lakeIdentifier]);

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
    } catch {
      // toggle error — state unchanged
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
      <Image
        source={
          lake.photo_url
            ? { uri: lake.photo_url }
            : getSatelliteUrl(lake.pour_lat, lake.pour_long)
            ? { uri: getSatelliteUrl(lake.pour_lat, lake.pour_long) }
            : require("../assets/defaultLake.png")
        }
        style={styles.heroPhoto}
      />

      <View style={styles.content}>
        <Text style={styles.lakeName}>{lake.lake_name || "Unknown Lake"}</Text>

        {forecastLocked ? (
          <LockedForecastCard />
        ) : forecast ? (
          <ForecastCard forecast={forecast} />
        ) : null}

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

        {lake.about ? (
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{lake.about}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.directionsButton} onPress={openDirections}>
          <Ionicons name="navigate-outline" size={20} color="#FFFFFF" />
          <Text style={styles.directionsButtonText}>Get Directions</Text>
        </TouchableOpacity>

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
