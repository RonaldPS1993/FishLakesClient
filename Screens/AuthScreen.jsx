import React, { useState, useEffect } from "react";
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
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

/**
 * Minimal auth screen with Apple (iOS) and Google sign-in buttons.
 * Final design deferred to Phase 2 — this is the functional scaffold.
 */
export default function AuthScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const fromGate = route?.params?.fromGate;

  // When pushed as an auth gate, return to the previous screen after sign-in
  useEffect(() => {
    if (!fromGate) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && fromGate) {
        navigation.goBack();
      }
    });
    return () => subscription.unsubscribe();
  }, [fromGate, navigation]);

  const signInWithApple = async () => {
    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      // Don't set loading before signInAsync — keeps the app responsive behind the Apple dialog
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      // Dialog closed — show spinner while calling Supabase
      setLoading(true);

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

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      // Opens browser — Supabase redirects back to fishlakes:// (configured as Site URL)
      const result = await WebBrowser.openAuthSessionAsync(data.url, "fishlakes://");

      if (result.type === "success") {
        // Normalize fishlakes:?code=... → fishlakes://?code=... for proper URL parsing
        const normalizedUrl = result.url.replace(/^([\w]+):(?!\/{2})/, "$1://");
        const authCode = new URL(normalizedUrl).searchParams.get("code");

        // Workaround: Supabase SDK v2 stores the PKCE verifier under a fixed key but
        // exchangeCodeForSession now looks it up via a state-based key — bypassing directly.
        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
        const verifierKey = `sb-${new URL(process.env.EXPO_PUBLIC_SUPABASE_URL).hostname.split(".")[0]}-auth-token-code-verifier`;
        const stored = await AsyncStorage.getItem(verifierKey);
        const codeVerifier = stored ? JSON.parse(stored) : null;

        if (!authCode || !codeVerifier) {
          throw new Error(`Missing auth code or PKCE verifier (code=${!!authCode}, verifier=${!!codeVerifier})`);
        }

        // Exchange code + verifier with Supabase token endpoint directly
        const tokenRes = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=pkce`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ auth_code: authCode, code_verifier: codeVerifier }),
          }
        );

        const tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
        });
        if (sessionError) throw sessionError;

        await AsyncStorage.removeItem(verifierKey);
        // Session is set — App.jsx onAuthStateChange handles navigation
      }
    } catch (error) {
      Alert.alert("Sign In Error", error.message);
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
