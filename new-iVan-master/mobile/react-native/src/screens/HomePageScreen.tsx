import React from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ServiceCarousel from "../components/ServiceCarousel";
import TypewriterPlaceholder from "../components/TypewriterPlaceholder";
import {
  bookingServices,
  comingSoonItems,
  featureGrid,
  HERO_IMAGES,
  orderingServices,
  reservationServices,
  selectedLocation,
  stats,
  TYPEWRITER_PHRASES,
} from "../data/homePageMock";

type Props = {
  onOpenLocation?: () => void;
  onExplorePress?: () => void;
  onGetStarted?: () => void;
  onSelectService?: (serviceId: string) => void;
};

export default function HomePageScreen({
  onOpenLocation,
  onExplorePress,
  onGetStarted,
  onSelectService,
}: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroFloating}>
            {HERO_IMAGES.map((uri, i) => (
              <Image key={uri} source={{ uri }} style={[styles.floatImage, FLOAT_POSITIONS[i]]} />
            ))}
          </View>

          <Pressable onPress={onOpenLocation} style={styles.locationBadge}>
            <Text style={styles.locationText}>
              {selectedLocation.flag} {selectedLocation.name}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#0f172a" />
          </Pressable>

          <Text style={styles.heroTitle}>
            Your <Text style={styles.accent}>everyday</Text> platform{"\n"}
            for everything you need.
          </Text>
          <Text style={styles.heroSubtitle}>
            Order from retail stores, restaurants and services in one place.
          </Text>

          <View style={styles.chips}>
            {["Order", "Book", "Connect", "Earn"].map((chip, idx) => (
              <View key={chip} style={[styles.chip, CHIP_COLORS[idx]]}>
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.statsRow} onPress={onOpenLocation}>
            <Text style={styles.statsText}>
              {stats.totalServices} services · {stats.globalUsers.toLocaleString()} global users ·{" "}
              {stats.nearbyUsers.toLocaleString()} in {selectedLocation.name}
            </Text>
          </Pressable>

          <Pressable style={styles.searchWrap} onPress={onExplorePress}>
            <Text style={styles.domain}>swipped.co.uk/</Text>
            <TypewriterPlaceholder phrases={TYPEWRITER_PHRASES} style={styles.typewriter} />
            <View style={styles.exploreBtn}>
              <Text style={styles.exploreText}>Explore</Text>
            </View>
          </Pressable>
        </View>


        <View style={styles.sectionPadding}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>On Demand</Text>
            <View style={[styles.badge, { backgroundColor: "#FCE7F3" }]}>
              <Text style={styles.badgeText}>Delivered Within 60 Minutes</Text>
            </View>
          </View>
          <View style={styles.bikeRow}>
            <MaterialCommunityIcons name="motorbike" size={20} color="#ec4899" />
            <Text style={styles.sectionSub}>Products, food and groceries delivered to you.</Text>
          </View>
          <ServiceCarousel
            title=""
            badge=""
            badgeColor="#fff"
            subtitle=""
            services={orderingServices}
            onPressService={(service) => onSelectService?.(service.id)}
          />

          <ServiceCarousel
            title="Book Now"
            badge="Book in Seconds"
            badgeColor="#FEF3C7"
            subtitle="Reserve a table, book a session or schedule an appointment."
            services={reservationServices}
            onPressService={(service) => onSelectService?.(service.id)}
          />

          <ServiceCarousel
            title="Services"
            badge="Instant Dispatch"
            badgeColor="#D1FAE5"
            subtitle="Cleaning, repairs, deliveries and more, on demand."
            services={bookingServices}
            onPressService={(service) => onSelectService?.(service.id)}
          />
        </View>

        <View style={styles.headline}>
          <Text style={styles.headlineTitle}>
            Everything in one place.{"\n"}Built for <Text style={styles.accent}>you</Text>.
          </Text>
          <Text style={styles.headlineSub}>
            Order, book, connect, and earn from a single platform designed for daily life.
          </Text>
        </View>

        <View style={styles.gridCard}>
          {featureGrid.map((item) => (
            <View key={item.id} style={styles.gridCell}>
              <View style={[styles.gridIcon, { backgroundColor: item.color }]} />
              <Text style={styles.gridTitle}>{item.title}</Text>
              <Text style={styles.gridDesc}>{item.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.comingSection}>
          <Text style={styles.comingTitle}>Coming soon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.comingTrack}>
            {comingSoonItems.map((item) => (
              <View key={item.id} style={styles.comingCard}>
                <View style={[styles.comingIcon, { backgroundColor: item.color }]} />
                <Text style={styles.comingCardTitle}>{item.title}</Text>
                <Text style={styles.comingCardDesc}>{item.description}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaTitle}>Start using Swipped today.</Text>
          <Pressable style={styles.ctaButton} onPress={onGetStarted}>
            <Text style={styles.ctaButtonText}>Get Started</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const FLOAT_POSITIONS = [
  { top: 12, left: 14 },
  { top: 68, right: 18 },
  { top: 138, left: 24 },
  { top: 196, right: 28 },
  { top: 256, left: 40 },
] as const;

const CHIP_COLORS = [
  { backgroundColor: "#FCE7F3" },
  { backgroundColor: "#FEF3C7" },
  { backgroundColor: "#EDE9FE" },
  { backgroundColor: "#D1FAE5" },
] as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  content: { paddingBottom: 36 },
  hero: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  heroFloating: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, opacity: 0.13 },
  floatImage: { position: "absolute", width: 90, height: 90, borderRadius: 18 },
  locationBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: { color: "#0f172a", fontSize: 13, fontWeight: "700" },
  heroTitle: { marginTop: 14, fontSize: 30, lineHeight: 36, fontWeight: "900", color: "#0f172a" },
  accent: { color: "#ec4899" },
  heroSubtitle: { marginTop: 10, color: "#475569", fontSize: 15, lineHeight: 22 },
  chips: { marginTop: 14, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  chipText: { color: "#111827", fontSize: 12, fontWeight: "700" },
  statsRow: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 10,
  },
  statsText: { color: "#334155", fontSize: 13, fontWeight: "600" },
  searchWrap: {
    marginTop: 14,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 10,
    gap: 8,
  },
  domain: { color: "#cbd5e1", fontSize: 12, fontWeight: "600" },
  typewriter: { color: "#ffffff", flex: 1, fontSize: 13, fontWeight: "700" },
  exploreBtn: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  exploreText: { color: "#052e16", fontWeight: "800", fontSize: 12 },
  promoBanner: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#1d4ed8",
  },
  promoEyebrow: { color: "#bfdbfe", fontWeight: "700", fontSize: 12 },
  promoTitle: { color: "#ffffff", fontWeight: "900", fontSize: 22, marginTop: 6 },
  promoSub: { color: "#dbeafe", marginTop: 4, fontSize: 14 },
  promoCode: { color: "#fff", fontWeight: "900" },
  sectionPadding: { paddingHorizontal: 16, marginTop: 18 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" },
  sectionTitle: { fontSize: 24, fontWeight: "900", color: "#0f172a" },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontWeight: "700", color: "#111827", fontSize: 12 },
  bikeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  sectionSub: { color: "#475569", fontSize: 14 },
  headline: { marginTop: 26, paddingHorizontal: 16 },
  headlineTitle: { fontSize: 30, lineHeight: 36, color: "#0f172a", fontWeight: "900" },
  headlineSub: { marginTop: 8, color: "#475569", fontSize: 15, lineHeight: 22 },
  gridCard: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridCell: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 10,
  },
  gridIcon: { width: 32, height: 32, borderRadius: 10, marginBottom: 8 },
  gridTitle: { color: "#0f172a", fontWeight: "800", fontSize: 14 },
  gridDesc: { color: "#64748b", marginTop: 4, fontSize: 12, lineHeight: 18 },
  comingSection: { marginTop: 18, paddingLeft: 16 },
  comingTitle: { color: "#111827", fontSize: 22, fontWeight: "900", marginBottom: 10 },
  comingTrack: { gap: 12, paddingRight: 16 },
  comingCard: {
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
  },
  comingIcon: { width: 32, height: 32, borderRadius: 10, marginBottom: 8 },
  comingCardTitle: { color: "#0f172a", fontWeight: "800", fontSize: 15 },
  comingCardDesc: { color: "#64748b", marginTop: 4, fontSize: 12, lineHeight: 18 },
  cta: {
    marginHorizontal: 16,
    marginTop: 22,
    borderRadius: 18,
    backgroundColor: "#111827",
    padding: 16,
    alignItems: "center",
  },
  ctaTitle: { color: "#fff", fontWeight: "900", fontSize: 24, textAlign: "center" },
  ctaButton: {
    marginTop: 12,
    backgroundColor: "#22c55e",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  ctaButtonText: { color: "#052e16", fontWeight: "900", fontSize: 14 },
});
