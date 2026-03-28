import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { supabase } from "../lib/supabase";

/**
 * Profile screen showing user avatar, username, email, and logout button.
 * Pushes AuthScreen as a gate when no session exists.
 *
 * @param {{ navigation: object, session: object|null }} props
 */
export default function ProfileScreen({ navigation, session }) {
  // Auth gate: push to Auth screen when no session
  useEffect(() => {
    if (!session) {
      navigation.push("Auth", { fromGate: true });
    }
  }, [session]);

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A3C6E" />
      </View>
    );
  }

  const email = session.user.email;
  const username = email && email.includes("@") ? email.split("@")[0] : email;
  const initials = username ? username.charAt(0).toUpperCase() : "?";

  const handleLogOut = async () => {
    await supabase.auth.signOut();
    // App.jsx onAuthStateChange sets session to null — tab navigator re-gates automatically
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.logOutButton} onPress={handleLogOut}>
        <Text style={styles.logOutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  topSection: {
    alignItems: "center",
    paddingTop: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A3C6E",
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    fontSize: 32,
    fontFamily: "poppins_bold",
    color: "#FFFFFF",
  },
  username: {
    fontFamily: "poppins_bold",
    fontSize: 20,
    color: "#1A1A2E",
    marginTop: 12,
  },
  email: {
    fontFamily: "poppins_regular",
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  spacer: {
    flex: 1,
  },
  logOutButton: {
    backgroundColor: "#1A3C6E",
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 24,
    marginBottom: 40,
    alignItems: "center",
  },
  logOutText: {
    fontFamily: "poppins_bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});
