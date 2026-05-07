import React from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getApiBaseUrl } from "@/constants/env";
import type { ServiceItem } from "@/features/home/types";

function resolveUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${getApiBaseUrl()}${path}`;
}

type Props = {
  title: string;
  badge: string;
  badgeColor: string;
  badgeTextColor?: string;
  subtitle: string;
  services: ServiceItem[];
  onPressService?: (service: ServiceItem) => void;
};

function getServiceImage(service: ServiceItem): string {
  return (
    resolveUrl(service.image) ||
    resolveUrl(service.images?.list_service_img) ||
    resolveUrl(service.images?.background) ||
    resolveUrl(service.images?.slider) ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
  );
}

export default function ServiceCarousel({
  title,
  badge,
  badgeColor,
  badgeTextColor = "#111827",
  subtitle,
  services,
  onPressService,
}: Props) {
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = (screenWidth - 48) / 2;
  const displayServices = services.slice(0, 4);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>{badge}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.grid}>
        {displayServices.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.card, { width: cardWidth }]}
            onPress={() => onPressService?.(item)}
            android_ripple={{ color: "#ececec" }}
          >
            <Image source={{ uri: getServiceImage(item) }} style={styles.image} />
            <View style={styles.overlay} />
            <Text style={styles.cardTitle}>{item.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { color: "#111827", fontSize: 12, fontWeight: "700" },
  subtitle: { color: "#4b5563", marginBottom: 12, fontSize: 14 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  card: {
    height: 130,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardTitle: {
    position: "absolute",
    left: 10,
    bottom: 10,
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
