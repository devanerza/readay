import React from "react";
import { View, Text, Image, Pressable, type ImageSourcePropType } from "react-native";
import Icon, { type IconName } from "./Icon";
import { Colors } from "../constants/colors";

type Action = {
  icon: IconName;
  onPress?: () => void;
  color?: string;
};

type Props = {
  title?: string;
  logo?: ImageSourcePropType;
  onBack?: () => void;
  leftSlot?: React.ReactNode;
  rightActions?: Action[];
  rightSlot?: React.ReactNode;
};

export default function TopAppBar({ title = "Readay", logo, onBack, leftSlot, rightActions, rightSlot }: Props) {
  return (
    <View className="w-full flex-row justify-between items-center px-margin-page py-4">
      <View className="flex-row items-center gap-4">
        {leftSlot ?? (onBack && (
          <Pressable onPress={onBack} className="p-2 -ml-2 active:bg-surface-container rounded-full">
            <Icon name="arrow_back" color={Colors.primary} />
          </Pressable>
        ))}
        {logo ? (
          <Image source={logo} resizeMode="contain" style={{ width: 72, height: 24, marginLeft: 4 }} />
        ) : (
          <Text className="font-display text-headline-md text-primary ml-2">{title}</Text>
        )}
      </View>
      {(rightActions || rightSlot) && (
        <View className="flex-row items-center gap-4">
          {rightActions?.map((action, i) => (
            <Pressable key={i} onPress={action.onPress} className="active:opacity-70">
              <Icon name={action.icon} size={24} color={action.color ?? Colors.onSurfaceVariant} />
            </Pressable>
          ))}
          {rightSlot}
        </View>
      )}
    </View>
  );
}
