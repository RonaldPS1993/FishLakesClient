import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { supabase } from "./lib/supabase";
import MyStack from "./Navigation/StackNavigator";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Wait for session check before rendering — avoids flash of wrong screen
  if (loading) return null;

  return (
    <NavigationContainer>
      <MyStack session={session} />
    </NavigationContainer>
  );
}
