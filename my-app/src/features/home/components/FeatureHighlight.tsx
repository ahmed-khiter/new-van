import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
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
        <Text style={styles.headlineText}>Everything in one place.</Text>
        <View style={styles.headlineRow}>
          <Text style={styles.headlineText}>Built for </Text>
          <MaskedView
            maskElement={<Text style={styles.headlineText}>you</Text>}
          >
            <LinearGradient
              colors={["#FF385C", "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.headlineText, { opacity: 0 }]}>you</Text>
            </LinearGradient>
          </MaskedView>
          <Text style={styles.headlineText}>.</Text>
        </View>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitleText}>
        Order, book, connect, and earn — all from a single platform designed to
        simplify your day.
      </Text>

      {/* Feature List — vertically stacked cells in a rounded card */}
      <View style={styles.featureCard}>
        {FEATURE_GRID.map((feature, index) => (
          <View
            key={feature.id}
            style={[
              styles.featureCell,
              index < FEATURE_GRID.length - 1 && styles.featureCellBorder,
            ]}
          >
            <View style={[styles.iconBubble, { backgroundColor: feature.color }]}>
              <Feather name={feature.icon as any} size={22} color={feature.iconColor} />
            </View>
            <Text style={styles.featureTitle}>{t(feature.title)}</Text>
            <Text style={styles.featureDescription}>{t(feature.description)}</Text>
          </View>
        ))}
      </View>

      {/* Coming Soon */}
      <View style={styles.comingSoonHeader}>
        <Text style={styles.comingSoonLabel}>Coming soon</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.comingSoonScroll}
      >
        {COMING_SOON_ITEMS.map((feature) => (
          <View key={feature.id} style={styles.comingSoonCard}>
            <View style={[styles.iconBubble, { backgroundColor: feature.color }]}>
              <Feather name={feature.icon as any} size={22} color={feature.iconColor} />
            </View>
            <Text style={styles.comingSoonCardTitle}>{t(feature.title)}</Text>
            <Text style={styles.featureDescription}>{t(feature.description)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 55,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
  },
  headlineContainer: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headlineText: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1a1a2e",
    lineHeight: 34,
    textAlign: "center",
    letterSpacing: -1.05,
  },
  subtitleText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  featureCard: {
    marginTop: 32,
    gap:20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  featureCell: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  featureCellBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: "OpenSans_700Bold",
    color: "#1a1a2e",
    textAlign: "center",
    letterSpacing: -0.16,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 13.5,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 21,
  },
  comingSoonHeader: {
    marginTop: 40,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  comingSoonLabel: {
    fontSize: 13,
    fontFamily: "OpenSans_600SemiBold",
    color: "#9ca3af",
    letterSpacing: 1.04,
    textAlign: "center",
    textTransform: "uppercase",
  },
  comingSoonScroll: {
    gap: 16,
    paddingBottom: 4,
  },
  comingSoonCard: {
    width: 198,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    gap: 5,
  },
  comingSoonCardTitle: {
    fontSize: 15,
    fontFamily: "OpenSans_700Bold",
    color: "#1a1a2e",
    textAlign: "center",
    marginBottom: 2,
  },
});
