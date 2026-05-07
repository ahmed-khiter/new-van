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
        <Text style={styles.eyebrow}>Limited time offer</Text>
        <Text style={styles.priceText}>15% off</Text>
        <Text style={styles.subtitleText}>
          your first taxi ride · use code{" "}
          <Text style={styles.codeText}>SWIPPED15</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    borderRadius: 20,
    overflow: "hidden",
    height: 180,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.50)",
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: "OpenSans_600SemiBold",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 44,
    fontFamily: "OpenSans_700Bold",
    color: "#fff",
    lineHeight: 48,
    letterSpacing: -1,
  },
  subtitleText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },
  codeText: {
    fontFamily: "OpenSans_700Bold",
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
});
