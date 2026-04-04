import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { setUsername } from "../store/userSlice";
import { setFavoriteHylakId } from "../store/lakesSlice";
import { supabase } from "../lib/supabase";
import HomeLakeCard from "../components/HomeLakeCard";
import ForecastSummary from "../components/ForecastSummary";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL;

/**
 * Home tab screen — shows greeting and favorite or nearest lake card with forecast.
 * @param {{ navigation: object, session: object|null }} props
 */
export default function HomeScreen({ navigation, session }) {
  const [lake, setLake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState(null);
  const [forecastLocked, setForecastLocked] = useState(false);
  const dispatch = useDispatch();
  const username = useSelector((state) => state.user.username);

  // Auth gate — push Auth screen when no session
  useEffect(() => {
    if (!session) {
      navigation.push("Auth", { fromGate: true });
    }
  }, [session]);

  // Refresh greeting and favorite lake whenever Home tab gains focus
  useFocusEffect(
    useCallback(() => {
      if (!session) return;

      const refreshGreeting = async () => {
        if (username) return; // already loaded — ProfileScreen dispatches on save
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single();
        const email = session.user?.email || "";
        const fallback = email.includes("@") ? email.split("@")[0] : email;
        dispatch(setUsername(profile?.username || fallback));
      };

      const loadData = async () => {
        const token = session.access_token;
        const headers = { "Authorization": `Bearer ${token}` };
        try {
          // Step 1: Resolve lake identifier (favorite or nearest)
          const favRes = await fetch(`${SERVER_URL}/api/users/me/favorite`, { headers });
          const favJson = await favRes.json();
          let lakeIdentifier = favJson.data ? (favJson.data.hylak_id ?? favJson.data.id) : null;

          if (favJson.status === "Success" && lakeIdentifier) {
            dispatch(setFavoriteHylakId(lakeIdentifier));
          } else {
            // No favorite — get nearest lake
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
              const position = await Location.getCurrentPositionAsync({
                accuracy: Location.LocationAccuracy.Lowest,
              });
              const nearbyRes = await fetch(
                `${SERVER_URL}/api/lakes/nearby?lat=${position.coords.latitude}&lng=${position.coords.longitude}&radius=50000`,
                { headers }
              );
              const nearbyJson = await nearbyRes.json();
              if (nearbyJson.status === "Success" && nearbyJson.data?.length > 0) {
                lakeIdentifier = nearbyJson.data[0].hylak_id ?? nearbyJson.data[0].id;
              }
            }
          }

          if (!lakeIdentifier) {
            setLoading(false);
            return;
          }

          // Step 2: Fetch lake detail AND forecast in parallel (per D-25)
          const [detailRes, forecastRes] = await Promise.all([
            fetch(`${SERVER_URL}/api/lakes/${lakeIdentifier}`, { headers }),
            fetch(`${SERVER_URL}/api/lakes/${lakeIdentifier}/forecast`, { headers }),
          ]);

          const detailJson = await detailRes.json();
          if (detailJson.status === "Success") {
            setLake(detailJson.data);
          }

          if (forecastRes.status === 403) {
            setForecastLocked(true);
          } else {
            const forecastJson = await forecastRes.json();
            if (forecastJson.status === "Success") {
              setForecast(forecastJson.data);
            }
          }
        } catch (error) {
          console.error("Error loading home data:", error);
        } finally {
          setLoading(false);
        }
      };

      refreshGreeting();
      loadData();
    }, [session, dispatch])
  );

  // No session — auth gate handles push, return null while redirecting
  if (!session) return null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0265BF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>Welcome, {username}</Text>
          <Text style={styles.greetingSubtitle}>Ready to find your next catch?</Text>
        </View>

        {lake ? (
          <>
            <HomeLakeCard
              lake={lake}
              forecast={forecast}
              forecastLocked={forecastLocked}
              onPress={() => navigation.navigate("LakeDetail", { lakeId: lake.hylak_id ?? lake.id })}
            />
            <ForecastSummary forecast={forecast} />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="fish-outline" size={48} color="#6B7280" />
            <Text style={styles.emptyText}>No lakes found nearby</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  greetingSection: { marginTop: 20, marginBottom: 24 },
  greetingText: { fontFamily: "poppins_bold", fontSize: 24, color: "#1A1A2E" },
  greetingSubtitle: { fontFamily: "poppins_regular", fontSize: 14, color: "#6B7280", marginTop: 4 },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontFamily: "poppins_regular", fontSize: 16, color: "#6B7280", marginTop: 12 },
});
