import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { setFavoriteHylakId, clearFavorite } from "../store/lakesSlice";
import { supabase } from "../lib/supabase";
import LakeCard from "../components/LakeCard";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;
const INITIAL_LATITUDE_DELTA = 0.15;
const MAX_MARKERS = 30;
const MARKER_COLOR = "#00BCD4";

/** Converts visible map region to a radius (meters) that encloses the full screen. */
const calculateRadius = (deltaLat, deltaLng, centerLat) => {
  const halfHeightM = (deltaLat / 2) * 111320;
  const halfWidthM = (deltaLng / 2) * 111320 * Math.cos(centerLat * (Math.PI / 180));
  // Minimum 5km so close-zoom pans don't produce empty results
  return Math.max(Math.sqrt(halfHeightM ** 2 + halfWidthM ** 2), 5000);
};

/**
 * Returns the best identifier for a lake: hylak_id (integer) when available,
 * falling back to the lakes table UUID for Google Places-only lakes.
 */
const getLakeIdentifier = (lake) => lake.hylak_id ?? lake.id;

export default function MapScreen({ navigation }) {
  const [region, setRegion] = useState({ latitude: 0, longitude: 0, latitudeDelta: INITIAL_LATITUDE_DELTA, longitudeDelta: INITIAL_LATITUDE_DELTA });
  const [nearbyLakes, setNearbyLakes] = useState([]);
  const [selectedLake, setSelectedLake] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const favoriteHylakId = useSelector((state) => state.lakes.favoriteHylakId);
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
  // Uses hylak_id when available, falls back to UUID for Google Places-only lakes
  const toggleFavorite = useCallback(async (lakeIdentifier) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigation.push("Auth", { fromGate: true });
      return;
    }
    try {
      const isFav = favoriteHylakId === lakeIdentifier;
      const method = isFav ? "DELETE" : "POST";
      await fetch(`${SERVER_URL}/api/lakes/${lakeIdentifier}/favorite`, {
        method,
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      dispatch(isFav ? clearFavorite() : setFavoriteHylakId(lakeIdentifier));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  }, [favoriteHylakId, navigation]);

  // Fetch lake detail to resolve a missing name; updates selectedLake in place
  // Only called when lake has a hylak_id (hydrolakes-backed lakes may lack a name)
  const fetchLakeDetail = useCallback(async (lakeIdentifier) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/lakes/${lakeIdentifier}`, {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.status === "Success" && json.data?.lake_name) {
        setSelectedLake((prev) =>
          prev && getLakeIdentifier(prev) === lakeIdentifier ? { ...prev, lake_name: json.data.lake_name } : prev
        );
      }
    } catch { /* silent — card already visible, name stays null */ }
  }, []);

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
          longitudeDelta: INITIAL_LATITUDE_DELTA,
        };
        setRegion(newRegion);
        const radius = calculateRadius(INITIAL_LATITUDE_DELTA, INITIAL_LATITUDE_DELTA, position.coords.latitude);
        const [lakes, favId] = await Promise.all([
          fetchNearbyLakes(position.coords.latitude, position.coords.longitude, radius),
          fetchUserFavorite(),
        ]);
        setNearbyLakes(lakes.slice(0, MAX_MARKERS));
        if (favId !== null) dispatch(setFavoriteHylakId(favId));
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
      const radius = calculateRadius(newRegion.latitudeDelta, newRegion.longitudeDelta, newRegion.latitude);
      const lakes = await fetchNearbyLakes(newRegion.latitude, newRegion.longitude, radius);
      setNearbyLakes(lakes.slice(0, MAX_MARKERS));
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
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0265BF" /></View>;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChange}
        showsPointsOfInterest={false}
        onPress={() => {
          // On iOS, a marker tap propagates to the map — guard against it clearing the card
          if (markerSelectedRef.current) {
            markerSelectedRef.current = false;
            return;
          }
          setSelectedLake(null);
        }}
      >
        {nearbyLakes.map((lake) => (
          <Marker
            key={lake.hylak_id ?? lake.id}
            coordinate={{ latitude: lake.pour_lat, longitude: lake.pour_long }}
            pinColor={MARKER_COLOR}
            onPress={() => {
              markerSelectedRef.current = true;
              setSelectedLake(lake);
              // Fetch detail to resolve name only if missing and we have an identifier
              if (!lake.lake_name) {
                const identifier = getLakeIdentifier(lake);
                if (identifier) fetchLakeDetail(identifier);
              }
            }}
          />
        ))}
      </MapView>

      {selectedLake && (
        <LakeCard
          lake={selectedLake}
          isFavorite={favoriteHylakId === getLakeIdentifier(selectedLake)}
          onFavoriteToggle={() => toggleFavorite(getLakeIdentifier(selectedLake))}
          onPress={() => navigation.navigate("LakeDetail", { lakeId: getLakeIdentifier(selectedLake) })}
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
  settingsButton: { backgroundColor: "#0265BF", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 24 },
  settingsButtonText: { fontFamily: "poppins_bold", fontSize: 16, color: "#FFFFFF" },
});
