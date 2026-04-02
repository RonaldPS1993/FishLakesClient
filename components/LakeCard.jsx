import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // still used for heart icon

/**
 * Lake card overlay component with photo, name, stats, and heart icon.
 * Rendered as an absolute-positioned overlay at the bottom of the map screen.
 *
 * @param {Object} props.lake - Lake object with hylak_id, lake_name, depth_avg, lake_area, photo_url
 * @param {boolean} props.isFavorite - Whether this lake is the user's current favorite
 * @param {Function} props.onFavoriteToggle - Called with lake.hylak_id when heart is tapped
 * @param {Function} props.onPress - Called when card body is tapped (navigate to Lake Detail)
 */
export default function LakeCard({ lake, isFavorite, onFavoriteToggle, onPress }) {
  return (
    <View style={styles.lakeCard}>
      {/* Card body and heart are siblings — NOT nested — to avoid touch event issues */}
      <TouchableOpacity style={styles.lakeCardTouchable} activeOpacity={0.9} onPress={onPress}>
        <View style={styles.lakeCardPhotoWrap}>
          <Image
            source={lake.photo_url ? { uri: lake.photo_url } : require("../assets/defaultLake.png")}
            style={styles.lakeCardPhoto}
          />
        </View>
        <View style={styles.lakeCardInfo}>
          <Text style={styles.lakeCardName} numberOfLines={1}>
            {lake.lake_name || "Unknown Lake"}
          </Text>
          <Text style={styles.lakeCardDetail}>
            {lake.lake_area ? `${lake.lake_area.toFixed(1)} km\u00B2` : ""}
            {lake.lake_area && lake.depth_avg ? " \u00B7 " : ""}
            {lake.depth_avg ? `${lake.depth_avg.toFixed(1)} m deep` : ""}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.heartButton}
        onPress={() => onFavoriteToggle(lake.hylak_id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={isFavorite ? "heart" : "heart-outline"}
          size={22}
          color={isFavorite ? "#EF4444" : "#6B7280"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  lakeCard: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lakeCardTouchable: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  lakeCardPhotoWrap: {
    alignItems: "center",
    width: 56,
  },
  lakeCardPhoto: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  lakeCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  lakeCardName: {
    fontFamily: "poppins_bold",
    fontSize: 15,
    color: "#1A1A2E",
  },
  lakeCardDetail: {
    fontFamily: "poppins_regular",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  heartButton: {
    padding: 8,
  },
});
