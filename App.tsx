import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import MyStack from "./Navigation/StackNavigator";
import { Provider } from "react-redux";
import store from "./redux/store";

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <MyStack />
      </NavigationContainer>
    </Provider>
  );
}
