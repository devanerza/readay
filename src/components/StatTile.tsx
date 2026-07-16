import React from "react";
import { View, Text } from "react-native";
import Icon, { type IconName } from "./Icon";

type Props = {
  icon: IconName;
  iconColor?: string;
  value: string;
  label: string;
};

export default function StatTile({ icon, iconColor = "#7d562d", value, label }: Props) {
  return (
    <View className="flex-1 p-4 rounded-xl bg-surface-container border border-surface-variant/30 gap-1">
      <Icon name={icon} size={20} color={iconColor} />
      <Text className="font-display text-headline-md">{value}</Text>
      <Text className="text-caption text-on-surface-variant">{label}</Text>
    </View>
  );
}
