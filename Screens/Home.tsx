import React, { useState, useEffect } from "react";
import {
  View,
  Dimensions,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
} from "react-native";
import MapView from "react-native-maps";
import * as Location from "expo-location";
import {
  responsiveModerateScale,
  responsiveVerticalScale,
  responsiveScale,
} from "../lib/sizeFunctions";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const Home = () => {
  const [errorMsg, setErrorMsg] = useState(null);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let position = await Location.getCurrentPositionAsync({});

      setRegion({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        <View style={styles.card}></View>
      </MapView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  map: {
    width: "100%",
    height: "100%",
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "flex-end"
  },
  card: {
    width: responsiveScale(300),
    height: responsiveVerticalScale(150),
    backgroundColor: "white",
    borderRadius: responsiveModerateScale(10),
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 10,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    bottom: responsiveModerateScale(50)
  },
});
