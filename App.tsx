import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import MyStack from "./Navigation/StackNavigator";

export default function App() {
  return (
    <NavigationContainer>
      <MyStack />
    </NavigationContainer>
  );
}
