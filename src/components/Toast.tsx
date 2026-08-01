import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import Icon, { type IconName } from "./Icon";

export default function Toast({
  message,
  icon = "check_circle",
  onDismiss,
}: {
  message: string | null;
  icon?: IconName;
  onDismiss: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onDismiss());
    }, 2200);
    return () => clearTimeout(timer);
  }, [message, opacity, onDismiss]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute top-20 left-6 right-6 z-50 items-center"
      style={{ opacity }}
    >
      <View className="bg-on-surface rounded-full px-5 py-3.5 flex-row items-center gap-2 shadow-lg">
        <Icon name={icon} size={18} color="#ffffff" filled />
        <Text className="text-surface font-label-md">{message}</Text>
      </View>
    </Animated.View>
  );
}
