import React from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon, { type IconName } from "../../components/Icon";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA0CvZZrlHSgjnin_taqdIGVHXPhEaumpIRAuwhqkrmLFwnSzp4G7tbHG1n51-bZaGAoBy9Z-kJIKV6536Vp8AZtpZG3d_T_WPDKvSLz9G8VZveA8v7vStsHMgvXdZ0mZ6Ew4Bs8vUepHTHFDQIO2AyWTdM3gu7vTZL5-pQt4qZyC-LeFb2bKlS9GRF0pN1sp68Exqj1x3TvHOVYnndVgq2aIx4sTz4sj1GRnXjXrzVO7R9N2nGgOiSSw";

const GENRES = [
  { label: "Magical Realism", bg: "bg-primary/10", color: "text-primary" },
  { label: "Philosophy", bg: "bg-secondary/10", color: "text-secondary" },
  { label: "Classic Lit", bg: "bg-surface-container-high", color: "text-on-surface-variant" },
  { label: "Poetry", bg: "bg-surface-container-high", color: "text-on-surface-variant" },
];

const PREFERENCES: { icon: IconName; label: string; value: string }[] = [
  { icon: "wb_twilight", label: "Preferred Timing", value: "Evening" },
  { icon: "mood", label: "Reading Mood", value: "Contemplative" },
  { icon: "light_mode", label: "Theme", value: "Paper White" },
];

export default function Profile() {
  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Top App Bar */}
        <View className="w-full flex-row justify-between items-center px-margin-page py-4">
          <View className="flex-row items-center gap-4">
            <Icon name="menu" color="#52634c" />
            <Text className="font-display text-headline-md text-primary ml-4">ReadFlow</Text>
          </View>
          <View className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border border-surface-variant">
            <Image source={{ uri: AVATAR }} className="w-full h-full" resizeMode="cover" />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View className="items-center mt-2">
            <View className="mb-4">
              <View className="w-24 h-24 rounded-full overflow-hidden bg-surface-container-lowest">
                <Image source={{ uri: AVATAR }} className="w-full h-full" resizeMode="cover" />
              </View>
              <Pressable className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full items-center justify-center border-4 border-surface">
                <Icon name="edit" size={14} color="#ffffff" />
              </Pressable>
            </View>
            <Text className="font-display text-headline-lg-mobile text-on-surface">Eleanor Vance</Text>
            <Text className="font-body-md text-on-surface-variant opacity-70">Curating a life through prose.</Text>
          </View>

          {/* Reading Goal */}
          <View className="bg-surface-container-low rounded-xl p-6 items-center gap-2">
            <Text className="font-label-md text-primary tracking-widest uppercase text-[10px]">Current Goal</Text>
            <Text className="font-display text-headline-md text-on-surface">12 books in 2024</Text>
            <View className="w-full max-w-xs h-1 bg-surface-variant rounded-full mt-2 overflow-hidden">
              <View className="h-full bg-primary rounded-full" style={{ width: "66%" }} />
            </View>
            <Text className="text-caption text-on-surface-variant">8 books completed</Text>
          </View>

          {/* Annual Journey */}
          <View className="gap-4">
            <View className="flex-row justify-between items-end">
              <Text className="font-display text-title-lg">Annual Journey</Text>
              <Text className="font-label-md text-primary">View Insights</Text>
            </View>
            <View className="flex-row gap-4">
              <View className="flex-1 p-4 rounded-xl bg-surface-container border border-surface-variant/30 gap-1">
                <Icon name="schedule" size={20} color="#7d562d" />
                <Text className="font-display text-headline-md">142h</Text>
                <Text className="text-caption text-on-surface-variant">Reading Time</Text>
              </View>
              <View className="flex-1 p-4 rounded-xl bg-surface-container border border-surface-variant/30 gap-1">
                <Icon name="auto_stories" size={20} color="#52634c" />
                <Text className="font-display text-headline-md">2,840</Text>
                <Text className="text-caption text-on-surface-variant">Pages Turned</Text>
              </View>
            </View>
          </View>

          {/* Favorite Genres */}
          <View className="gap-4">
            <Text className="font-display text-title-lg">Favorite Genres</Text>
            <View className="flex-row flex-wrap gap-2">
              {GENRES.map((g) => (
                <View key={g.label} className={`px-4 py-1.5 rounded-full ${g.bg}`}>
                  <Text className={`font-label-md ${g.color}`}>{g.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Personal Library Link */}
          <Pressable className="bg-surface-container-lowest border border-surface-variant/20 rounded-xl p-4 flex-row items-center justify-between active:bg-surface-container-low">
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 rounded-lg bg-primary-container/20 items-center justify-center">
                <Icon name="book_2" size={20} color="#52634c" />
              </View>
              <View>
                <Text className="font-title-lg text-[18px]">Personal Library</Text>
                <Text className="text-caption text-on-surface-variant">248 titles collected</Text>
              </View>
            </View>
            <Icon name="chevron_right" size={20} color="#444841" />
          </Pressable>

          {/* Reading Preferences */}
          <View className="gap-4">
            <Text className="font-display text-title-lg">Reading Preferences</Text>
            <View className="gap-1">
              {PREFERENCES.map((pref, i) => (
                <View
                  key={pref.label}
                  className={`flex-row justify-between items-center py-3 ${
                    i < PREFERENCES.length - 1 ? "border-b border-surface-container" : ""
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <Icon name={pref.icon} size={20} color="#444841" />
                    <Text className="font-body-md text-on-surface">{pref.label}</Text>
                  </View>
                  <Text className="font-label-md text-primary">{pref.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
