import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Linking, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import LakeCard from "../components/LakeCard";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;
const INITIAL_LATITUDE_DELTA = 0.02;
const markerIcon = require("../assets/icons/markerIcon.png");

/** Converts latitude delta to a search radius in meters. */
const calculateRadius = (deltaLat) => {
  const radiusMiles = deltaLat * 69;
  return radiusMiles * 1609.34;
};

export default function MapScreen({ navigation }) {
  const [region, setRegion] = useState({ latitude: 0, longitude: 0, latitudeDelta: 0.02, longitudeDelta: 0.02 });
  const [nearbyLakes, setNearbyLakes] = useState([]);
  const [selectedLake, setSelectedLake] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteHylakId, setFavoriteHylakId] = useState(null);
  const fetchTimeoutRef = useRef(null);
  const markerSelectedRef = useRef(false);

  // Fetch lakes from internal server API with Bearer token
  const fetchNearbyLakes = useCallback(async (lat, lng, radius) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    try {
      const res = await fetch(
        `${SERVER_URL}/api/lakes/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
        { headers: { "Authorization": `Bearer ${session.access_token}` } }
      );
      const json = await res.json();
      return json.status === "Success" ? json.data : [];
    } catch (error) {
      console.error("Error fetching nearby lakes:", error);
      return [];
    }
  }, []);

  // Fetch user's current favorite hylak_id to initialize heart state
  const fetchUserFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    try {
      const res = await fetch(`${SERVER_URL}/api/users/me/favorite`, { headers: { "Authorization": `Bearer ${session.access_token}` } });
      const json = await res.json();
      return json.status === "Success" && json.data ? json.data.hylak_id : null;
    } catch { return null; }
  };

  // Toggle favorite — auth gate pushes Auth screen if not logged in
  const toggleFavorite = useCallback(async (hylakId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigation.push("Auth", { fromGate: true });
      return;
    }
    try {
      const isFav = favoriteHylakId === hylakId;
      const method = isFav ? "DELETE" : "POST";
      await fetch(`${SERVER_URL}/api/lakes/${hylakId}/favorite`, {
        method,
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      setFavoriteHylakId(isFav ? null : hylakId);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  }, [favoriteHylakId, navigation]);

  // On mount: request location, set region, fetch lakes + favorite in parallel
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationDenied(true);
        setLoading(false);
        return;
      }
      try {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.LocationAccuracy.Lowest });
        const newRegion = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: INITIAL_LATITUDE_DELTA,
          longitudeDelta: 0.02,
        };
        setRegion(newRegion);
        const radius = calculateRadius(INITIAL_LATITUDE_DELTA);
        const [lakes, favId] = await Promise.all([
          fetchNearbyLakes(position.coords.latitude, position.coords.longitude, radius),
          fetchUserFavorite(),
        ]);
        setNearbyLakes(lakes);
        setFavoriteHylakId(favId);
      } catch (error) {
        console.error("Error getting location:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Re-query lakes on pan/zoom with 400ms debounce; skip on programmatic marker tap
  const handleRegionChange = useCallback((newRegion) => {
    if (markerSelectedRef.current) return;
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(async () => {
      const radius = calculateRadius(newRegion.latitudeDelta);
      const lakes = await fetchNearbyLakes(newRegion.latitude, newRegion.longitude, radius);
      setNearbyLakes(lakes);
    }, 400);
  }, [fetchNearbyLakes]);

  if (locationDenied) {
    return (
      <View style={styles.deniedContainer}>
        <Ionicons name="location-outline" size={64} color="#6B7280" />
        <Text style={styles.deniedTitle}>Location Required</Text>
        <Text style={styles.deniedText}>FishLake needs your location to find nearby lakes</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1A3C6E" /></View>;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChange}
        showsPointsOfInterest={false}
        onPress={() => {
          markerSelectedRef.current = false;
          setSelectedLake(null);
        }}
      >
        {nearbyLakes.map((lake) => (
          <Marker
            key={lake.hylak_id}
            coordinate={{ latitude: lake.pour_lat, longitude: lake.pour_long }}
            onPress={() => {
              markerSelectedRef.current = true;
              setSelectedLake(lake);
            }}
          >
            <Image source={markerIcon} style={{ width: 32, height: 40 }} resizeMode="contain" />
          </Marker>
        ))}
      </MapView>

      {selectedLake && (
        <LakeCard
          lake={selectedLake}
          isFavorite={favoriteHylakId === selectedLake.hylak_id}
          onFavoriteToggle={toggleFavorite}
          onPress={() => navigation.navigate("LakeDetail", { hylakId: selectedLake.hylak_id })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { width: "100%", height: "100%" },
  deniedContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF", padding: 24 },
  deniedTitle: { fontFamily: "poppins_bold", fontSize: 20, color: "#1A1A2E", marginTop: 16 },
  deniedText: { fontFamily: "poppins_regular", fontSize: 14, color: "#6B7280", marginTop: 8, textAlign: "center", paddingHorizontal: 40 },
  settingsButton: { backgroundColor: "#1A3C6E", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 24 },
  settingsButtonText: { fontFamily: "poppins_bold", fontSize: 16, color: "#FFFFFF" },
});
