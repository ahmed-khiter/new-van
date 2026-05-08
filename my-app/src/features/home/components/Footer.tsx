import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function Footer() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>swipped.</Text>
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
    backgroundColor: "#0a0a0a",
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  logo: {
    fontSize: 30,
    fontWeight: "800",
    fontStyle: "italic",
    letterSpacing: -1.6,
    color: "#ffffff",
    textAlign: "center",
  },
  tagline: {
    marginTop: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
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
    fontFamily: "OpenSans_700Bold",
    color: "#fff",
    lineHeight: 16,
  },
  divider: {
    marginVertical: 24,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignSelf: "stretch",
  },
  navRow: {
    flexDirection: "row",
    alignSelf: "stretch",
    justifyContent: "space-between",
  },
  navColumn: {},
  navHeader: {
    fontSize: 10,
    fontFamily: "OpenSans_600SemiBold",
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  navLink: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    marginTop: 6,
    lineHeight: 20,
  },
  copyright: {
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
  },
});
