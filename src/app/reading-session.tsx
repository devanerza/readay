import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../components/Icon";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDRtkBbBNjD_sPAgL4uqDSQ4VxoNKF1p0y7Jp_UoVXQY39g17SC1fcD9Nw_GY37Uc5jz2RcK8IeTPVXP9lOcUFmBNneOMf9GR721-5focyJ98W0Xr-bbRGObJ_SIWROh1-QKxmsoYhWy-YuKm-B5LLGbtP7gSZRrWpbMvtJrfQW1kTCkHuRXtGRG3B1lN8Tv6KLrq5dh2U2CpXfogGMnMS-IR_Fx0R7iAzr-okTqYtt42bUy4iDkLQV6A";

const BOOK_COVER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCkxuLGaqK3w_yaJP2f-0OzssqoeCmJrigwFw8SN_AxlMDcjHwmD9O1ROCH2KQLYf4ncTOd7siV89fWiB1lXwuuteK4hyfIb-rT1u9X-s1892B9hB73mK5qy7rzp73-YZC4bQw0_4HQO5DZ99SxWwCi3kAQJrz6GwVM9qu8Toz6wETJTYUOvyj_3jvKx3g1tpvl36zIT9H16uApkUlYBdoaPIMrPD7ExNV1lR9XvFDOnl9oy2tk_qjQow";

const TOTAL_SECONDS = 900; // 15 minutes

export default function ReadingSession() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (isPaused || s <= 0) return s;
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeLabel = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  const progressPct = (seconds / TOTAL_SECONDS) * 100;

  return (
    <View className="flex-1 bg-surface" style={isPaused ? { opacity: 0.8 } : undefined}>
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Top Nav */}
        <View className="w-full flex-row justify-between items-center px-margin-page py-4">
          <Text className="font-display text-headline-md text-primary">ReadFlow</Text>
          <View className="flex-row items-center gap-4">
            <Icon name="settings" color="#52634c" />
            <View className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant">
              <Image source={{ uri: AVATAR }} className="w-full h-full" resizeMode="cover" />
            </View>
          </View>
        </View>

        {/* Focus Canvas */}
        <View className="flex-1 items-center justify-center px-margin-page">
          {/* Book cover */}
          <View className="mb-10 w-48 aspect-[2/3] rounded-lg overflow-hidden">
            <Image source={{ uri: BOOK_COVER }} className="w-full h-full" resizeMode="cover" />
          </View>

          {/* Timer */}
          <View className="items-center gap-2 mb-10">
            <View className="flex-row items-center gap-3">
              <Icon name="timer" size={22} color="#52634c" filled />
              <Text className="font-display text-headline-lg-mobile text-primary tracking-widest">{timeLabel}</Text>
            </View>
            <Text className="font-label-md text-on-surface-variant uppercase tracking-tighter">remaining</Text>
            <View className="w-48 h-1 bg-surface-container-high rounded-full overflow-hidden mt-2">
              <View className="h-full bg-primary rounded-full" style={{ width: `${progressPct}%` }} />
            </View>
            <Text className="font-label-md text-on-surface-variant mt-2">24 pages read tonight</Text>
          </View>

          {/* Quote */}
          <View className="max-w-md items-center px-4 mb-10">
            <Icon name="format_quote" size={28} color="rgba(82,99,76,0.3)" />
            <Text className="font-headline-md text-on-surface italic text-center leading-relaxed mt-2">
              "A room without books is like a body without a soul."
            </Text>
            <Text className="font-label-md text-outline mt-4 uppercase tracking-[0.2em] text-[10px]">
              Marcus Tullius Cicero
            </Text>
          </View>

          {/* Controls */}
          <View className="flex-row items-center gap-8">
            <Pressable
              onPress={() => setIsPaused((p) => !p)}
              className="w-14 h-14 items-center justify-center rounded-full bg-surface-container border border-outline-variant active:scale-90"
            >
              <Icon name={isPaused ? "play_arrow" : "pause"} color="#52634c" filled={isPaused} />
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              className="px-8 py-3 rounded-full bg-primary flex-row items-center gap-2 active:scale-95"
            >
              <Icon name="stop_circle" size={16} color="#ffffff" />
              <Text className="text-on-primary font-label-md">End Session</Text>
            </Pressable>
            <Pressable className="w-14 h-14 items-center justify-center rounded-full bg-surface-container border border-outline-variant active:scale-90">
              <Icon name="auto_awesome" color="#52634c" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
