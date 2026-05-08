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
  // 12px container padding each side + 12px gap between 2 columns
  const gridCardWidth = (screenWidth - 24 - 12) / 2;
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
              android_ripple={{ color: "#333" }}
            >
              <Image source={{ uri: getServiceImage(item) }} style={styles.image} />
              {/* Bottom-heavy overlay: full dim layer + stronger bottom layer */}
              <View style={styles.overlayBase} />
              <View style={styles.overlayBottom} />
              <Text style={styles.cardTitle}>{item.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.grid}>
          {displayServicesGrid.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.cardGrid, { width: gridCardWidth }]}
              onPress={() => onPressService?.(item)}
              android_ripple={{ color: "#333" }}
            >
              <Image source={{ uri: getServiceImage(item) }} style={styles.image} />
              <View style={styles.overlayBase} />
              <View style={styles.overlayBottom} />
              <Text style={styles.cardTitle}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 28 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: "900",
    color: "#1a1a2e",
    letterSpacing: 0.76,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "OpenSans_700Bold",
  },
  subtitle: {
    color: "#9ca3af",
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 18,
  },
  carouselContainer: {
    gap: 8,
    paddingRight: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  cardCarousel: {
    width: 122,
    height: 122,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  cardGrid: {
    height: 111,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlayBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  overlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.39,
    textAlign: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    zIndex: 1,
  },
});
