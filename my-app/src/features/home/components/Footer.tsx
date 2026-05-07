import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function Footer() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SWIPPED.</Text>
      <Text style={styles.tagline}>
        Order, book, connect & earn — all from one platform.
      </Text>

      <View style={styles.badgesRow}>
        <Pressable style={styles.badge}>
          <AntDesign name="apple" size={22} color="#fff" />
          <View>
            <Text style={styles.badgeSmall}>Download on the</Text>
            <Text style={styles.badgeLarge}>App Store</Text>
          </View>
        </Pressable>

        <Pressable style={styles.badge}>
          <MaterialIcons name="play-arrow" size={24} color="#fff" />
          <View>
            <Text style={styles.badgeSmall}>GET IT ON</Text>
            <Text style={styles.badgeLarge}>Google Play</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.navRow}>
        <View style={styles.navColumn}>
          <Text style={styles.navHeader}>EXPLORE</Text>
          <Text style={styles.navLink}>Home</Text>
          <Text style={styles.navLink}>Stores</Text>
          <Text style={styles.navLink}>Order food</Text>
          <Text style={styles.navLink}>Services</Text>
        </View>

        <View style={styles.navColumn}>
          <Text style={styles.navHeader}>COMPANY</Text>
          <Text style={styles.navLink}>About Us</Text>
          <Text style={styles.navLink}>Partner with us</Text>
        </View>

        <View style={styles.navColumn}>
          <Text style={styles.navHeader}>LEGAL</Text>
          <Text style={styles.navLink}>Terms</Text>
          <Text style={styles.navLink}>Privacy</Text>
          <Text style={styles.navLink}>Cookies</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.copyright}>Swipped © 2026. All Rights Reserved.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0a0a0aff",
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  logo: {
    fontSize: 22,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#ffffff",
    textAlign: "center",
  },
  tagline: {
    marginTop: 8,
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
  badgesRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
  },
  badge: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeSmall: {
    fontSize: 9,
    color: "#fff",
    letterSpacing: 0.3,
  },
  badgeLarge: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 16,
  },
  divider: {
    marginVertical: 24,
    height: 1,
    backgroundColor: "#1e293b",
    alignSelf: "stretch",
  },
  navRow: {
    flexDirection: "row",
    alignSelf: "stretch",
    justifyContent: "space-between",
  },
  navColumn: {},
  navHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  navLink: {
    fontSize: 13,
    color: "#cbd5e1",
    marginTop: 6,
  },
  copyright: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
  },
});
