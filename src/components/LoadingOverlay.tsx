import React from "react";
import { View, ActivityIndicator } from "react-native";

export default function LoadingOverlay() {
  return (
    <View className="flex-1 bg-surface items-center justify-center">
      <ActivityIndicator size="small" color="#52634c" />
    </View>
  );
}
