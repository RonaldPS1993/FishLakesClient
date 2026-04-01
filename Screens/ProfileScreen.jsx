import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useDispatch } from "react-redux";
import { setUsername, clearUser } from "../store/userSlice";
import { clearFavorite } from "../store/lakesSlice";
import { supabase } from "../lib/supabase";

/**
 * Profile screen — avatar, editable username, email, save changes, and logout.
 * @param {{ navigation: object, session: object|null }} props
 */
export default function ProfileScreen({ navigation, session }) {
  const [username, setUsernameLocal] = useState("");
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!session) {
      navigation.push("Auth", { fromGate: true });
      return;
    }
    // Load username from profiles table
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();
      if (!error && data) setUsernameLocal(data.username || "");
    };
    loadProfile();
  }, [session]);

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0265BF" />
      </View>
    );
  }

  const email = session.user.email;
  const initials = username ? username.charAt(0).toUpperCase() : "?";

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert("Username required", "Please enter a username.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim(), updated_at: new Date().toISOString() })
      .eq("id", session.user.id);
    setSaving(false);
    if (error) {
      Alert.alert("Error", "Could not save changes.");
    } else {
      dispatch(setUsername(username.trim()));
      Alert.alert("Saved", "Username updated.");
    }
  };

  const handleLogOut = async () => {
    dispatch(clearUser());
    dispatch(clearFavorite());
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsernameLocal}
          placeholder="Enter username"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? "Saving…" : "Save Changes"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.logOutButton} onPress={handleLogOut}>
        <Text style={styles.logOutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  topSection: { alignItems: "center", paddingTop: 40, paddingBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#0265BF", justifyContent: "center", alignItems: "center" },
  initials: { fontSize: 32, fontFamily: "poppins_bold", color: "#FFFFFF" },
  email: { fontFamily: "poppins_regular", fontSize: 14, color: "#6B7280", marginTop: 8 },
  form: { paddingHorizontal: 24 },
  label: { fontFamily: "poppins_bold", fontSize: 14, color: "#1A1A2E", marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "poppins_regular",
    fontSize: 15,
    color: "#1A1A2E",
  },
  saveButton: { backgroundColor: "#0265BF", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  saveButtonText: { fontFamily: "poppins_bold", fontSize: 16, color: "#FFFFFF" },
  spacer: { flex: 1 },
  logOutButton: { borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12, paddingVertical: 14, marginHorizontal: 24, marginBottom: 40, alignItems: "center" },
  logOutText: { fontFamily: "poppins_bold", fontSize: 16, color: "#6B7280" },
});
