import React, { createContext, useContext, useEffect, useRef } from "react";
import { Dimensions, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SHIMMER_WIDTH = SCREEN_WIDTH * 0.7;

// Warm skeleton tones matching the #faf9f7 app background
const BASE_COLOR = "#e5e7eb";
const HIGHLIGHT_COLOR = "#f3f4f6";

// ─── Shared shimmer context ─────────────────────────────────────────────────
// All SkeletonBox instances read the same translateX so every bone
// sweeps together in perfect lockstep.
const ShimmerContext = createContext<Animated.SharedValue<number> | null>(null);

export function SkeletonProvider({ children }: { children: React.ReactNode }) {
  const translateX = useSharedValue(-SHIMMER_WIDTH);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SCREEN_WIDTH + SHIMMER_WIDTH, {
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      false
    );
  }, []);

  return (
    <ShimmerContext.Provider value={translateX}>
      {children}
    </ShimmerContext.Provider>
  );
}

// ─── Single skeleton bone ────────────────────────────────────────────────────
type SkeletonBoxProps = {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function SkeletonBox({
  width = "100%",
  height,
  borderRadius = 8,
  style,
}: SkeletonBoxProps) {
  const translateX = useContext(ShimmerContext);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX?.value ?? -SHIMMER_WIDTH }],
  }));

  return (
    <View
      style={[
        { width, height, borderRadius, backgroundColor: BASE_COLOR, overflow: "hidden" },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={[
            "transparent",
            "rgba(255,255,255,0.0)",
            HIGHLIGHT_COLOR,
            "rgba(255,255,255,0.0)",
            "transparent",
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: SHIMMER_WIDTH, height: "100%" }}
        />
      </Animated.View>
    </View>
  );
}
