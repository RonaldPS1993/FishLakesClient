import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { supabase } from "../lib/supabase";

// Configure Google Sign In once at module level
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

/**
 * Minimal auth screen with Apple (iOS) and Google sign-in buttons.
 * Final design deferred to Phase 2 — this is the functional scaffold.
 */
export default function AuthScreen() {
  const [loading, setLoading] = useState(false);

  const signInWithApple = async () => {
    try {
      setLoading(true);
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error("No identity token received from Apple");
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (error) throw error;
      // Session is set automatically — App.jsx onAuthStateChange handles navigation
    } catch (error) {
      // ERR_REQUEST_CANCELED means user dismissed the sheet — not an error to show
      if (error.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Sign In Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) {
        throw new Error("No ID token received from Google");
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: userInfo.data.idToken,
      });

      if (error) throw error;
      // Session is set automatically — App.jsx onAuthStateChange handles navigation
    } catch (error) {
      // SIGN_IN_CANCELLED means user dismissed — not an error to show
      if (error.code !== "SIGN_IN_CANCELLED") {
        Alert.alert("Sign In Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FishLake</Text>
        <Text style={styles.subtitle}>Find your next great fishing spot</Text>
      </View>

      <View style={styles.buttons}>
        {loading ? (
          <ActivityIndicator size="large" color="#1a1a2e" />
        ) : (
          <>
            {Platform.OS === "ios" && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={8}
                style={styles.appleButton}
                onPress={signInWithApple}
              />
            )}

            <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    marginBottom: 60,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  buttons: {
    width: "100%",
    maxWidth: 300,
    gap: 16,
  },
  appleButton: {
    width: "100%",
    height: 50,
  },
  googleButton: {
    backgroundColor: "#4285F4",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  googleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
