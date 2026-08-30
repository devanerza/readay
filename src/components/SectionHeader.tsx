import React from "react";
import { View, Text, Pressable } from "react-native";
import Icon from "./Icon";
import { Colors } from "../constants/colors";

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View className="flex-row justify-between items-end">
      <Text className="font-headline-md text-on-surface">{title}</Text>
      {actionLabel && onAction && (
        <Pressable className="flex-row items-center gap-1" onPress={onAction}>
          <Text className="text-on-surface-variant font-label-md">{actionLabel}</Text>
          <Icon name="chevron_right" size={16} color={Colors.onSurfaceVariant} />
        </Pressable>
      )}
    </View>
  );
}
