import React from "react";
import { View, Text } from "react-native";
import Icon, { type IconName } from "./Icon";

type Props = {
  icon: IconName;
  iconBg?: string;
  iconColor?: string;
  text: string;
};

export default function ReflectionCard({
  icon,
  iconBg = "bg-primary-fixed",
  iconColor = "#52634c",
  text,
}: Props) {
  return (
    <View className="p-6 bg-surface-container rounded-2xl flex-row gap-4 items-start">
      <View className={`w-10 h-10 rounded-full ${iconBg} items-center justify-center shrink-0`}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <Text className="flex-1 font-body-md text-on-surface leading-relaxed">{text}</Text>
    </View>
  );
}
