import React from "react";
import Svg, { Path } from "react-native-svg";

export default function CheckCircleSvg({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M20.1654 10.1566V11C20.1642 12.9767 19.5242 14.9001 18.3406 16.4833C17.157 18.0665 15.4934 19.2248 13.5978 19.7852C11.7022 20.3457 9.67619 20.2784 7.82196 19.5933C5.96774 18.9083 4.38463 17.6422 3.30875 15.984C2.23286 14.3257 1.72184 12.364 1.8519 10.3916C1.98196 8.41916 2.74614 6.54161 4.03045 5.03896C5.31477 3.53631 7.05042 2.48908 8.97854 2.05344C10.9067 1.61781 12.9239 1.81712 14.7295 2.62164"
        stroke="#10B981"
        strokeWidth="1.83333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.1667 3.66669L11 12.8425L8.25 10.0925"
        stroke="#10B981"
        strokeWidth="1.83333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
