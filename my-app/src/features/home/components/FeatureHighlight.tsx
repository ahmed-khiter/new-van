import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { FEATURE_GRID } from "@/features/home/constants/homeContent";

const ICON_MAP: Record<string, { name: string; color: string }> = {
  global: { name: "language", color: "#1d4ed8" },
  trusted: { name: "favorite", color: "#db2777" },
  fast: { name: "check-circle", color: "#059669" },
  rewards: { name: "star", color: "#7c3aed" },
};

export default function FeatureHighlight() {
  return (
    <View style={styles.container}>
      {/* Headline */}
      <View style={styles.headlineContainer}>
        <Text style={styles.headlineText}>
          Everything in one place.
        </Text>
        <Text style={styles.headlineText}>
          Built for <Text style={styles.youText}>you.</Text>
        </Text>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitleText}>
        Order, book, connect, and earn — all from a single platform designed to
        simplify your day.
      </Text>

      {/* Feature List */}
      <View style={styles.featureListContainer}>
        {FEATURE_GRID.map((feature) => {
          const iconConfig = ICON_MAP[feature.id];
          return (
            <View key={feature.id} style={styles.featureItem}>
              {/* Icon Circle */}
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: feature.color },
                ]}
              >
                <MaterialIcons
                  name={iconConfig.name as any}
                  size={28}
                  color={iconConfig.color}
                />
              </View>

              {/* Title */}
              <Text style={styles.featureTitle}>{feature.title}</Text>

              {/* Description */}
              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: "#faf9f7",
  },
  headlineContainer: {
    alignItems: "center",
  },
  headlineText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 36,
    textAlign: "center",
  },
  youText: {
    color: "#a853cf",
    fontStyle: "italic",
  },
  subtitleText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  featureListContainer: {
    marginTop: 32,
  },
  featureItem: {
    alignItems: "center",
    paddingVertical: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
});
