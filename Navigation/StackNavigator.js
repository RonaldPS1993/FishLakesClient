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
 * Shows Auth screen first when no session exists.
 * Switches to Home automatically when session is set.
 *
 * @param {{ session: object|null }} props
 */
const MyStack = ({ session }) => {
  return (
    <Stack.Navigator>
      {session ? (
        <Stack.Screen
          name="Home"
          options={{
            headerShown: true,
            title: "FishLake",
            headerRight: () => (
              <TouchableOpacity onPress={() => supabase.auth.signOut()}>
                <Text style={{ color: "#4285F4", marginRight: 10 }}>Logout</Text>
              </TouchableOpacity>
            ),
          }}
        >
          {(props) => <HomeScreen {...props} session={session} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default MyStack;
