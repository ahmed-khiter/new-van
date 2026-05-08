import React from "react";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

// The play triangle has vertices: (0,0) top-left, (0,26) bottom-left, (22,13) right-tip
// The 4 color segments meet at the centroid: (7.33, 13)
export default function GooglePlayIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size * (26 / 22)} viewBox="0 0 22 26">
      <Defs>
        <LinearGradient id="gp_blue" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#32BBFF" />
          <Stop offset="100%" stopColor="#1EA6E0" />
        </LinearGradient>
        <LinearGradient id="gp_green" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#3FDB6E" />
          <Stop offset="100%" stopColor="#21B54A" />
        </LinearGradient>
        <LinearGradient id="gp_red" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FF4646" />
          <Stop offset="100%" stopColor="#D32F2F" />
        </LinearGradient>
        <LinearGradient id="gp_yellow" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#FFDE00" />
          <Stop offset="100%" stopColor="#FFB300" />
        </LinearGradient>
      </Defs>

      {/* Blue — top-left */}
      <Path d="M0 0 L0 13 L7.33 13 Z" fill="url(#gp_blue)" />
      {/* Green — top-right to tip */}
      <Path d="M0 0 L7.33 13 L22 13 Z" fill="url(#gp_green)" />
      {/* Red — bottom-left */}
      <Path d="M0 13 L7.33 13 L0 26 Z" fill="url(#gp_red)" />
      {/* Yellow — bottom-right to tip */}
      <Path d="M7.33 13 L22 13 L0 26 Z" fill="url(#gp_yellow)" />
    </Svg>
  );
}
