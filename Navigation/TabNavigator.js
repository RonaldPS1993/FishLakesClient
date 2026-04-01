import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import AuthScreen from "../Screens/AuthScreen";
import CatchesScreen from "../Screens/CatchesScreen";
import ProfileScreen from "../Screens/ProfileScreen";
import MapScreen from "../Screens/MapScreen";
import LakeDetailScreen from "../Screens/LakeDetailScreen";
import HomeScreen from "../Screens/HomeScreen";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

/**
 * Home stack: HomeMain (HomeScreen), LakeDetail, Auth gate
 * @param {{ session: object|null }} props
 */
const HomeStackScreen = ({ session }) => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeMain"
        options={{ headerShown: false }}
      >
        {(props) => <HomeScreen {...props} session={session} />}
      </HomeStack.Screen>
      <HomeStack.Screen
        name="LakeDetail"
        component={LakeDetailScreen}
        options={{ title: "", headerTransparent: true, headerTintColor: "#FFFFFF" }}
      />
      <HomeStack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
};

/**
 * Explore stack: Map (MapScreen), LakeDetail, Auth gate
 */
const ExploreStackScreen = () => {
  return (
    <ExploreStack.Navigator>
      <ExploreStack.Screen
        name="Map"
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <ExploreStack.Screen
        name="LakeDetail"
        component={LakeDetailScreen}
        options={{ title: "", headerTransparent: true, headerTintColor: "#FFFFFF" }}
      />
      <ExploreStack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
    </ExploreStack.Navigator>
  );
};

/**
 * Profile stack: ProfileMain, Auth gate
 * @param {{ session: object|null }} props
 */
const ProfileStackScreen = ({ session }) => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileMain"
        options={{ headerShown: false }}
      >
        {(props) => <ProfileScreen {...props} session={session} />}
      </ProfileStack.Screen>
      <ProfileStack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
};

/**
 * Root bottom tab navigator with 4 tabs: Home, Explore, Catches, Profile.
 * Session-gated tabs (Home, Profile) push AuthScreen when no session.
 *
 * @param {{ session: object|null }} props
 */
const TabNavigator = ({ session }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#0265BF",
        tabBarInactiveTintColor: "#6B7280",
        tabBarLabelStyle: { fontFamily: "poppins_regular", fontSize: 11 },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          height: 85,
          paddingBottom: 25,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconMap = {
            Home: focused ? "home" : "home-outline",
            Explore: focused ? "compass" : "compass-outline",
            Catches: focused ? "fish" : "fish-outline",
            Profile: focused ? "person" : "person-outline",
          };
          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home">
        {(props) => <HomeStackScreen {...props} session={session} />}
      </Tab.Screen>
      <Tab.Screen name="Explore" component={ExploreStackScreen} />
      <Tab.Screen name="Catches" component={CatchesScreen} />
      <Tab.Screen name="Profile">
        {(props) => <ProfileStackScreen {...props} session={session} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default TabNavigator;
