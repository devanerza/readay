import React from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/auth-store";
import { getReadingStats } from "../../lib/reading-sessions";
import { getAllCurrentlyReading, getQueueItems } from "../../lib/queue-items";
import { getScheduleBlocks } from "../../lib/schedule-blocks";
import { getProfile } from "../../lib/profiles";
import TopAppBar from "../../components/TopAppBar";
import { HomeSkeleton } from "../../components/SkeletonScreens";
import { BookCardVertical } from "../../components/BookCard";
import Icon from "../../components/Icon";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getGreetingSubtitle(streakDays: number) {
  if (streakDays >= 30) return `${streakDays}-day streak — you're on fire!`;
  if (streakDays >= 7) return `${streakDays}-day streak — building momentum.`;
  if (streakDays > 0) return `${streakDays}-day streak — keep going!`;
  return "Start a session to begin your streak.";
}

export default function Home() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    select: (d) => d ?? { display_name: null },
    enabled: !!userId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["reading-stats", userId],
    queryFn: () => getReadingStats(userId!),
    enabled: !!userId,
  });

  const { data: readingItems = [], isLoading: readingLoading } = useQuery({
    queryKey: ["all-reading", userId],
    queryFn: () => getAllCurrentlyReading(userId!),
    enabled: !!userId,
  });

  const { data: wantToReadItems = [], isLoading: wantLoading } = useQuery({
    queryKey: ["want-to-read", userId],
    queryFn: () => getQueueItems(userId!, 'want_to_read'),
    enabled: !!userId,
  });

  const { data: scheduleBlocks = [], isLoading: scheduleLoading } = useQuery({
    queryKey: ["schedule-blocks", userId],
    queryFn: () => getScheduleBlocks(userId!),
    enabled: !!userId,
  });

  const { data: finishedBooks, isLoading: finishedLoading } = useQuery({
    queryKey: ["finished-books", userId],
    queryFn: () => getQueueItems(userId!, 'finished'),
    enabled: !!userId,
  });

  if (profileLoading || statsLoading || readingLoading || wantLoading || scheduleLoading || finishedLoading) return <HomeSkeleton />;

  const greeting = getGreeting();
  const streakDays = stats?.streakDays ?? 0;
  const greetingSubtitle = getGreetingSubtitle(streakDays);
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const nextBlock = (() => {
    const now = new Date();
    const today = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const b of scheduleBlocks) {
      const [bh, bm] = b.start_time.split(":").map(Number);
      const blockMinutes = bh * 60 + bm;
      if (b.day_of_week === today && blockMinutes > currentMinutes) return b;
      if (b.day_of_week > today) return b;
    }
    if (scheduleBlocks.length > 0) return scheduleBlocks[0];
    return null;
  })();

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar
          rightActions={[
            { icon: "settings", color: "#444841" },
          ]}
        />

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Friendly Greeting */}
          <View className="mt-2">
            <Text className="font-display text-[40px] leading-[46px] text-on-surface">
              {greeting}, <Text className="italic font-normal">{profile?.display_name ?? "Reader"}</Text>
            </Text>
            <Text className="text-on-surface-variant mt-2 font-body-lg">
              {greetingSubtitle}
            </Text>
          </View>

          {/* Upcoming Session */}
          {scheduleBlocks.length > 0 && nextBlock ? (
            <View className="bg-primary rounded-[24px] p-6 gap-5">
              <View className="flex-row items-start gap-5">
                <View className={`${nextBlock.books ? "w-24 shrink-0 rounded-lg overflow-hidden" : "p-2 bg-white/20 rounded-xl self-start"}`}>
                  {nextBlock.books?.cover_url ? (
                    <Image source={{ uri: nextBlock.books.cover_url }} className="w-full aspect-[2/3]" resizeMode="cover" style={{ transform: [{ rotate: "-2deg" }] }} />
                  ) : (
                    <Icon name="schedule" size={22} color="#ffffff" />
                  )}
                </View>
                <View className="flex-1 gap-2 pt-1">
                  <View className="flex-row items-center gap-2">
                    <View className="p-1.5 bg-white/20 rounded-lg">
                      <Icon name="schedule" size={14} color="#ffffff" />
                    </View>
                    <Text className="font-label-md text-white/80 uppercase tracking-wider">Upcoming</Text>
                  </View>
                  <View className="gap-0.5">
                    <Text className="font-display text-[18px] leading-[22px] text-white">{nextBlock.label || "Reading Session"}</Text>
                    {nextBlock.books ? (
                      <Text className="text-white/70 font-body-md" numberOfLines={1}>{nextBlock.books.title}</Text>
                    ) : null}
                    {nextBlock.books?.author ? (
                      <Text className="text-white/50 text-caption">{nextBlock.books.author}</Text>
                    ) : null}
                  </View>
                  <Text className="text-white/80 font-body-md">
                    {(() => {
                      const now = new Date();
                      const today = now.getDay();
                      const [h, m] = nextBlock.start_time.split(":").map(Number);

                      if (nextBlock.day_of_week === today) {
                        const blockTime = new Date(); blockTime.setHours(h, m, 0);
                        const diff = Math.round((blockTime.getTime() - now.getTime()) / 60000);
                        if (diff > 0) return `${nextBlock.start_time.slice(0, 5)} — in ${diff} min`;
                        return `Scheduled for ${nextBlock.start_time.slice(0, 5)}`;
                      }
                      const daysFromNow = (nextBlock.day_of_week + 7 - today) % 7;
                      if (daysFromNow === 1) return `Tomorrow at ${nextBlock.start_time.slice(0, 5)}`;
                      return `${DAY_NAMES[nextBlock.day_of_week]} at ${nextBlock.start_time.slice(0, 5)}`;
                    })()}
                  </Text>
                  <Pressable
                    onPress={() => router.push(nextBlock.books ? `/reading-session?book_id=${nextBlock.books.id}` : "/reading-session")}
                    className="self-start mt-1 bg-white py-2.5 px-6 rounded-full active:opacity-90"
                  >
                    <Text className="text-primary font-label-lg font-semibold">Start Session</Text>
                  </Pressable>
                </View>
              </View>
              <Pressable onPress={() => router.push("/schedule" as never)} className="items-center">
                <Text className="text-white/60 font-label-md text-xs">Manage Schedule</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/schedule" as never)}
              className="bg-surface-container-low rounded-[24px] p-8 items-center gap-4 active:bg-surface-container border border-dashed border-outline/30"
            >
              <View className="p-3 bg-primary/10 rounded-2xl">
                <Icon name="schedule" size={28} color="#52634c" />
              </View>
              <View className="items-center gap-1">
                <Text className="font-title-lg text-on-surface">Set Your Reading Schedule</Text>
                <Text className="text-on-surface-variant font-body-md text-center max-w-[260px]">
                  Pick a time to read — we'll remind you when it's time.
                </Text>
              </View>
              <Text className="text-primary font-label-lg mt-1">Create Schedule</Text>
            </Pressable>
          )}

          {/* Currently Reading Carousel */}
          {readingItems.length > 0 ? (
            <View className="gap-4">
              <Text className="font-headline-md text-on-surface px-1">Currently Reading</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={{ gap: 16 }}
              >
                {readingItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/reading-session?book_id=${item.book_id}`)}
                    className="w-44 rounded-2xl overflow-hidden bg-surface-container active:opacity-80"
                  >
                    <View className="w-full h-56 bg-surface-variant">
                      {item.books?.cover_url ? (
                        <Image source={{ uri: item.books.cover_url }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Icon name="auto_stories" size={36} color="#747870" />
                        </View>
                      )}
                    </View>
                    <View className="p-3 gap-1">
                      <Text className="font-label-md text-on-surface" numberOfLines={1}>{item.books?.title ?? "Unknown"}</Text>
                      {item.books?.author ? (
                        <Text className="text-caption text-on-surface-variant" numberOfLines={1}>{item.books.author}</Text>
                      ) : null}
                      <View className="flex-row items-center gap-1 pt-1">
                        <Icon name="play_arrow" size={14} color="#52634c" filled />
                        <Text className="font-label-md text-primary text-xs">Resume</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/discover" as never)}
              className="rounded-[24px] bg-surface-container-low p-8 items-center gap-3 active:bg-surface-container"
            >
              <Icon name="auto_stories" size={40} color="#747870" />
              <Text className="font-title-lg text-on-surface text-center">Nothing being read yet</Text>
              <Text className="font-body-md text-on-surface-variant text-center">
                Add a book to your queue to start reading.
              </Text>
              <Text className="text-primary font-label-md mt-2">Discover books</Text>
            </Pressable>
          )}

          {/* Want to Read Carousel */}
          {wantToReadItems.length > 0 ? (
            <View className="gap-4">
              <View className="flex-row justify-between items-end px-1">
                <Text className="font-headline-md text-on-surface">Want to Read</Text>
                <Pressable className="flex-row items-center gap-1" onPress={() => router.push("/library" as never)}>
                  <Text className="text-on-surface-variant font-label-md">See All</Text>
                  <Icon name="chevron_right" size={16} color="#444841" />
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={{ gap: 16 }}
              >
                {wantToReadItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/reading-session?book_id=${item.book_id}`)}
                    className="w-44 rounded-2xl overflow-hidden bg-surface-container active:opacity-80"
                  >
                    <View className="w-full h-56 bg-surface-variant">
                      {item.books?.cover_url ? (
                        <Image source={{ uri: item.books.cover_url }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Icon name="auto_stories" size={36} color="#747870" />
                        </View>
                      )}
                    </View>
                    <View className="p-3 gap-1">
                      <Text className="font-label-md text-on-surface" numberOfLines={1}>{item.books?.title ?? "Unknown"}</Text>
                      {item.books?.author ? (
                        <Text className="text-caption text-on-surface-variant" numberOfLines={1}>{item.books.author}</Text>
                      ) : null}
                      <View className="flex-row items-center gap-1 pt-1">
                        <Icon name="play_arrow" size={14} color="#52634c" filled />
                        <Text className="font-label-md text-primary text-xs">Start Reading</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/discover" as never)}
              className="rounded-[24px] bg-surface-container-low p-8 items-center gap-3 active:bg-surface-container"
            >
              <Icon name="auto_stories" size={40} color="#747870" />
              <Text className="font-title-lg text-on-surface text-center">Your queue is empty</Text>
              <Text className="font-body-md text-on-surface-variant text-center">
                Discover books to add to your reading list.
              </Text>
              <Text className="text-primary font-label-md mt-2">Discover books</Text>
            </Pressable>
          )}

          {/* Recently Finished */}
          {finishedBooks && finishedBooks.length > 0 ? (
            <View className="gap-4">
              <View className="flex-row justify-between items-end">
                <Text className="font-headline-md text-on-surface">Recently Finished</Text>
                <Pressable className="flex-row items-center gap-1" onPress={() => router.push("/library" as never)}>
                  <Text className="text-on-surface-variant font-label-md">See All</Text>
                  <Icon name="chevron_right" size={16} color="#444841" />
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                {finishedBooks.slice(0, 5).map((item) => (
                  <BookCardVertical
                    key={item.id}
                    book={{
                      title: item.books?.title ?? "Unknown",
                      author: item.books?.author,
                      cover_url: item.books?.cover_url,
                    }}
                    onPress={() => router.push("/book-detail" as never)}
                    subtitle={item.books?.author}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
