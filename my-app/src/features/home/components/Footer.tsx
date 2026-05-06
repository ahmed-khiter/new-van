import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";

export default function Footer() {
  return (
    <View style={styles.container}>
      {/* Row 1: Logo */}
      <Text style={styles.logo}>SWIPPED.</Text>

      {/* Row 2: Tagline */}
      <Text style={styles.tagline}>Order, book, connect & earn — all from one platform.</Text>

      {/* Row 3: App store badges */}
      <View style={styles.badgesRow}>
        {/* App Store Button */}
        <Pressable style={styles.badgeButton}>
          <AntDesign name="apple1" size={18} color="#fff" />
          <Text style={styles.badgeText}>App Store</Text>
        </Pressable>

        {/* Google Play Button */}
        <Pressable style={styles.badgeButton}>
          <MaterialIcons name="android" size={18} color="#fff" />
          <Text style={styles.badgeText}>Google Play</Text>
        </Pressable>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Row 4: Nav columns */}
      <View style={styles.navRow}>
        {/* Column 1: EXPLORE */}
        <View style={styles.navColumn}>
          <Text style={styles.navHeader}>EXPLORE</Text>
          <Text style={styles.navLink}>Home</Text>
          <Text style={styles.navLink}>Stores</Text>
          <Text style={styles.navLink}>Order food</Text>
          <Text style={styles.navLink}>Services</Text>
        </View>

        {/* Column 2: COMPANY */}
        <View style={styles.navColumn}>
          <Text style={styles.navHeader}>COMPANY</Text>
          <Text style={styles.navLink}>About Us</Text>
          <Text style={styles.navLink}>Partner with us</Text>
        </View>

        {/* Column 3: TERMS */}
        <View style={styles.navColumn}>
          <Text style={styles.navHeader}>TERMS</Text>
          <Text style={styles.navLink}>Terms</Text>
          <Text style={styles.navLink}>Privacy</Text>
          <Text style={styles.navLink}>Cookies</Text>
        </View>
      </View>

      {/* Row 5: Copyright */}
      <Text style={styles.copyright}>Swipped © 2026. All Rights Reserved</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111827",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
  },
  tagline: {
    marginTop: 6,
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 18,
  },
  badgesRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
  },
  badgeButton: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#374151",
  },
  badgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  divider: {
    marginTop: 24,
    marginBottom: 20,
    height: 1,
    backgroundColor: "#1f2937",
  },
  navRow: {
    flexDirection: "row",
    gap: 32,
  },
  navColumn: {
    flex: 1,
  },
  navHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  navLink: {
    fontSize: 12,
    color: "#d1d5db",
    marginTop: 4,
  },
  copyright: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 11,
    color: "#6b7280",
  },
});
