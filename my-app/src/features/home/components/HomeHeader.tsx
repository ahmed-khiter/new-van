import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function HomeHeader() {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.brand}>SWIPPED.</Text>
      <View style={styles.iconsContainer}>
        <Pressable style={styles.iconButton} android_ripple={{ color: "#f0f0f0" }}>
          <MaterialIcons name="shopping-cart" size={20} color="#1a1a2e" />
        </Pressable>
        <Pressable style={styles.iconButton} android_ripple={{ color: "#f0f0f0" }}>
          <MaterialIcons name="notifications" size={20} color="#1a1a2e" />
        </Pressable>
        <Pressable style={styles.iconButton} android_ripple={{ color: "#f0f0f0" }}>
          <MaterialIcons name="person" size={20} color="#1a1a2e" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#faf9f7",
  },
  brand: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a2e",
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ececec",
    alignItems: "center",
    justifyContent: "center",
  },
});
