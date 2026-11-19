import React from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/auth-store";
import { getReadingStats } from "../../lib/reading-sessions";
import { getAllCurrentlyReading, getQueueItems } from "../../lib/queue-items";
import { getScheduleBlocks } from "../../lib/schedule-blocks";
import { getProfile } from "../../lib/profiles";
import { getBooksBySubject, buildCoverUrl, extractOpenLibraryId, type OLSearchResult } from "../../lib/open-library";
import { prefetchCovers } from "../../lib/cover-prefetch";
import { usePullRefresh, REFRESH_TINT, REFRESH_COLORS } from "../../lib/use-pull-refresh";
import TopAppBar from "../../components/TopAppBar";
import { HomeSkeleton } from "../../components/SkeletonScreens";
import { SkeletonBlock } from "../../components/Skeleton";
import { BookCardVertical } from "../../components/BookCard";
import ConfirmModal from "../../components/ConfirmModal";
import Icon from "../../components/Icon";
import { Colors } from "../../constants/colors";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function describeNextBlockTime(block: { day_of_week: number; start_time: string }) {
  const now = new Date();
  const [h, m] = block.start_time.split(":").map(Number);

  if (block.day_of_week === now.getDay()) {
    const blockTime = new Date(); blockTime.setHours(h, m, 0);
    const diff = Math.round((blockTime.getTime() - now.getTime()) / 60000);
    if (diff > 0) return `${block.start_time.slice(0, 5)} — in ${diff} min`;
    return `Scheduled for ${block.start_time.slice(0, 5)}`;
  }
  const daysFromNow = (block.day_of_week + 7 - now.getDay()) % 7;
  if (daysFromNow === 1) return `Tomorrow at ${block.start_time.slice(0, 5)}`;
  return `${DAY_NAMES[block.day_of_week]} at ${block.start_time.slice(0, 5)}`;
}

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

function olToDisplay(doc: OLSearchResult) {
  return {
    key: doc.key,
    open_library_id: extractOpenLibraryId(doc.key),
    title: doc.title,
    author: doc.author_name?.[0] ?? "",
    cover_url: doc.cover_i ? buildCoverUrl(doc.cover_i) : null,
  };
}

