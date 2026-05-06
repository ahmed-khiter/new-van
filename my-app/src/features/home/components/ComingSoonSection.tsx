import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COMING_SOON_ITEMS } from "@/features/home/constants/homeContent";

const ICON_MAP: Record<string, { name: string; color: string }> = {
  storage: { name: "luggage", color: "#ea580c" },
  "smart-lockers": { name: "lock", color: "#d97706" },
  community: { name: "people", color: "#ec4899" },
};

export default function ComingSoonSection() {
  return (
    <View style={styles.container}>
      {/* Label Row */}
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>COMING SOON</Text>
      </View>

      {/* Horizontal ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {COMING_SOON_ITEMS.map((item) => {
          const iconConfig = ICON_MAP[item.id];
          return (
            <View key={item.id} style={styles.card}>
              {/* Icon Circle */}
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: item.color },
                ]}
              >
                <MaterialIcons
                  name={iconConfig.name as any}
                  size={24}
                  color={iconConfig.color}
                />
              </View>

              {/* Title */}
              <Text style={styles.title}>{item.title}</Text>

              {/* Description */}
              <Text style={styles.description}>{item.description}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingBottom: 8,
  },
  labelRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  labelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  card: {
    width: 180,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
});
