import React from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../components/Icon";

const COVER =
  "https://books.google.co.id/books/publisher/content?id=LiI6EAAAQBAJ&pg=PP1&img=1&zoom=3&hl=en&sig=ACfU3U3T67vhupw4CIk4MrF_WNVtY6vZqg&w=1280";

export default function BookDetail() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* App Bar */}
        <View className="w-full flex-row justify-between items-center px-margin-page py-4">
          <View className="flex-row items-center gap-4">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2 active:bg-surface-container rounded-full">
              <Icon name="arrow_back" color="#52634c" />
            </Pressable>
            <Text className="font-display text-headline-md text-primary ml-2">ReadFlow</Text>
          </View>
          <View className="flex-row items-center gap-4">
            <Icon name="share" color="#444841" />
            <Icon name="bookmark" color="#444841" />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View className="px-margin-page pt-4 items-center">
            <View className="w-full max-w-[280px] aspect-[2/3] rounded-lg overflow-hidden">
              <Image source={{ uri: COVER }} className="w-full h-full" resizeMode="cover" />
            </View>

            <View className="items-center pt-4 w-full">
              <View className="flex-row flex-wrap justify-center gap-2 mb-3">
                <Tag label="Contemporary Fiction" bg="bg-tertiary-container/10" color="text-on-tertiary-container" />
                <Tag label="Magical Realism" bg="bg-primary-container/10" color="text-on-primary-container" />
              </View>
              <Text className="font-headline-lg-mobile text-on-surface text-center mb-1">The Midnight Library</Text>
              <Text className="font-body-lg text-on-surface-variant italic mb-6">Matt Haig</Text>

              {/* Stats */}
              <View className="flex-row gap-4 w-full mb-6">
                <View className="flex-1 bg-surface-container-low p-4 rounded-xl">
                  <Text className="text-caption text-outline uppercase tracking-wider mb-1">Time to Read</Text>
                  <View className="flex-row items-center gap-2">
                    <Icon name="schedule" size={18} color="#52634c" />
                    <Text className="font-title-lg text-body-md text-primary">4h 30m</Text>
                  </View>
                </View>
                <View className="flex-1 bg-surface-container-low p-4 rounded-xl">
                  <Text className="text-caption text-outline uppercase tracking-wider mb-1">Mood</Text>
                  <View className="flex-row items-center gap-2">
                    <Icon name="auto_awesome" size={18} color="#52634c" filled />
                    <Text className="font-title-lg text-body-md text-primary">Reflective</Text>
                  </View>
                </View>
              </View>

              {/* CTA */}
              <Pressable
                onPress={() => router.push("/reading-session")}
                className="w-full py-4 bg-primary rounded-full items-center flex-row justify-center gap-2 active:scale-95"
              >
                <Icon name="play_arrow" size={20} color="#ffffff" filled />
                <Text className="text-white font-label-md">Start Reading</Text>
              </Pressable>
              <Text className="mt-4 text-caption text-outline text-center">
                Available in E-book and Audiobook formats
              </Text>
            </View>
          </View>

          {/* Progress */}
          <View className="px-margin-page mt-8">
            <View className="bg-surface-container-high/40 p-6 rounded-2xl border border-surface-variant">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-title-lg text-on-surface">Your Progress</Text>
                <Text className="text-label-md font-label-md text-primary">46% complete</Text>
              </View>
              <View className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                <View className="h-full bg-primary rounded-full" style={{ width: "46%" }} />
              </View>
              <Text className="mt-3 text-caption text-on-surface-variant italic">
                "Between life and death there is a library..." — You are on Page 142 of 304
              </Text>
            </View>
          </View>

          {/* Why we recommend */}
          <View className="px-margin-page mt-8">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-full bg-secondary-container items-center justify-center">
                <Icon name="favorite" size={18} color="#7a532a" />
              </View>
              <Text className="font-headline-md text-on-surface">Why we recommend this</Text>
            </View>
            <Text className="font-body-lg text-on-surface-variant leading-relaxed">
              Matt Haig captures the universal human experience of "what if" with such gentleness. In a world that
              often demands perfection, this book serves as a quiet reminder that the lives we didn't lead aren't
              necessarily better than the one we are in.
            </Text>
          </View>

          {/* Details */}
          <View className="px-margin-page mt-8 gap-6">
            <DetailRow label="Publisher" value="Viking Penguin" />
            <DetailRow label="Released" value="August 13, 2020" />
            <DetailRow label="ISBN" value="978-0525559474" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Tag({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View className={`${bg} px-3 py-1 rounded-full`}>
      <Text className={`font-label-md ${color}`}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <Text className="text-caption text-outline uppercase tracking-widest">{label}</Text>
      <Text className="text-body-md text-on-surface">{value}</Text>
    </View>
  );
}
