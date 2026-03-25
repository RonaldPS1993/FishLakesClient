import * as React from "react";
import { TouchableOpacity, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";

//Screens
import HomeScreen from "../Screens/Home";
import AuthScreen from "../Screens/AuthScreen";

const Stack = createNativeStackNavigator();

/**
 * Root stack navigator.
 * Home (map) is always accessible — no auth gate.
 * Auth screen is presented as a modal when sign-in is required.
 * Session prop drives the header logout button visibility.
 *
 * @param {{ session: object|null }} props
 */
const MyStack = ({ session }) => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        options={{
          headerShown: !!session,
          title: "FishLake",
          headerRight: () =>
            session ? (
              <TouchableOpacity onPress={() => supabase.auth.signOut()}>
                <Text style={{ color: "#4285F4", marginRight: 10 }}>Logout</Text>
              </TouchableOpacity>
            ) : null,
        }}
      >
        {(props) => <HomeScreen {...props} session={session} />}
      </Stack.Screen>

      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false, presentation: "modal" }}
      />
    </Stack.Navigator>
  );
};

export default MyStack;
