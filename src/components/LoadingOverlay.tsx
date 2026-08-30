import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Colors } from "../constants/colors";

export default function LoadingOverlay() {
  return (
    <View className="flex-1 bg-surface items-center justify-center">
      <ActivityIndicator size="small" color={Colors.primary} />
    </View>
  );
}
