import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
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

      {/* Padded container for stats and search */}
      <View style={styles.paddedContainer}>
        {/* Stats row */}
        <Pressable style={styles.statsRow} onPress={onLocationPress}>
          <Text style={styles.flagEmoji}>{currentLocation.flag}</Text>
          <Text style={styles.statsText}>
            · {totalServices} services · {globalUserCount ?? "–"} Global users ·{" "}
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
            style={styles.exploreButton}
            onPress={onExplorePress}
            android_ripple={{ color: "#ff6b8a" }}
          >
            <Text style={styles.exploreText}>Explore</Text>
          </Pressable>
        </View>
      </View>

      {/* PromoBanner */}
      <PromoBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#faf9f7",
  },
  paddedContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  flagEmoji: {
    fontSize: 16,
  },
  statsText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 6,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 999,
    backgroundColor: "#fff",
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
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
    backgroundColor: "#ff4d77",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  exploreText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
});
