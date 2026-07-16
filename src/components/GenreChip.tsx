import React from "react";
import { View, Text, Pressable } from "react-native";

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function GenreChip({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-1.5 rounded-full ${active ? "bg-primary" : "bg-surface-variant"}`}
    >
      <Text className={`font-label-md ${active ? "text-on-primary" : "text-on-surface-variant"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

type GroupProps = {
  items: { label: string; active?: boolean }[];
  onSelect?: (label: string) => void;
};

export function GenreChipGroup({ items, onSelect }: GroupProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => (
        <GenreChip
          key={item.label}
          label={item.label}
          active={item.active}
          onPress={() => onSelect?.(item.label)}
        />
      ))}
    </View>
  );
}
