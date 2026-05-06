import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CtaBlock from "@/features/home/components/CtaBlock";
import ComingSoonSection from "@/features/home/components/ComingSoonSection";
import FeatureHighlight from "@/features/home/components/FeatureHighlight";
import Footer from "@/features/home/components/Footer";
import HeroSection from "@/features/home/components/HeroSection";
import HomeScreenSkeleton from "@/features/home/components/HomeScreenSkeleton";
import LocationModal from "@/features/home/components/LocationModal";
import ServicesSection from "@/features/home/components/ServicesSection";
import { DEFAULT_LOCATION } from "@/features/home/constants/homeContent";
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
      <StatusBar style="dark" backgroundColor="#faf9f7" translucent={false} hidden={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <HeroSection
          currentLocation={currentLocation}
          totalServices={totalServices}
          globalUserCount={globalUserCount}
          locationUserCount={locationUserCount}
          onLocationPress={openLocationPicker}
          onExplorePress={onExplorePress}
        />

        {error ? (
          <View style={[styles.stateBanner, styles.errorBanner]}>
            <Text style={styles.errorText}>
              Could not sync data from API. Showing empty state.
            </Text>
          </View>
        ) : null}

        <ServicesSection
          sections={sections}
          onSelectService={onSelectService}
        />

        <FeatureHighlight />

        <ComingSoonSection />

        <CtaBlock onGetStarted={onGetStarted} />

        <Footer />
      </ScrollView>

      <LocationModal
        visible={isLocationModalVisible}
        pendingLocation={pendingLocation}
        onSelectLocation={setPendingLocation}
        onClose={closeLocationPicker}
        onConfirm={confirmLocationPicker}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf9f7" },
  content: { paddingBottom: 0 },
  stateBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorBanner: { backgroundColor: "#fff1f2" },
  errorText: { color: "#be123c", fontWeight: "700", fontSize: 12 },
});
