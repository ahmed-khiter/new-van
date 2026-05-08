import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import HomeHeader from "@/features/home/components/HomeHeader";
import PromoBanner from "@/features/home/components/PromoBanner";
import TypewriterPlaceholder from "@/features/home/components/TypewriterPlaceholder";
import { TYPEWRITER_PHRASES } from "@/features/home/constants/homeContent";
import type { Location } from "@/features/home/types";

type Props = {
  currentLocation: Location;
  totalServices: number;
  globalUserCount: number | null;
  locationUserCount: number | null;
  onLocationPress: () => void;
  onExplorePress?: () => void;
};

export default function HeroSection({
  currentLocation,
  totalServices,
  globalUserCount,
  locationUserCount,
  onLocationPress,
  onExplorePress,
}: Props) {
  return (
    <View style={styles.container}>
      <HomeHeader />

      <View style={styles.paddedContainer}>
        {/* Location + stats row */}
        <Pressable style={styles.statsRow} onPress={onLocationPress}>
          <Text style={styles.flagText}>{currentLocation.flag}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={16} color="#111827" style={styles.chevron} />
          <Text style={styles.statsText}>
            {"  "}· {totalServices} services · {globalUserCount ?? "–"} Global users ·{" "}
            {locationUserCount ?? "–"} in {currentLocation.name}
          </Text>
        </Pressable>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.domainPrefix}>swipped.co.uk/</Text>
          <TypewriterPlaceholder
            phrases={TYPEWRITER_PHRASES}
            style={styles.typewriter}
          />
          <Pressable
            onPress={onExplorePress}
            android_ripple={{ color: "#ff6b8a" }}
          >
            <LinearGradient
              colors={["#ff385c", "#ff7eb3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.exploreButton}
            >
              <Text style={styles.exploreText}>Explore</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <PromoBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  paddedContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  flagText: {
    fontSize: 18,
  },
  chevron: {
    marginLeft: -2,
  },
  statsText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 0,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 999,
    backgroundColor: "#fff",
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
  },
  domainPrefix: {
    fontSize: 13,
    color: "#9ca3af",
  },
  typewriter: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
    marginLeft: 4,
  },
  exploreButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  exploreText: {
    fontSize: 13,
    fontFamily: "OpenSans_700Bold",
    color: "#fff",
  },
});
