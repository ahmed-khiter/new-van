import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { FEATURE_GRID, COMING_SOON_ITEMS } from "@/features/home/constants/homeContent";

const TRANSLATIONS: Record<string, string> = {
  "promotional_slider.slide4.title": "Just a swipe away",
  "promotional_slider.slide4.desc": "Every service you need, one tap away.",
  "promotional_slider.slide3.title": "Partner with us",
  "promotional_slider.slide3.desc": "Grow your business and reach more customers.",
  "promotional_slider.slide6.title": "One platform",
  "promotional_slider.slide6.desc": "Access everything instantly, wherever you are.",
  "promotional_slider.slide1.title": "Swipped Business",
  "promotional_slider.slide1.desc": "Payments, expenses, and earnings — all in one place.",
  "promotional_slider.slide5.title": "Fulfilment",
  "promotional_slider.slide5.desc": "Store, pack, and ship — we handle logistics.",
  "promotional_slider.slide7.title": "Virtual Land",
  "promotional_slider.slide7.desc": "Own digital assets built for the future.",
  "promotional_slider.slide8.title": "Crowdfunding",
  "promotional_slider.slide8.desc": "Back the future of connected services.",
};

const t = (key: string) => TRANSLATIONS[key] || key;

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

      {/* Feature List (2x2 Grid) */}
      <View style={styles.featureListContainer}>
        {FEATURE_GRID.map((feature) => (
          <View key={feature.id} style={styles.featureItemGrid}>
            {/* Icon Circle */}
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: feature.color },
              ]}
            >
              <Feather
                name={feature.icon as any}
                size={28}
                color={feature.iconColor}
              />
            </View>

            {/* Title */}
            <Text style={styles.featureTitle}>{t(feature.title)}</Text>

            {/* Description */}
            <Text style={styles.featureDescription}>
              {t(feature.description)}
            </Text>
          </View>
        ))}
      </View>

      {/* Coming Soon Section */}
      <View style={styles.comingSoonHeader}>
        <Text style={styles.comingSoonTitle}>Coming Soon</Text>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonBadgeText}>STAY TUNED</Text>
        </View>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.comingSoonScroll}
      >
        {COMING_SOON_ITEMS.map((feature) => (
          <View key={feature.id} style={styles.comingSoonCard}>
            <View style={[styles.iconCircle, { backgroundColor: feature.color }]}>
              <Feather name={feature.icon as any} size={28} color={feature.iconColor} />
            </View>
            <Text style={styles.featureTitle}>{t(feature.title)}</Text>
            <Text style={styles.featureDescription}>{t(feature.description)}</Text>
          </View>
        ))}
      </ScrollView>
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 24,
  },
  featureItemGrid: {
    width: "48%",
    alignItems: "center",
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
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: "100%",
  },
  comingSoonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 48,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  comingSoonBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  comingSoonBadgeText: {
    color: "#92400e",
    fontSize: 12,
    fontWeight: "700",
  },
  comingSoonScroll: {
    gap: 16,
    paddingBottom: 16,
  },
  comingSoonCard: {
    width: 180,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
});