export default function Home() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;
  const [confirmStart, setConfirmStart] = React.useState(false);

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile, isRefetching: refetchingProfile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    select: (d) => d ?? { display_name: null },
    enabled: !!userId,
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isRefetching: refetchingStats } = useQuery({
    queryKey: ["reading-stats", userId],
    queryFn: () => getReadingStats(userId!),
    enabled: !!userId,
  });

  const { data: readingItems = [], isLoading: readingLoading, refetch: refetchReading, isRefetching: refetchingReading } = useQuery({
    queryKey: ["all-reading", userId],
    queryFn: () => getAllCurrentlyReading(userId!),
    enabled: !!userId,
  });

  const { data: wantToReadItems = [], isLoading: wantLoading, refetch: refetchWant, isRefetching: refetchingWant } = useQuery({
    queryKey: ["queue-items", userId, "want_to_read"],
    queryFn: () => getQueueItems(userId!, 'want_to_read'),
    enabled: !!userId,
  });

  const { data: scheduleBlocks = [], isLoading: scheduleLoading, refetch: refetchSchedule, isRefetching: refetchingSchedule } = useQuery({
    queryKey: ["schedule-blocks", userId],
    queryFn: () => getScheduleBlocks(userId!),
    enabled: !!userId,
  });

  const { data: finishedBooks, isLoading: finishedLoading, refetch: refetchFinished, isRefetching: refetchingFinished } = useQuery({
    queryKey: ["queue-items", userId, "finished"],
    queryFn: () => getQueueItems(userId!, 'finished'),
    enabled: !!userId,
  });

  const topGenre = React.useMemo(() => {
    const weights = (profile as { genre_weights?: Record<string, number> } | null)?.genre_weights;
    if (!weights) return "fiction";
    const sorted = Object.entries(weights).sort(([, a], [, b]) => b - a);
    return sorted[0]?.[0] ?? "fiction";
  }, [profile]);

  const { data: recommendedResults, isLoading: recommendedLoading, refetch: refetchRecommended, isRefetching: refetchingRecommended } = useQuery({
    queryKey: ["home-recommendations", topGenre],
    queryFn: () => getBooksBySubject(topGenre, 20),
    enabled: !!userId && wantToReadItems.length === 0,
  });

  const recommendedItems = React.useMemo(() => (recommendedResults ?? []).slice(0, 8).map(olToDisplay), [recommendedResults]);

  React.useEffect(() => {
    if (!userId) return;
    prefetchCovers([
      ...readingItems.map((i) => i.books?.cover_url),
      ...wantToReadItems.map((i) => i.books?.cover_url),
      ...recommendedItems.map((d) => d.cover_url),
    ]);
  }, [userId, readingItems, wantToReadItems, recommendedItems]);

  const refreshing =
    refetchingProfile || refetchingStats || refetchingReading || refetchingWant || refetchingSchedule || refetchingFinished || refetchingRecommended;

  const { refreshing: isRefreshing, onRefresh } = usePullRefresh(
    [refetchProfile, refetchStats, refetchReading, refetchWant, refetchSchedule, refetchFinished, refetchRecommended],
    refreshing
  );

  if (profileLoading || statsLoading || readingLoading || wantLoading || scheduleLoading || finishedLoading) return <HomeSkeleton />;

  const greeting = getGreeting();
  const streakDays = stats?.streakDays ?? 0;
  const greetingSubtitle = getGreetingSubtitle(streakDays);

  const nextBlock = (() => {
    const now = new Date();
    const today = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const upcomingToday = scheduleBlocks.find((b) => {
      const [bh, bm] = b.start_time.split(":").map(Number);
      return b.day_of_week === today && (bh * 60 + bm) > currentMinutes;
    });
    if (upcomingToday) return upcomingToday;

    const nextDay = scheduleBlocks.find((b) => b.day_of_week > today);
    if (nextDay) return nextDay;

    if (scheduleBlocks.length > 0) return scheduleBlocks[0];
    return null;
  })();

  const nextBlockDuration = nextBlock ? (() => {
    const [sh, sm] = nextBlock.start_time.split(":").map(Number);
    const [eh, em] = nextBlock.end_time.split(":").map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) diff += 24 * 60;
    return diff;
  })() : 0;

  const startScheduledSession = () => {
    router.push(nextBlock?.books
      ? `/reading-session?book_id=${nextBlock.books.id}&target_minutes=${nextBlockDuration}`
      : `/reading-session?target_minutes=${nextBlockDuration}`);
  };

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar
          logo={require("../../../assets/images/readay-header.png")}
          rightSlot={
            <Pressable
              onPress={() => router.push("/library?focus=search" as never)}
              className="w-9 h-9 rounded-full bg-surface-container-low items-center justify-center active:opacity-80"
            >
              <Icon name="search" size={20} color={Colors.onSurface} />
            </Pressable>
          }
        />

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={REFRESH_TINT} colors={REFRESH_COLORS} />
          }
        >
          {/* Friendly Greeting */}
          <View className="mt-2">
            <Text className="font-display text-[30px] leading-[46px] text-on-surface">
              {greeting}, <Text className="font-display">{profile?.display_name ?? "Reader"}</Text>
            </Text>
            <Text className="text-on-surface-variant mt-2 font-body-lg">
              {greetingSubtitle}
            </Text>
          </View>

          {/* Upcoming Session */}
          {scheduleBlocks.length > 0 && nextBlock ? (
            <>
              <Pressable onPress={() => router.push("/schedule" as never)} className="flex-row items-center justify-between">
                <Text className="font-headline-lg-mobile text-on-surface">Reading Session</Text>
                <View className="flex-row items-center gap-1">
                  <Text className="text-primary font-label-md">Manage Schedule</Text>
                  <Icon name="chevron_right" size={18} color={Colors.primary} />
                </View>
              </Pressable>
              <Pressable
                onPress={() => setConfirmStart(true)}
                className="bg-primary rounded-2xl p-4 flex-row items-stretch active:opacity-95"
              >
                <View
                  className="w-[116px] h-[185px] mr-4"
                  style={{
                    
                    shadowColor: Colors.shadowDark,
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 6,
                  }}
                >
                  <View className="flex-1 rounded-lg overflow-hidden bg-surface-variant">
                    {nextBlock.books?.cover_url ? (
                      <Image
                        source={{ uri: nextBlock.books.cover_url }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                        recyclingKey={nextBlock.books.cover_url}
                        transition={150}
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Icon name="auto_stories" size={32} color={Colors.outline} />
                      </View>
                    )}
                  </View>
                </View>

                <View className="flex-1 justify-between py-1 gap-3">
                  <View className="gap-1">
                    <Text className="font-label-md text-white/80 uppercase tracking-wider">Upcoming</Text>
                    <Text className="font-display text-[22px] leading-[27px] text-white" numberOfLines={3}>
                      {nextBlock.books?.title ?? nextBlock.label ?? "Reading session"}
                    </Text>
                    {nextBlock.books?.author ? (
                      <Text className="text-caption text-white/75" numberOfLines={1}>{nextBlock.books.author}</Text>
                    ) : null}
                  </View>

                  <View className="gap-3">
                    <View className="flex-row items-center gap-1.5">
                      <Icon name="schedule" size={12} color={Colors.onPrimary} />
                      <Text className="font-label-md text-white/90 text-xs" numberOfLines={1}>
                        {describeNextBlockTime(nextBlock)} · {nextBlockDuration} min
                      </Text>
                    </View>
                    <Pressable
                      onPress={startScheduledSession}
                      className="bg-white rounded-full py-3 px-6 flex-row items-center gap-2 self-start active:opacity-90"
                    >
                      <Text className="text-primary font-label-lg font-semibold">Start Session</Text>
                      <Icon name="arrow_forward" size={16} color={Colors.primary} />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => router.push("/schedule" as never)}
              className="bg-surface-container-low rounded-[24px] p-8 items-center gap-4 active:bg-surface-container"
            >
              <View className="p-3 bg-primary/10 rounded-2xl">
                <Icon name="schedule" size={28} color={Colors.primary} />
              </View>
              <View className="items-center gap-1">
                <Text className="font-title-lg text-lg text-on-surface">Set Your Reading Schedule</Text>
                <Text className="text-on-surface-variant text-[12px] text-center max-w-[260px]">
                  Pick a time to read, we&apos;ll remind you when it&apos;s time.
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
                    onPress={() => { prefetchCovers([item.books?.cover_url]); router.push(`/book-detail?book_id=${item.book_id}`); }}
                    className="w-[140px] active:opacity-80"
                  >
                    <View className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-surface-variant">
                      {item.books?.cover_url ? (
                        <Image source={{ uri: item.books.cover_url }} style={{ width: "100%", height: "100%" }} contentFit="cover" recyclingKey={item.books.cover_url} transition={150} />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Icon name="auto_stories" size={36} color={Colors.outline} />
                        </View>
                      )}
                    </View>
                    <Text className="mt-2 font-title-lg text-on-surface" numberOfLines={1}>{item.books?.title ?? "Unknown"}</Text>
                    <Text className="text-caption text-outline" numberOfLines={1}>{item.books?.author ?? ""}</Text>
                    <View className="flex-row items-center gap-1 mt-1">
                      <Icon name="play_arrow" size={14} color={Colors.primary} filled />
                      <Text className="font-label-md text-primary text-xs">Resume</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/browse-books" as never)}
              className="rounded-[24px] bg-surface-container-low p-8 items-center gap-3 active:bg-surface-container"
            >
              <Icon name="auto_stories" size={40} color={Colors.outline} />
              <Text className="font-title-lg text-on-surface text-center">Nothing being read yet</Text>
              <Text className="font-body-md text-[12px] text-on-surface-variant text-center">
                Add a book to your queue to start reading.
              </Text>
              <Text className="text-primary font-label-md mt-2">Browse books</Text>
            </Pressable>
          )}

          {/* Want to Read Carousel */}
          {wantToReadItems.length > 0 ? (
            <View className="gap-4">
              <View className="flex-row justify-between items-end px-1">
                <Text className="font-headline-md text-on-surface">Want to Read</Text>
                <Pressable className="flex-row items-center gap-1" onPress={() => router.push("/library" as never)}>
                  <Text className="text-on-surface-variant font-label-md">See All</Text>
                  <Icon name="chevron_right" size={16} color={Colors.onSurfaceVariant} />
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
                    onPress={() => { prefetchCovers([item.books?.cover_url]); router.push(`/book-detail?book_id=${item.book_id}`); }}
                    className="w-[140px] active:opacity-80"
                  >
                    <View className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-surface-variant">
                      {item.books?.cover_url ? (
                        <Image source={{ uri: item.books.cover_url }} style={{ width: "100%", height: "100%" }} contentFit="cover" recyclingKey={item.books.cover_url} transition={150} />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Icon name="auto_stories" size={36} color={Colors.outline} />
                        </View>
                      )}
                    </View>
                    <Text className="mt-2 font-title-lg text-on-surface" numberOfLines={1}>{item.books?.title ?? "Unknown"}</Text>
                    <Text className="text-caption text-outline" numberOfLines={1}>{item.books?.author ?? ""}</Text>
                    <View className="flex-row items-center gap-1 mt-1">
                      <Icon name="play_arrow" size={14} color={Colors.primary} filled />
                      <Text className="font-label-md text-primary text-xs">Start Reading</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : recommendedLoading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              contentContainerStyle={{ gap: 16 }}
            >
              {[1, 2, 3].map((i) => (
                <View key={i} className="w-[140px] gap-2">
                  <SkeletonBlock className="w-full aspect-[2/3] rounded-2xl" />
                  <SkeletonBlock className="w-full h-4" />
                  <SkeletonBlock className="w-2/3 h-3" />
                </View>
              ))}
            </ScrollView>
          ) : recommendedItems.length > 0 ? (
            <View className="gap-4">
              <View className="flex-row justify-between items-end px-1">
                <Text className="font-headline-md text-on-surface">Recommended for You</Text>
                <Pressable className="flex-row items-center gap-1" onPress={() => router.push("/browse-books" as never)}>
                  <Text className="text-on-surface-variant font-label-md">See All</Text>
                  <Icon name="chevron_right" size={16} color={Colors.onSurfaceVariant} />
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={{ gap: 16 }}
              >
                {recommendedItems.map((d) => (
                  <Pressable
                    key={d.key}
                    onPress={() => { prefetchCovers([d.cover_url]); router.push(`/book-detail?open_library_id=${d.open_library_id}`); }}
                    className="w-[140px] active:opacity-80"
                  >
                    <View className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-surface-variant">
                      {d.cover_url ? (
                        <Image source={{ uri: d.cover_url }} style={{ width: "100%", height: "100%" }} contentFit="cover" recyclingKey={d.cover_url} transition={150} />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Text className="text-outline font-display text-headline-md">{d.title[0] ?? "?"}</Text>
                        </View>
                      )}
                    </View>
                    <Text className="mt-2 font-title-lg text-on-surface" numberOfLines={1}>{d.title}</Text>
                    <Text className="text-caption text-outline" numberOfLines={1}>{d.author ?? ""}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/browse-books" as never)}
              className="rounded-[24px] bg-surface-container-low p-8 items-center gap-3 active:bg-surface-container"
            >
              <Icon name="auto_stories" size={40} color={Colors.outline} />
              <Text className="font-title-lg text-on-surface text-center">Your queue is empty</Text>
              <Text className="font-body-md text-on-surface-variant text-center">
                Browse books to add to your reading list.
              </Text>
              <Text className="text-primary font-label-md mt-2">Browse books</Text>
            </Pressable>
          )}

          {/* Recently Finished */}
          {finishedBooks && finishedBooks.length > 0 ? (
            <View className="gap-4">
              <View className="flex-row justify-between items-end">
                <Text className="font-headline-md text-on-surface">Recently Finished</Text>
                <Pressable className="flex-row items-center gap-1" onPress={() => router.push("/library" as never)}>
                  <Text className="text-on-surface-variant font-label-md">See All</Text>
                  <Icon name="chevron_right" size={16} color={Colors.onSurfaceVariant} />
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
                    onPress={() => { prefetchCovers([item.books?.cover_url]); router.push(`/book-detail?book_id=${item.book_id}`); }}
                    subtitle={item.books?.author}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <ConfirmModal
        visible={confirmStart}
        title="Start reading session?"
        message={nextBlock?.books ? `Start "${nextBlock.books.title}"?` : "Start your scheduled reading session now?"}
        confirmLabel="Start"
        icon="auto_stories"
        tone="primary"
        onCancel={() => setConfirmStart(false)}
        onConfirm={() => {
          setConfirmStart(false);
          startScheduledSession();
        }}
      />
    </View>
  );
}
