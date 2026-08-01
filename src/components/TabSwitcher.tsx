import React from "react";
import { View, Text, Pressable } from "react-native";
import Icon, { type IconName } from "./Icon";

type Tab = {
  key: string;
  label: string;
};

type Props = {
  tabs: readonly Tab[] | Tab[];
  activeKey: string;
  onSelect: (key: string) => void;
};

export default function TabSwitcher({ tabs, activeKey, onSelect }: Props) {
  return (
    <View className="flex-row px-margin-page gap-2 mb-6">
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          onPress={() => onSelect(tab.key)}
          className={`px-5 py-2 rounded-full ${activeKey === tab.key ? "bg-primary" : "bg-on-primary"}`}
        >
          <Text className={`font-label-md ${activeKey === tab.key ? "text-on-primary" : "text-on-surface-variant"}`}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
