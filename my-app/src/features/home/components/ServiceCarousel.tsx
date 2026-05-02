import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ServiceItem } from "@/features/home/types";

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
    service.image ||
    service.images?.background ||
    service.images?.slider ||
    service.images?.list_service_img ||
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
  const [activeIndex, setActiveIndex] = useState(0);
  const cardWidth = 236;
  const gap = 12;

  const dots = useMemo(() => Array.from({ length: services.length }), [services.length]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / (cardWidth + gap));
    setActiveIndex(Math.max(0, Math.min(services.length - 1, index)));
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>{badge}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={cardWidth + gap}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => onPressService?.(item)}
            android_ripple={{ color: "#ececec" }}
          >
            <Image source={{ uri: getServiceImage(item) }} style={styles.image} />
            <View style={styles.overlay} />
            <Text style={styles.cardTitle}>{item.name}</Text>
          </Pressable>
        )}
      />

      <View style={styles.dotRow}>
        {dots.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
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
  listContent: { gap: 12, paddingRight: 18 },
  card: {
    width: 236,
    height: 146,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  image: { width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  cardTitle: {
    position: "absolute",
    left: 12,
    bottom: 10,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  dotRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d1d5db" },
  dotActive: { width: 16, backgroundColor: "#111827" },
});
