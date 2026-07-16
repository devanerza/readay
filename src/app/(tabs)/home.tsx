import React from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/auth-store";
import { getReadingStats } from "../../lib/reading-sessions";
import { getCurrentlyReading, getNextRead, getQueueItems } from "../../lib/queue-items";
import { getUpcomingBlock } from "../../lib/schedule-blocks";
import TopAppBar from "../../components/TopAppBar";
import LoadingOverlay from "../../components/LoadingOverlay";
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

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", userId!)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["reading-stats", userId],
    queryFn: () => getReadingStats(userId!),
    enabled: !!userId,
  });

  const { data: currentRead } = useQuery({
    queryKey: ["currently-reading", userId],
    queryFn: () => getCurrentlyReading(userId!),
    enabled: !!userId,
  });

  const { data: nextRead } = useQuery({
    queryKey: ["next-read", userId],
    queryFn: () => getNextRead(userId!),
    enabled: !!userId,
  });

  const { data: upcomingBlock } = useQuery({
    queryKey: ["upcoming-block", userId],
    queryFn: () => getUpcomingBlock(userId!),
    enabled: !!userId,
  });

  const { data: finishedBooks } = useQuery({
    queryKey: ["finished-books", userId],
    queryFn: () => getQueueItems(userId!, 'finished'),
    enabled: !!userId,
  });

  if (statsLoading) return <LoadingOverlay />;

  const greeting = getGreeting();
  const streakDays = stats?.streakDays ?? 0;
  const greetingSubtitle = getGreetingSubtitle(streakDays);

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar
          rightActions={[
            { icon: "search", color: "#444841", onPress: () => router.push("/discover" as never) },
          ]}
          rightSlot={
            <View className="w-8 h-8 rounded-full overflow-hidden border border-primary-container/10 bg-primary-container/20">
              {currentRead?.books?.cover_url ? (
                <Image source={{ uri: currentRead.books.cover_url }} className="w-full h-full" resizeMode="cover" />
              ) : null}
            </View>
          }
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

          {/* Hero: Continue Reading */}
          {currentRead ? (
            <View className="rounded-[24px] bg-surface-container overflow-hidden">
              <View className="w-full h-48 overflow-hidden">
                {currentRead.books?.cover_url ? (
                  <Image source={{ uri: currentRead.books.cover_url }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="flex-1 items-center justify-center bg-surface-variant">
                    <Icon name="auto_stories" size={48} color="#747870" />
                  </View>
                )}
              </View>
              <View className="p-6 gap-4">
                <View className="gap-1">
                  <Text className="text-primary font-label-md uppercase tracking-widest">Currently Reading</Text>
                  <Text className="font-headline-lg text-on-surface">
                    {currentRead.books?.title ?? "Unknown title"}
                  </Text>
                  <Text className="text-on-surface-variant italic">
                    {currentRead.books?.author ?? ""}
                  </Text>
                </View>
                {currentRead.books?.page_count ? (
                  <View className="gap-1 w-full max-w-xs">
                    <View className="flex-row justify-between items-end mb-1">
                      <Text className="text-on-surface-variant font-label-md">Progress</Text>
                      <Text className="text-primary font-label-md">—</Text>
                    </View>
                    <View className="h-1.5 w-full bg-primary-container/10 rounded-full overflow-hidden">
                      <View className="h-full bg-primary rounded-full" style={{ width: "0%" }} />
                    </View>
                  </View>
                ) : null}
                <Pressable
                  onPress={() => router.push(`/reading-session?book_id=${currentRead.book_id}`)}
                  className="self-start bg-primary px-8 py-3.5 rounded-full active:scale-95 flex-row items-center gap-3"
                >
                  <Text className="text-white font-label-md">Resume Reading</Text>
                  <Icon name="play_arrow" size={18} color="#ffffff" filled />
                </Pressable>
              </View>
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

          {/* Today's Pick (Next Read) */}
          {nextRead ? (
            <View className="bg-surface-container-low rounded-[24px] p-6 gap-6">
              <View className="flex-row gap-6 items-start">
                <View className="w-24 shrink-0 rounded-lg overflow-hidden" style={{ transform: [{ rotate: "-2deg" }] }}>
                  {nextRead.books?.cover_url ? (
                    <Image source={{ uri: nextRead.books.cover_url }} className="w-full aspect-[2/3]" resizeMode="cover" />
                  ) : (
                    <View className="w-full aspect-[2/3] bg-surface-variant items-center justify-center">
                      <Text className="text-outline font-label-md">{nextRead.books?.title?.[0] ?? "?"}</Text>
                    </View>
                  )}
                </View>
                <View className="flex-1 gap-2">
                  <View className="flex-row items-center gap-2">
                    <Icon name="auto_awesome" size={16} color="#7d562d" filled />
                    <Text className="text-secondary font-label-md">NEXT READ</Text>
                  </View>
                  <Text className="font-headline-md text-on-surface text-xl">
                    {nextRead.books?.title ?? "Unknown"}
                  </Text>
                  <Text className="text-on-surface-variant font-body-md leading-relaxed">
                    {nextRead.reason_text || (nextRead.books?.author ? `By ${nextRead.books.author}` : "Add to your queue to start reading.")}
                  </Text>
                  <Pressable
                    onPress={() => router.push(`/reading-session?book_id=${nextRead.book_id}`)}
                    className="flex-row items-center gap-2 pt-2"
                  >
                    <Text className="text-primary font-label-md">Start Reading</Text>
                    <Icon name="arrow_forward" size={16} color="#52634c" />
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          {/* Upcoming Session */}
          {upcomingBlock ? (
            <View className="bg-primary-container/20 border border-primary-container/20 rounded-[24px] p-6 gap-6">
              <View className="gap-3">
                <View className="p-3 bg-white/50 rounded-2xl self-start">
                  <Icon name="schedule" size={26} color="#52634c" />
                </View>
                <View className="gap-1">
                  <Text className="font-title-lg text-on-surface">{upcomingBlock.label || "Reading Session"}</Text>
                  <Text className="text-on-surface-variant text-sm font-body-md">
                    {(() => {
                      const now = new Date();
                      const [h, m] = upcomingBlock.start_time.split(":").map(Number);
                      const blockTime = new Date(); blockTime.setHours(h, m, 0);
                      const diff = Math.round((blockTime.getTime() - now.getTime()) / 60000);
                      if (diff > 0) return `Starts in ${diff} min — ${upcomingBlock.start_time.slice(0, 5)}`;
                      return `Scheduled at ${upcomingBlock.start_time.slice(0, 5)}`;
                    })()}
                  </Text>
                </View>
              </View>
              <View className="w-full gap-3">
                <Pressable
                  onPress={() => router.push("/reading-session")}
                  className="w-full bg-white border border-primary-container/30 py-3 rounded-full items-center active:bg-primary"
                >
                  <Text className="text-primary font-label-md">Start Session</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push("/schedule" as never)}
                  className="w-full py-2 rounded-full items-center active:opacity-70"
                >
                  <Text className="text-on-surface-variant font-label-md text-sm">Manage Schedule</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/schedule" as never)}
              className="bg-primary-container/10 border border-primary-container/20 rounded-[24px] p-6 items-center gap-3 active:bg-primary-container/20"
            >
              <View className="p-3 bg-white/50 rounded-2xl">
                <Icon name="schedule" size={26} color="#52634c" />
              </View>
              <Text className="font-title-lg text-on-surface">Set Your Schedule</Text>
              <Text className="text-on-surface-variant text-sm font-body-md text-center">
                Plan your reading blocks to build a consistent habit.
              </Text>
              <Text className="text-primary font-label-md mt-2">Create Schedule</Text>
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
