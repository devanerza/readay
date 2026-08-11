import React from "react";
import { View, Text, Image, Pressable, type ImageSourcePropType } from "react-native";
import Icon, { type IconName } from "./Icon";

type Action = {
  icon: IconName;
  onPress?: () => void;
  color?: string;
};

type Props = {
  title?: string;
  logo?: ImageSourcePropType;
  onBack?: () => void;
  rightActions?: Action[];
  rightSlot?: React.ReactNode;
};

export default function TopAppBar({ title = "Readay", logo, onBack, rightActions, rightSlot }: Props) {
  return (
    <View className="w-full flex-row justify-between items-center px-margin-page py-4">
      <View className="flex-row items-center gap-4">
        {onBack && (
          <Pressable onPress={onBack} className="p-2 -ml-2 active:bg-surface-container rounded-full">
            <Icon name="arrow_back" color="#52634c" />
          </Pressable>
        )}
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
              <Icon name={action.icon} size={24} color={action.color ?? "#444841"} />
            </Pressable>
          ))}
          {rightSlot}
        </View>
      )}
    </View>
  );
}
