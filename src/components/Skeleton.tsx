import React, { useEffect, useRef } from "react";
import { View, Animated, type ViewProps } from "react-native";

function usePulse() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return opacity;
}

export function SkeletonBlock({ className, style }: { className?: string; style?: ViewProps["style"] }) {
  const opacity = usePulse();
  return (
    <Animated.View
      className={`bg-outline-variant rounded-lg ${className ?? ""}`}
      style={[{ opacity }, style]}
    />
  );
}

export function SkeletonText({ className }: { className?: string }) {
  return (
    <SkeletonBlock className={`h-3 ${className ?? ""}`} />
  );
}

export function SkeletonCircle({ size }: { size: number }) {
  return <SkeletonBlock className="rounded-full" style={{ width: size, height: size }} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return <SkeletonBlock className={`h-32 ${className ?? ""}`} />;
}

export function SkeletonCover() {
  return <SkeletonBlock className="w-full aspect-[2/3]" />;
}

export function SkeletonHeader() {
  return (
    <View className="gap-3 mt-2">
      <SkeletonText className="w-3/4 h-6" />
      <SkeletonText className="w-1/2 h-4" />
    </View>
  );
}
