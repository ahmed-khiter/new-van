import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

type Props = {
  onGetStarted?: () => void;
};

export default function CtaBlock({ onGetStarted }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start using Swipped today.</Text>
      <Pressable
        style={styles.button}
        onPress={onGetStarted}
        android_ripple={{ color: "#333" }}
      >
        <Text style={styles.buttonText}>Get Started →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
    backgroundColor: "#faf9f7",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1a1a2e",
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#1a1a2e",
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
