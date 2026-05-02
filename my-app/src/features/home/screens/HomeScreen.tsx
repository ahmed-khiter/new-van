import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    Image,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import HomeScreenSkeleton from "@/features/home/components/HomeScreenSkeleton";
import ServiceCarousel from "@/features/home/components/ServiceCarousel";
import TypewriterPlaceholder from "@/features/home/components/TypewriterPlaceholder";
import {
    COMING_SOON_ITEMS,
    DEFAULT_LOCATION,
    FEATURE_GRID,
    HERO_IMAGES,
    LOCATION_OPTIONS,
    TYPEWRITER_PHRASES,
} from "@/features/home/constants/homeContent";
import { useHomeData } from "@/features/home/hooks/useHomeData";

type Props = {
  onOpenLocation?: () => void;
  onExplorePress?: () => void;
  onGetStarted?: () => void;
  onSelectService?: (serviceId: string) => void;
};

export default function HomeScreen({
  onOpenLocation,
  onExplorePress,
  onGetStarted,
  onSelectService,
}: Props) {
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_LOCATION);
  const [pendingLocation, setPendingLocation] = useState(DEFAULT_LOCATION);

  const {
    sections,
    totalServices,
    globalUserCount,
    locationUserCount,
    loading,
    error,
  } = useHomeData(currentLocation);

  const openLocationPicker = () => {
    onOpenLocation?.();
    setPendingLocation(currentLocation);
    setIsLocationModalVisible(true);
  };

  const closeLocationPicker = () => {
    setIsLocationModalVisible(false);
    setPendingLocation(currentLocation);
  };

  const confirmLocationPicker = () => {
    setCurrentLocation(pendingLocation);
    setIsLocationModalVisible(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" backgroundColor="#faf9f7" translucent={false} hidden={false} />
        <HomeScreenSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar
        style="dark"
        backgroundColor="#faf9f7"
        translucent={false}
        hidden={false}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.appHeader}>
            <View style={styles.headerLeft}>
              <Pressable style={styles.headerIconBtn}>
                <Ionicons name="menu" size={20} color="#1a1a2e" />
              </Pressable>
              <Text style={styles.headerTitle}>Swipped</Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable style={styles.headerIconBtn}>
                <Ionicons name="search" size={18} color="#1a1a2e" />
              </Pressable>
              <Pressable style={styles.headerIconBtn}>
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color="#1a1a2e"
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.heroFloating}>
            {HERO_IMAGES.map((uri, i) => (
              <Image
                key={uri}
                source={{ uri }}
                style={[styles.floatImage, FLOAT_POSITIONS[i]]}
              />
            ))}
          </View>

          <Pressable onPress={openLocationPicker} style={styles.locationBadge}>
            <Text style={styles.locationText}>
              {currentLocation.flag} {currentLocation.name}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#ffffff" />
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
              <View
                key={chip}
                style={[styles.chip, { backgroundColor: "#f3f3f7" }]}
              >
                <Text
                  style={[styles.chipText, { color: CHIP_COLORS[idx].color }]}
                >
                  {chip}
                </Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.statsRow} onPress={openLocationPicker}>
            <View style={styles.statsLead}>
              <Text style={styles.statsFlag}>{currentLocation.flag}</Text>
              <Ionicons name="chevron-down" size={14} color="#1a1a2e" />
            </View>
            <Text style={styles.statsText}>
              {totalServices} services
              {typeof globalUserCount === "number"
                ? ` · ${globalUserCount.toLocaleString()} Global users`
                : ""}
              {typeof locationUserCount === "number"
                ? ` · ${locationUserCount.toLocaleString()} in ${currentLocation.name}`
                : ""}
            </Text>
          </Pressable>

          <Pressable style={styles.searchWrap} onPress={onExplorePress}>
            <Text style={styles.domain}>swipped.co.uk/</Text>
            <TypewriterPlaceholder
              phrases={TYPEWRITER_PHRASES}
              style={styles.typewriter}
            />
            <View style={styles.exploreBtn}>
              <Text style={styles.exploreText}>Explore</Text>
            </View>
          </Pressable>
        </View>

        {error ? (
          <View style={[styles.stateBanner, styles.errorBanner]}>
            <Text style={styles.errorText}>
              Could not sync data from API. Showing empty state.
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionPadding}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>On Demand</Text>

            <View style={styles.badgeWrap}>
              <MaterialCommunityIcons
                name="motorbike"
                size={13}
                color="#DC2626"
              />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  DELIVERED WITHIN 60 MINUTES
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.bikeRow}>
            <Text style={styles.sectionSub}>
              Products, food and groceries delivered to you.
            </Text>
          </View>
          <ServiceCarousel
            title=""
            badge=""
            badgeColor="#fff"
            subtitle=""
            services={sections.ordering}
            onPressService={(service) => onSelectService?.(service.id)}
          />

          <ServiceCarousel
            title="Book Now"
            badge="Book in Seconds"
            badgeTextColor="#b06000"
            badgeColor="#FEF3C7"
            subtitle="Reserve a table, book a session or schedule an appointment."
            services={sections.reservation}
            onPressService={(service) => onSelectService?.(service.id)}
          />

          <ServiceCarousel
            title="Services"
            badge="Instant Dispatch"
            badgeColor="#D1FAE5"
            badgeTextColor="#118c35"
            subtitle="Cleaning, repairs, deliveries and more, on demand."
            services={sections.booking}
            onPressService={(service) => onSelectService?.(service.id)}
          />
        </View>

        <View style={styles.headline}>
          <Text style={styles.headlineTitle}>
            Everything in one place.{"\n"}Built for{" "}
            <Text style={styles.accent}>you</Text>.
          </Text>
          <Text style={styles.headlineSub}>
            Order, book, connect, and earn from a single platform designed for
            daily life.
          </Text>
        </View>

        <View style={styles.gridCard}>
          {FEATURE_GRID.map((item) => (
            <View key={item.id} style={styles.gridCell}>
              <View
                style={[styles.gridIcon, { backgroundColor: item.color }]}
              />
              <Text style={styles.gridTitle}>{item.title}</Text>
              <Text style={styles.gridDesc}>{item.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.comingSection}>
          <Text style={styles.comingTitle}>Coming soon</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.comingTrack}
          >
            {COMING_SOON_ITEMS.map((item) => (
              <View key={item.id} style={styles.comingCard}>
                <View
                  style={[styles.comingIcon, { backgroundColor: item.color }]}
                />
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

      <Modal
        visible={isLocationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeLocationPicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose your location</Text>
              <Pressable
                style={styles.modalClose}
                onPress={closeLocationPicker}
              >
                <Ionicons name="close" size={18} color="#111827" />
              </Pressable>
            </View>

            <View style={styles.countryGrid}>
              {LOCATION_OPTIONS.map((option) => {
                const isActive = option.code === pendingLocation.code;
                return (
                  <Pressable
                    key={option.code}
                    style={[
                      styles.countryItem,
                      isActive && styles.countryItemActive,
                    ]}
                    onPress={() => setPendingLocation(option)}
                  >
                    <View style={styles.countryLeft}>
                      <Text style={styles.countryCode}>{option.code}</Text>
                      <Text style={styles.countryName}>{option.name}</Text>
                    </View>
                    <View
                      style={[
                        styles.countryCheck,
                        isActive && styles.countryCheckActive,
                      ]}
                    >
                      {isActive ? (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalFooter}>
              <View>
                <Text style={styles.footerLabel}>Selected location</Text>
                <Text style={styles.footerValue}>
                  {pendingLocation.code} {pendingLocation.name}
                </Text>
              </View>
              <Pressable
                style={styles.continueButton}
                onPress={confirmLocationPicker}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  { color: "#FF385C", backgroundColor: "#fff0f3", borderColor: "#ffcdd6" },
  { color: "#e08a00", backgroundColor: "#fff8e6", borderColor: "#ffd966" },
  { color: "#8b5cf6", backgroundColor: "#f3edff", borderColor: "#d4bffc" },
  { color: "#12b347", backgroundColor: "#edfcf2", borderColor: "#a3f0be" },
] as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf9f7" },
  content: { paddingBottom: 36 },
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ececec",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#1a1a2e",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  hero: {
    backgroundColor: "#faf9f7",
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 28,
    minHeight: 420,
  },
  heroFloating: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.2,
  },
  floatImage: { position: "absolute", width: 90, height: 90, borderRadius: 18 },
  locationBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: { color: "#ffffff", fontSize: 9, fontWeight: "600" },
  heroTitle: {
    marginTop: 16,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  accent: { color: "#a853cf", fontStyle: "italic" },
  heroSubtitle: {
    marginTop: 10,
    color: "#777777",
    fontSize: 12,
    lineHeight: 22,
  },
  chips: { marginTop: 14, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "OpenSans_400Regular",
    color: "#111827",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statsRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 8,
  },
  statsLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statsFlag: { lineHeight: 16, fontSize: 13 },
  statsText: { color: "#6b7280", fontSize: 13, fontWeight: "600" },
  searchWrap: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 999,
    minHeight: 52,
    alignItems: "center",
    flexDirection: "row",
    paddingLeft: 18,
    paddingRight: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  domain: { color: "#1a1a2e", fontSize: 13, fontWeight: "600" },
  typewriter: { color: "#999999", flex: 1, fontSize: 13, fontWeight: "600" },
  exploreBtn: {
    backgroundColor: "#ff4d77",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  exploreText: { color: "#ffffff", fontWeight: "800", fontSize: 12 },
  stateBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stateText: { color: "#4b5563", fontWeight: "700", fontSize: 12 },
  errorBanner: { backgroundColor: "#fff1f2" },
  errorText: { color: "#be123c", fontWeight: "700", fontSize: 12 },
  promoBanner: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#171717",
  },
  promoEyebrow: {
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    fontSize: 11,
  },
  promoTitle: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 22,
    marginTop: 6,
  },
  promoSub: { color: "rgba(255,255,255,0.75)", marginTop: 4, fontSize: 13 },
  promoCode: { color: "#fff", fontWeight: "900" },
  sectionPadding: { paddingHorizontal: 16, marginTop: 18 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#1a1a2e",
    textTransform: "uppercase",
  },
  badgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  badgeText: {
    fontWeight: "600",
    color: "#DC2626",
    fontSize: 11,
    letterSpacing: 1.1,
  },
  bikeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  sectionSub: { color: "#475569", fontSize: 14 },
  headline: { marginTop: 26, paddingHorizontal: 16 },
  headlineTitle: {
    fontSize: 34,
    lineHeight: 40,
    color: "#1a1a2e",
    fontWeight: "900",
  },
  headlineSub: { marginTop: 8, color: "#6b7280", fontSize: 16, lineHeight: 24 },
  gridCard: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    padding: 0,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridCell: {
    width: "50%",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
  },
  gridIcon: { width: 32, height: 32, borderRadius: 10, marginBottom: 8 },
  gridTitle: { color: "#0f172a", fontWeight: "800", fontSize: 14 },
  gridDesc: { color: "#64748b", marginTop: 4, fontSize: 12, lineHeight: 18 },
  comingSection: { marginTop: 18, paddingLeft: 16 },
  comingTitle: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
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
  comingCardDesc: {
    color: "#64748b",
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
  },
  cta: {
    marginHorizontal: 16,
    marginTop: 22,
    borderRadius: 24,
    backgroundColor: "#faf9f7",
    padding: 16,
    alignItems: "center",
  },
  ctaTitle: {
    color: "#1a1a2e",
    fontWeight: "900",
    fontSize: 30,
    textAlign: "center",
  },
  ctaButton: {
    marginTop: 12,
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 999,
  },
  ctaButtonText: { color: "#ffffff", fontWeight: "900", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.36)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  countryGrid: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  countryItem: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ececec",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryItemActive: {
    borderColor: "#ffd3df",
    backgroundColor: "#fff5f8",
  },
  countryLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  countryCode: {
    fontSize: 12,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#ececec",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: "hidden",
  },
  countryName: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
  countryCheck: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ececec",
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },
  countryCheckActive: {
    borderColor: "#ff4d77",
    backgroundColor: "#ff4d77",
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#fafafa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  footerValue: {
    marginTop: 4,
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
  },
  continueButton: {
    backgroundColor: "#ff4d77",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  continueButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
