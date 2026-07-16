import React from "react";
import { View, Text, Pressable } from "react-native";
import Icon, { type IconName } from "./Icon";

type Action = {
  icon: IconName;
  onPress?: () => void;
  color?: string;
};

type Props = {
  title?: string;
  onBack?: () => void;
  rightActions?: Action[];
  rightSlot?: React.ReactNode;
};

export default function TopAppBar({ title = "ReadFlow", onBack, rightActions, rightSlot }: Props) {
  return (
    <View className="w-full flex-row justify-between items-center px-margin-page py-4">
      <View className="flex-row items-center gap-4">
        {onBack ? (
          <Pressable onPress={onBack} className="p-2 -ml-2 active:bg-surface-container rounded-full">
            <Icon name="arrow_back" color="#52634c" />
          </Pressable>
        ) : (
          <Icon name="menu" color="#52634c" />
        )}
        <Text className="font-display text-headline-md text-primary ml-2">{title}</Text>
      </View>
      {(rightActions || rightSlot) && (
        <View className="flex-row items-center gap-4">
          {rightActions?.map((action, i) => (
            <Pressable key={i} onPress={action.onPress} className="active:opacity-70">
              <Icon name={action.icon} size={24} color={action.color ?? "#444841"} />
            </Pressable>
          ))}
          {rightSlot}
        </View>
      )}
    </View>
  );
}
