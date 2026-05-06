import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

const PROMO_IMAGE_URL =
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80";

export default function PromoBanner() {
  return (
    <View style={styles.container}>
      <Image source={{ uri: PROMO_IMAGE_URL }} style={styles.backgroundImage} />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>LIMITED TIME OFFER</Text>
        </View>
        <Text style={styles.priceText}>15% off</Text>
        <Text style={styles.subtitleText}>
          your first taxi ride · use code SWIPPED15
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    height: 180,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  badge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  priceText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 48,
    marginTop: 28,
  },
  subtitleText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
});
