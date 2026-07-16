import React from "react";
import { View, Text, Pressable } from "react-native";
import Icon, { type IconName } from "./Icon";

type Props = {
  icon: IconName;
  iconColor?: string;
  title: string;
  subtitle: string;
  cta?: string;
  onCta?: () => void;
};

export default function EmptyState({ icon, iconColor = "#747870", title, subtitle, cta, onCta }: Props) {
  return (
    <View className="flex-1 items-center justify-center py-20 px-margin-page">
      <View className="w-16 h-16 rounded-full bg-surface-variant items-center justify-center mb-6">
        <Icon name={icon} size={28} color={iconColor} />
      </View>
      <Text className="font-display text-title-lg text-on-surface text-center mb-2">{title}</Text>
      <Text className="font-body-md text-on-surface-variant text-center mb-6">{subtitle}</Text>
      {cta && onCta && (
        <Pressable onPress={onCta} className="px-8 py-3 bg-primary rounded-full active:scale-95">
          <Text className="text-on-primary font-label-md">{cta}</Text>
        </Pressable>
      )}
    </View>
  );
}
