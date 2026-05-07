import React from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
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
  isCarousel?: boolean;
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
  isCarousel = true,
}: Props) {
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = (screenWidth - 48) / 2;
  const displayServicesGrid = services.slice(0, 4);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>{badge}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {isCarousel ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
        >
          {services.map((item) => (
            <Pressable
              key={item.id}
              style={styles.cardCarousel}
              onPress={() => onPressService?.(item)}
              android_ripple={{ color: "#ececec" }}
            >
              <Image source={{ uri: getServiceImage(item) }} style={styles.image} />
              <View style={styles.overlay} />
              <Text style={styles.cardTitleCarousel}>{item.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.grid}>
          {displayServicesGrid.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.cardGrid, { width: cardWidth }]}
              onPress={() => onPressService?.(item)}
              android_ripple={{ color: "#ececec" }}
            >
              <Image source={{ uri: getServiceImage(item) }} style={styles.image} />
              <View style={styles.overlay} />
              <Text style={styles.cardTitleGrid}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
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
  carouselContainer: {
    gap: 12,
    marginTop: 4,
    paddingRight: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  cardCarousel: {
    width: 150,
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  cardGrid: {
    height: 130,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 12,
  },
  image: { 
    ...StyleSheet.absoluteFillObject,
    width: "100%", 
    height: "100%", 
    resizeMode: "cover" 
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardTitleCarousel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
    paddingHorizontal: 8,
    zIndex: 1,
  },
  cardTitleGrid: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
    paddingHorizontal: 8,
    zIndex: 1,
  },
});
