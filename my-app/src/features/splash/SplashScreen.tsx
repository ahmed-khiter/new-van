import React, { useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

type Props = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: Props) {
  const bgOpacity = useSharedValue(0);

  // Emblem (S + outer ring)
  const emblemScale = useSharedValue(0.4);
  const emblemOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);

  // Wordmark
  const wordOpacity = useSharedValue(0);
  const wordX = useSharedValue(24);

  // Tagline
  const tagOpacity = useSharedValue(0);
  const tagY = useSharedValue(12);

  // Progress line
  const lineWidth = useSharedValue(0);

  // Exit
  const exitOpacity = useSharedValue(1);
  const exitScale = useSharedValue(1);

  useEffect(() => {
    // Phase 1 — background
    bgOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) });

    // Phase 2 — ring expands, emblem pops in
    ringOpacity.value = withDelay(220, withTiming(1, { duration: 400 }));
    ringScale.value = withDelay(220, withSpring(1, { damping: 10, stiffness: 80 }));

    emblemOpacity.value = withDelay(380, withTiming(1, { duration: 300 }));
    emblemScale.value = withDelay(380, withSpring(1, { damping: 14, stiffness: 120 }));

    // Phase 3 — wordmark slides in
    wordOpacity.value = withDelay(660, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    wordX.value = withDelay(660, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));

    // Phase 4 — tagline rises
    tagOpacity.value = withDelay(940, withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }));
    tagY.value = withDelay(940, withTiming(0, { duration: 380, easing: Easing.out(Easing.quad) }));

    // Phase 5 — loading line sweeps across, then pauses
    lineWidth.value = withDelay(1100, withTiming(width - 64, { duration: 900, easing: Easing.inOut(Easing.quad) }));

    // Phase 6 — exit: scale up + fade out
    exitScale.value = withDelay(2300, withTiming(1.06, { duration: 550, easing: Easing.in(Easing.quad) }));
    exitOpacity.value = withDelay(
      2300,
      withTiming(0, { duration: 550, easing: Easing.in(Easing.quad) }, () => {
        runOnJS(onFinish)();
      })
    );
  }, []);

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const exitStyle = useAnimatedStyle(() => ({
    opacity: exitOpacity.value,
    transform: [{ scale: exitScale.value }],
  }));
  const emblemStyle = useAnimatedStyle(() => ({
    opacity: emblemOpacity.value,
    transform: [{ scale: emblemScale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateX: wordX.value }],
  }));
  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
    transform: [{ translateY: tagY.value }],
  }));
  const lineStyle = useAnimatedStyle(() => ({ width: lineWidth.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, bgStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.content, exitStyle]}>

        {/* Background accent blobs */}
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />

        {/* Emblem group */}
        <View style={styles.emblemGroup}>
          {/* Outer decorative ring */}
          <Animated.View style={[styles.outerRing, ringStyle]} />
          {/* Inner ring */}
          <Animated.View style={[styles.innerRing, ringStyle]} />
          {/* S lettermark */}
          <Animated.View style={[styles.emblemCircle, emblemStyle]}>
            <Text style={styles.emblemLetter}>S</Text>
          </Animated.View>
        </View>

        {/* Wordmark */}
        <Animated.Text style={[styles.wordmark, wordStyle]}>
          Swipped
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, tagStyle]}>
          Everything. Everywhere.
        </Animated.Text>

        {/* Loading track */}
        <View style={styles.loaderTrack}>
          <Animated.View style={[styles.loaderBar, lineStyle]} />
        </View>

        {/* Bottom label */}
        <Animated.Text style={[styles.bottomLabel, tagStyle]}>
          swipped.co.uk
        </Animated.Text>

      </Animated.View>
    </Animated.View>
  );
}

const NAVY = "#1a1a2e";
const PINK = "#ff4d77";
const PINK_DIM = "rgba(255,77,119,0.12)";
const PINK_BORDER = "rgba(255,77,119,0.35)";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.38)";
const WHITE_FAINT = "rgba(255,255,255,0.07)";

const styles = StyleSheet.create({
  root: {
    backgroundColor: NAVY,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },

  // Background accent blobs
  blobTopRight: {
    position: "absolute",
    top: -60,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: PINK_DIM,
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: 60,
    left: -100,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(168,83,207,0.08)",
  },

  // Emblem
  emblemGroup: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  outerRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: PINK_BORDER,
  },
  innerRing: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: WHITE_FAINT,
  },
  emblemCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: PINK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 20,
  },
  emblemLetter: {
    color: WHITE,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 34,
  },

  // Wordmark
  wordmark: {
    color: WHITE,
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginBottom: 10,
  },

  // Tagline
  tagline: {
    color: WHITE_DIM,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 2.4,
    textTransform: "uppercase",
    marginBottom: 44,
  },

  // Loader
  loaderTrack: {
    width: width - 64,
    height: 2,
    backgroundColor: WHITE_FAINT,
    borderRadius: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  loaderBar: {
    height: 2,
    backgroundColor: PINK,
    borderRadius: 1,
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },

  // Bottom domain
  bottomLabel: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    position: "absolute",
    bottom: 32,
  },
});
