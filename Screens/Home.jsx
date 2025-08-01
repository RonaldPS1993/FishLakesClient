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
import { useFonts } from "expo-font";

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

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
    
    if (data.status === 'OK') {
      return data.results;
    } else {
      console.error('Error fetching nearby lakes:', data.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching nearby lakes:', error);
    return [];
  }
};

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
  const [latitudeDelta, setLatitudeDelta] = useState(0.02);
  const [nearbyLakes, setNearbyLakes] = useState([]);  // Add this line

  const caculateRadius = (deltaLat) => {
    let radiusMiles = deltaLat * 69
    let radiusMeters = radiusMiles * 1609.34
        
    return radiusMeters
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
          accuracy: Location.LocationAccuracy.Lowest
        });

        const newRegion = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: latitudeDelta,
          longitudeDelta: 0.02,
        };
        
        setRegion(newRegion);

        const lakes = await searchNearbyLakes(
          position.coords.latitude, 
          position.coords.longitude, 
          caculateRadius(latitudeDelta)
        );
        setNearbyLakes(lakes);  // Store the lakes in state
      } catch (error) {
        console.error("Error getting location:", error);
      }
      

    })();
  }, []);

  

  const handleRegionChange = async (region) => {
    console.log(region);
    const lakes = await searchNearbyLakes(region.latitude, region.longitude, caculateRadius(region.latitudeDelta));
    setNearbyLakes(lakes);
    console.log(nearbyLakes.length);
    
  };

  return (
    <View style={styles.container}>
      {region.latitude !== 0 && (  // Only render map when we have valid coordinates
        <MapView 
          style={styles.map} 
          region={region}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChange}
        >
          <View style={styles.card}>
            <Text style={styles.lakeName}>Lake Ronald</Text>
          </View>
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
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "flex-end"
  },
  card: {
    width: responsiveScale(300),
    height: responsiveVerticalScale(150),
    backgroundColor: "white",
    borderRadius: responsiveModerateScale(15),
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
  lakeName: {
    fontSize: responsiveScale(16),
    color: "black",
    paddingLeft: responsiveModerateScale(30),
    paddingTop: responsiveModerateScale(20),
    fontFamily: "poppins_regular"
  },
});
