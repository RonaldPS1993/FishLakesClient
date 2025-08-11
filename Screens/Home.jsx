import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Dimensions,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useFonts } from "expo-font";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const INITIAL_LATITUDE_DELTA = 0.02;

const Home = () => {
  const [fontsLoaded] = useFonts({
    poppins_regular: require("../assets/fonts/Poppins-Regular.ttf"),
    poppins_bold: require("../assets/fonts/Poppins-Bold.ttf"),
    poppins_mediums: require("../assets/fonts/Poppins-Medium.ttf"),
  });
  const [region, setRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [nearbyLakes, setNearbyLakes] = useState([]); // Add this line
  const fetchTimeoutRef = useRef(null);
  const requestIdRef = useRef(0);

  const caculateRadius = (deltaLat) => {
    let radiusMiles = deltaLat * 69;
    let radiusMeters = radiusMiles * 1609.34;

    return radiusMeters;
  };

  const searchNearbyLakes = async (latitude, longitude, radius) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
          `location=${latitude},${longitude}&` +
          `radius=${radius}&` +
          `type=natural_feature&` +
          `keyword=lake&` +
          `key=${GOOGLE_API_KEY}`
      );

      const data = await response.json();

      if (data.status === "OK") {
        return data.results;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error fetching nearby lakes:", error);
      return [];
    }
  };

  const doFetchForRegion = async (region) => {
    const radius = caculateRadius(region.latitudeDelta);
    const results = await searchNearbyLakes(
      region.latitude,
      region.longitude,
      radius
    );

    for (const element of results) {
      console.log(element.name);
    }
    console.log("SPACE");

    setNearbyLakes(results);
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      try {
        let position = await Location.getCurrentPositionAsync({
          accuracy: Location.LocationAccuracy.Lowest,
        });

        const newRegion = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: INITIAL_LATITUDE_DELTA,
          longitudeDelta: 0.02,
        };

        setRegion(newRegion);

        const initialRadius = caculateRadius(INITIAL_LATITUDE_DELTA);

        const lakes = await searchNearbyLakes(
          position.coords.latitude,
          position.coords.longitude,
          initialRadius
        );

        setNearbyLakes(lakes); // Store the lakes in state
      } catch (error) {
        console.error("Error getting location:", error);
      }
    })();
  }, []);

  const handleRegionChange = async (region) => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(() => {
      doFetchForRegion(region);
    }, 300);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {region.latitude !== 0 && ( // Only render map when we have valid coordinates
        <MapView
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChange}
          showsPointsOfInterest={false}
        >
          {nearbyLakes.map((marker) => (
            <Marker
              key={marker.place_id}
              coordinate={{
                latitude: marker.geometry.location.lat,
                longitude: marker.geometry.location.lng,
              }}
              pinColor="#82FFBA"
              title={marker.name}
            />
          ))}
        </MapView>
      )}
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
  },
});
