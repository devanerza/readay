import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// No source HTML mockup was provided for the Library tab.
// This is a placeholder screen so the tab bar has somewhere to navigate to —
// swap in your real library grid/list here.
export default function Library() {
  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1 items-center justify-center px-margin-page">
        <Text className="font-display text-headline-md text-primary mb-2">Library</Text>
        <Text className="font-body-md text-on-surface-variant text-center">
          No design mockup was provided for this screen yet — add your library grid here.
        </Text>
      </SafeAreaView>
    </View>
  );
}
