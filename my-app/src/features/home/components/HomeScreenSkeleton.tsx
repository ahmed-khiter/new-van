import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SkeletonBox, SkeletonProvider } from "@/components/skeleton";

// ─── Reusable sub-sections ───────────────────────────────────────────────────

function CarouselSectionSkeleton({ hasHeader = true }: { hasHeader?: boolean }) {
  return (
    <View style={styles.carouselSection}>
      {hasHeader && (
        <>
          <View style={styles.carouselHeader}>
            <SkeletonBox width={130} height={26} borderRadius={7} />
            <SkeletonBox width={110} height={28} borderRadius={999} />
          </View>
          <SkeletonBox width="58%" height={13} borderRadius={6} style={{ marginTop: 8 }} />
        </>
      )}
      <View style={styles.carouselRow}>
        <SkeletonBox width={236} height={148} borderRadius={16} />
        <SkeletonBox width={236} height={148} borderRadius={16} />
        <SkeletonBox width={140} height={148} borderRadius={16} />
      </View>
      {/* Dot row */}
      <View style={styles.dotRow}>
        {[0, 1, 2].map((i) => (
          <SkeletonBox
            key={i}
            width={i === 0 ? 16 : 6}
            height={6}
            borderRadius={3}
            style={{ marginRight: 8 }}
          />
        ))}
      </View>
    </View>
  );
}

function OnDemandSectionSkeleton() {
  return (
    <View style={styles.carouselSection}>
      {/* "On Demand" header + delivery badge */}
      <View style={styles.carouselHeader}>
        <SkeletonBox width={140} height={26} borderRadius={7} />
        <View style={styles.badgeGroup}>
          <SkeletonBox width={14} height={14} borderRadius={7} />
          <SkeletonBox width={180} height={30} borderRadius={999} />
        </View>
      </View>
      <SkeletonBox width="52%" height={13} borderRadius={6} style={{ marginTop: 8 }} />
      <View style={styles.carouselRow}>
        <SkeletonBox width={236} height={148} borderRadius={16} />
        <SkeletonBox width={236} height={148} borderRadius={16} />
        <SkeletonBox width={140} height={148} borderRadius={16} />
      </View>
      <View style={styles.dotRow}>
        {[0, 1, 2].map((i) => (
          <SkeletonBox key={i} width={i === 0 ? 16 : 6} height={6} borderRadius={3} style={{ marginRight: 8 }} />
        ))}
      </View>
    </View>
  );
}

function FeatureGridSkeleton() {
  return (
    <View style={styles.gridCard}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.gridCell}>
          <SkeletonBox width={32} height={32} borderRadius={10} style={{ marginBottom: 10 }} />
          <SkeletonBox width="70%" height={13} borderRadius={5} style={{ marginBottom: 7 }} />
          <SkeletonBox width="90%" height={11} borderRadius={5} style={{ marginBottom: 3 }} />
          <SkeletonBox width="60%" height={11} borderRadius={5} />
        </View>
      ))}
    </View>
  );
}

function ComingSoonSkeleton() {
  return (
    <View style={styles.comingSection}>
      <SkeletonBox width={110} height={13} borderRadius={6} style={{ marginBottom: 12 }} />
      <View style={styles.comingRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.comingCard}>
            <SkeletonBox width={32} height={32} borderRadius={10} style={{ marginBottom: 10 }} />
            <SkeletonBox width="65%" height={13} borderRadius={5} style={{ marginBottom: 7 }} />
            <SkeletonBox width="90%" height={11} borderRadius={5} style={{ marginBottom: 3 }} />
            <SkeletonBox width="70%" height={11} borderRadius={5} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main skeleton ────────────────────────────────────────────────────────────

export default function HomeScreenSkeleton() {
  return (
    <SkeletonProvider>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* App header */}
          <View style={styles.appHeader}>
            <View style={styles.headerLeft}>
              <SkeletonBox width={36} height={36} borderRadius={18} />
              <SkeletonBox width={84} height={20} borderRadius={8} />
            </View>
            <View style={styles.headerRight}>
              <SkeletonBox width={36} height={36} borderRadius={18} />
              <SkeletonBox width={36} height={36} borderRadius={18} />
            </View>
          </View>

          {/* Location badge */}
          <SkeletonBox width={112} height={32} borderRadius={999} style={{ marginTop: 12 }} />

          {/* Hero title — 2 lines */}
          <SkeletonBox width="72%" height={26} borderRadius={8} style={{ marginTop: 20 }} />
          <SkeletonBox width="56%" height={26} borderRadius={8} style={{ marginTop: 8 }} />

          {/* Subtitle */}
          <SkeletonBox width="88%" height={13} borderRadius={6} style={{ marginTop: 14 }} />
          <SkeletonBox width="66%" height={13} borderRadius={6} style={{ marginTop: 6 }} />

          {/* Chips */}
          <View style={styles.chipsRow}>
            {["Order", "Book", "Connect", "Earn"].map((_, i) => (
              <SkeletonBox key={i} width={70} height={30} borderRadius={999} />
            ))}
          </View>

          {/* Stats row */}
          <SkeletonBox width="78%" height={16} borderRadius={999} style={{ marginTop: 16 }} />

          {/* Search bar */}
          <SkeletonBox width="100%" height={52} borderRadius={999} style={{ marginTop: 14 }} />
        </View>

        {/* ── Service carousels ─────────────────────────────────────────── */}
        <View style={styles.sectionPadding}>
          <OnDemandSectionSkeleton />
          <CarouselSectionSkeleton />
          <CarouselSectionSkeleton />
        </View>

        {/* ── Headline ──────────────────────────────────────────────────── */}
        <View style={styles.headline}>
          <SkeletonBox width="80%" height={34} borderRadius={9} style={{ marginBottom: 10 }} />
          <SkeletonBox width="55%" height={34} borderRadius={9} style={{ marginBottom: 14 }} />
          <SkeletonBox width="92%" height={14} borderRadius={6} style={{ marginBottom: 6 }} />
          <SkeletonBox width="74%" height={14} borderRadius={6} />
        </View>

        {/* ── Feature grid ──────────────────────────────────────────────── */}
        <FeatureGridSkeleton />

        {/* ── Coming soon ───────────────────────────────────────────────── */}
        <ComingSoonSkeleton />

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <View style={styles.cta}>
          <SkeletonBox width="70%" height={32} borderRadius={9} style={{ marginBottom: 10 }} />
          <SkeletonBox width="55%" height={32} borderRadius={9} style={{ marginBottom: 20 }} />
          <SkeletonBox width={140} height={46} borderRadius={999} />
        </View>
      </ScrollView>
    </SkeletonProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf9f7" },
  content: { paddingBottom: 36 },

  // Hero
  hero: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 28,
  },
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  chipsRow: { flexDirection: "row", gap: 8, marginTop: 16, flexWrap: "wrap" },

  // Section padding (carousels)
  sectionPadding: { paddingHorizontal: 16, marginTop: 18 },

  // Each carousel section
  carouselSection: { marginTop: 28 },
  carouselHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  badgeGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  carouselRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    overflow: "hidden",
  },
  dotRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },

  // Headline
  headline: { marginTop: 28, paddingHorizontal: 16 },

  // Feature grid
  gridCard: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridCell: {
    width: "50%",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  // Coming soon
  comingSection: { marginTop: 20, paddingLeft: 16 },
  comingRow: { flexDirection: "row", gap: 12, paddingRight: 16 },
  comingCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
  },

  // CTA
  cta: {
    marginHorizontal: 16,
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 16,
  },
});
