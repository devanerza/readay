import React from "react";
import { View } from "react-native";

type Props = {
  progress: number; // 0-100
  height?: number;
  bgColor?: string;
  fillColor?: string;
};

export default function ProgressBar({
  progress,
  height = 6,
  bgColor = "bg-surface-variant",
  fillColor = "bg-primary",
}: Props) {
  return (
    <View className={`w-full ${bgColor} rounded-full overflow-hidden`} style={{ height }}>
      <View className={`h-full ${fillColor} rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }} />
    </View>
  );
}
