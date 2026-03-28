import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { supabase } from "./lib/supabase";
import TabNavigator from "./Navigation/TabNavigator";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load Poppins fonts once at root — avoids duplicate loading across screens
  const [fontsLoaded] = useFonts({
    poppins_regular: require("./assets/fonts/Poppins-Regular.ttf"),
    poppins_bold: require("./assets/fonts/Poppins-Bold.ttf"),
    poppins_medium: require("./assets/fonts/Poppins-Medium.ttf"),
  });

  useEffect(() => {
    // Load existing session on app start
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Wait for session check and fonts before rendering
  if (loading || !fontsLoaded) return null;

  // Always render tabs — individual tabs handle their own auth gating
  return (
    <NavigationContainer>
      <TabNavigator session={session} />
    </NavigationContainer>
  );
}
