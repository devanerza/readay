import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonBlock, SkeletonText, SkeletonCover } from "./Skeleton";
import TopAppBar from "./TopAppBar";

export function HomeSkeleton() {
  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar rightActions={[{ icon: "settings", color: "#444841" }]} />
        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-3 mt-2">
            <SkeletonBlock className="w-3/4 h-10" />
            <SkeletonBlock className="w-1/2 h-5" />
          </View>
          <SkeletonBlock className="h-52 rounded-[24px]" />
          <View className="gap-4">
            <SkeletonBlock className="w-48 h-6" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {[1, 2].map((i) => (
                <View key={i} className="w-44 rounded-2xl overflow-hidden">
                  <SkeletonBlock className="w-full h-56" />
                  <View className="p-3 gap-2">
                    <SkeletonBlock className="w-full h-4" />
                    <SkeletonBlock className="w-2/3 h-3" />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
          <View className="bg-surface-container-low rounded-[24px] p-6 gap-4">
            <View className="flex-row gap-6">
              <SkeletonBlock className="w-24 aspect-[2/3] rounded-lg" />
              <View className="flex-1 gap-2">
                <SkeletonBlock className="w-20 h-4" />
                <SkeletonBlock className="w-full h-6" />
                <SkeletonBlock className="w-full h-4" />
                <SkeletonBlock className="w-3/4 h-4" />
              </View>
            </View>
          </View>
          <View className="gap-4">
            <SkeletonBlock className="w-40 h-6" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <View key={i} className="w-32 gap-2">
                  <SkeletonBlock className="w-full aspect-[2/3] rounded-xl" />
                  <SkeletonBlock className="w-full h-3" />
                  <SkeletonBlock className="w-2/3 h-3" />
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export function LibrarySkeleton() {
  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar title="Library" rightActions={[{ icon: "settings", color: "#444841" }]} />
        <View className="flex-row gap-2 px-margin-page py-3">
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="flex-1 h-10 rounded-full" />
          ))}
        </View>
        <View className="flex-1 px-margin-page gap-4 pt-4">
          {[1, 2, 3].map((i) => (
            <View key={i} className="bg-surface-container-low rounded-2xl overflow-hidden">
              <View className="flex-row p-4 gap-4">
                <SkeletonBlock className="w-20 aspect-[2/3] rounded-lg" />
                <View className="flex-1 gap-2 justify-center">
                  <SkeletonBlock className="w-full h-5" />
                  <SkeletonBlock className="w-1/2 h-4" />
                  <SkeletonBlock className="w-2/3 h-3" />
                </View>
              </View>
              <View className="flex-row border-t border-surface-variant/20">
                <SkeletonBlock className="flex-1 h-10 rounded-none" />
                <SkeletonBlock className="flex-1 h-10 rounded-none" />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar rightActions={[{ icon: "settings", color: "#444841" }]} />
        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mt-8 gap-4 px-4">
            <SkeletonBlock className="w-4/5 h-7 rounded-sm" />
            <View className="flex-row items-center gap-2">
              <View className="h-px w-6 bg-outline/30" />
              <SkeletonBlock className="w-32 h-6" />
              <View className="h-px w-6 bg-outline/30" />
            </View>
            <SkeletonBlock className="w-36 h-5" />
          </View>
          <View className="bg-surface-container-low rounded-xl p-6 items-center gap-2">
            <SkeletonBlock className="w-20 h-3" />
            <SkeletonBlock className="w-48 h-8" />
            <SkeletonBlock className="w-full max-w-xs h-1" />
            <SkeletonBlock className="w-32 h-3" />
          </View>
          <View className="gap-4">
            <SkeletonBlock className="w-36 h-6" />
            <View className="flex-row gap-4">
              {[1, 2].map((i) => (
                <View key={i} className="flex-1 bg-surface-container-low rounded-xl p-5 gap-3 items-center">
                  <SkeletonBlock className="w-10 h-10 rounded-full" />
                  <SkeletonBlock className="w-16 h-7" />
                  <SkeletonBlock className="w-20 h-3" />
                </View>
              ))}
            </View>
          </View>
          <View className="gap-4">
            <SkeletonBlock className="w-32 h-6" />
            <View className="flex-row flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <SkeletonBlock key={i} className="w-24 h-8 rounded-full" />
              ))}
            </View>
          </View>
          <View className="p-6 bg-surface-container-low rounded-[32px] gap-6">
            <View className="flex-row justify-between">
              <View className="gap-2 flex-1">
                <SkeletonBlock className="w-40 h-6" />
                <SkeletonBlock className="w-28 h-4" />
              </View>
              <View className="items-end gap-1">
                <SkeletonBlock className="w-16 h-8" />
                <SkeletonBlock className="w-20 h-3" />
              </View>
            </View>
            <View className="flex-row justify-between">
              {Array.from({ length: 14 }).map((_, i) => (
                <SkeletonBlock key={i} className="rounded-full" style={{ width: 8, height: 8 }} />
              ))}
            </View>
          </View>
          <View className="gap-4">
            <SkeletonBlock className="w-36 h-6" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {[1, 2].map((i) => (
                <View key={i} className="w-32 gap-2">
                  <SkeletonBlock className="w-full aspect-[2/3] rounded-xl" />
                  <SkeletonBlock className="w-full h-3" />
                  <SkeletonBlock className="w-2/3 h-3" />
                </View>
              ))}
            </ScrollView>
          </View>
          <View className="gap-3 w-full">
            <SkeletonBlock className="w-32 h-6" />
            <SkeletonBlock className="w-full h-4" />
            <View className="flex-row gap-2">
              {[1, 2].map((i) => (
                <SkeletonBlock key={i} className="w-20 h-8 rounded-full" />
              ))}
            </View>
          </View>
          <View className="gap-4">
            <SkeletonBlock className="w-28 h-6" />
            <View className="gap-4">
              {[1, 2].map((i) => (
                <View key={i} className="flex-row gap-4 p-4 bg-surface-container-low rounded-2xl">
                  <SkeletonBlock className="w-10 h-10 rounded-full" />
                  <SkeletonBlock className="flex-1 h-10" />
                </View>
              ))}
            </View>
          </View>
          <SkeletonBlock className="h-16 rounded-xl" />
          <View className="gap-4">
            <SkeletonBlock className="w-48 h-6" />
            <View className="gap-1">
              {[1, 2, 3].map((i) => (
                <View key={i} className="flex-row justify-between py-3">
                  <SkeletonBlock className="w-32 h-5" />
                  <SkeletonBlock className="w-20 h-5" />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export function BookDetailSkeleton() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar
          onBack={() => {}}
          rightActions={[
            { icon: "share", color: "#444841" },
            { icon: "bookmark", color: "#444841" },
          ]}
        />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-margin-page pt-4 items-center">
            <SkeletonBlock className="w-full max-w-[280px] aspect-[2/3] rounded-lg" />
            <View className="items-center pt-4 w-full gap-4">
              <View className="flex-row gap-2">
                {[1, 2, 3].map((i) => (
                  <SkeletonBlock key={i} className="h-6 w-16 rounded-full" />
                ))}
              </View>
              <SkeletonBlock className="w-3/4 h-8" />
              <View className="flex-row gap-4 w-full">
                {[1, 2].map((i) => (
                  <View key={i} className="flex-1 bg-surface-container-low p-4 rounded-xl gap-2">
                    <SkeletonBlock className="w-12 h-3" />
                    <View className="flex-row items-center gap-2">
                      <SkeletonBlock className="w-4 h-4 rounded-full" />
                      <SkeletonBlock className="w-16 h-5" />
                    </View>
                  </View>
                ))}
              </View>
              <SkeletonBlock className="w-full h-14 rounded-full" />
              <SkeletonBlock className="w-28 h-5" />
            </View>
          </View>
          <View className="px-margin-page mt-8 gap-4">
            <View className="flex-row items-center gap-3">
              <SkeletonBlock className="w-10 h-10 rounded-full" />
              <SkeletonBlock className="w-36 h-6" />
            </View>
            <SkeletonBlock className="w-full h-4" />
            <SkeletonBlock className="w-full h-4" />
            <SkeletonBlock className="w-3/4 h-4" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export function SessionSkeleton() {
  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar onBack={() => {}} />
        <View className="flex-1 items-center justify-center px-margin-page">
          <SkeletonBlock className="w-40 aspect-[2/3] rounded-lg mb-6" />
          <SkeletonBlock className="w-48 h-6 mb-1" />
          <SkeletonBlock className="w-32 h-4 mb-8" />
          <View className="items-center gap-2 mb-10">
            <SkeletonBlock className="w-40 h-10" />
            <SkeletonBlock className="w-20 h-3" />
            <SkeletonBlock className="w-48 h-2" />
          </View>
          <View className="flex-row items-center gap-8">
            <SkeletonBlock className="w-14 h-14 rounded-full" />
            <SkeletonBlock className="w-32 h-14 rounded-full" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export function ScheduleSkeleton() {
  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="w-full flex-row justify-between items-center px-margin-page py-4">
          <View className="flex-row items-center gap-4">
            <SkeletonBlock className="w-8 h-8 rounded-full" />
            <SkeletonBlock className="w-32 h-7" />
          </View>
          <SkeletonBlock className="w-10 h-10 rounded-full" />
        </View>
        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-4 mt-2">
            <SkeletonBlock className="w-16 h-6" />
            {[1, 2].map((i) => (
              <View key={i} className="bg-surface-container-low rounded-2xl p-5 flex-row items-center gap-4">
                <SkeletonBlock className="w-12 h-16 rounded-lg" />
                <View className="flex-1 gap-1">
                  <SkeletonBlock className="w-36 h-5" />
                  <SkeletonBlock className="w-28 h-3" />
                  <SkeletonBlock className="w-40 h-3" />
                </View>
                <SkeletonBlock className="w-8 h-8 rounded-full" />
              </View>
            ))}
          </View>
          <View className="gap-4">
            <View className="flex-row justify-between items-center">
              <SkeletonBlock className="w-24 h-6" />
              <SkeletonBlock className="w-16 h-5" />
            </View>
            {[1, 2, 3].map((i) => (
              <View key={i} className="bg-surface-container-low rounded-2xl p-5 flex-row items-center gap-4">
                <SkeletonBlock className="w-12 h-16 rounded-lg" />
                <View className="flex-1 gap-1">
                  <SkeletonBlock className="w-36 h-5" />
                  <SkeletonBlock className="w-28 h-3" />
                  <SkeletonBlock className="w-40 h-3" />
                </View>
                <SkeletonBlock className="w-8 h-8 rounded-full" />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export function DiscoverSkeleton() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar rightActions={[{ icon: "settings", color: "#444841" }]} />
        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-2">
            <SkeletonBlock className="w-full h-12 rounded-xl" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBlock key={i} className="h-8 w-24 rounded-full" />
            ))}
          </ScrollView>
          <SkeletonBlock className="w-44 h-7" />
          <View className="flex-row flex-wrap gap-x-4 gap-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} className="w-[45%] gap-2">
                <SkeletonBlock className="w-full aspect-[2/3] rounded-lg" />
                <SkeletonBlock className="w-full h-4" />
                <SkeletonBlock className="w-2/3 h-3" />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
