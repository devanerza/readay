import React from "react";
import { View, Text } from "react-native";
import Icon, { type IconName } from "./Icon";
import { Colors } from "../constants/colors";

type Props = {
  icon: IconName;
  iconColor?: string;
  value: string;
  label: string;
};

export default function StatTile({ icon, iconColor = Colors.secondary, value, label }: Props) {
  return (
    <View className="flex-1 p-4 rounded-xl bg-primary gap-1">
      <Icon name={icon} size={20} color={iconColor} />
      <Text className="font-display text-headline-md text-surface">{value}</Text>
      <Text className="text-caption text-surface">{label}</Text>
    </View>
  );
}
