import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/auth-store";
import { getProfile } from "../../lib/profiles";
import { getReadingStats, getWeeklySessionDays, getTargetPerformance } from "../../lib/reading-sessions";
import { getQueueItems } from "../../lib/queue-items";
import { generateWeeklyInsight } from "../../lib/weekly-coach";
import { usePullRefresh, REFRESH_TINT, REFRESH_COLORS } from "../../lib/use-pull-refresh";
import TopAppBar from "../../components/TopAppBar";
import StatTile from "../../components/StatTile";
import { ProfileSkeleton } from "../../components/SkeletonScreens";
import { BookCardVertical } from "../../components/BookCard";
import ReflectionCard from "../../components/ReflectionCard";

const seasonMantras = [
  "Spring has sprung, and so has your reading",
  "Summer days were made for page-turning",
  "Autumn leaves and dog-eared pages",
  "Winter nights, bookish lights",
];

function getSeasonMantra(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return seasonMantras[0];
  if (month >= 5 && month <= 7) return seasonMantras[1];
  if (month >= 8 && month <= 10) return seasonMantras[2];
  return seasonMantras[3];
}

export default function Profile() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile, isRefetching: refetchingProfile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isRefetching: refetchingStats } = useQuery({
    queryKey: ["reading-stats", userId],
    queryFn: () => getReadingStats(userId!),
    enabled: !!userId,
  });

  const { data: weekData, refetch: refetchWeek, isRefetching: refetchingWeek } = useQuery({
    queryKey: ["weekly-session-days", userId],
    queryFn: () => getWeeklySessionDays(userId!, 2),
    enabled: !!userId,
  });

  const { data: insight, isLoading: insightLoading, refetch: refetchInsight, isRefetching: refetchingInsight } = useQuery({
    queryKey: ["weekly-insight", userId],
    queryFn: () => generateWeeklyInsight(userId!),
    enabled: !!userId,
  });

  const { data: finishedBooks, refetch: refetchFinished, isRefetching: refetchingFinished } = useQuery({
    queryKey: ["finished-books", userId],
    queryFn: () => getQueueItems(userId!, 'finished'),
    enabled: !!userId,
  });

  const { data: targetPerf, refetch: refetchTarget, isRefetching: refetchingTarget } = useQuery({
    queryKey: ["target-performance", userId],
    queryFn: () => getTargetPerformance(userId!),
    enabled: !!userId,
  });

  const vineDots = useMemo(() => {
    if (!weekData || weekData.length === 0) return [];
    const days = weekData.slice(-14);
    return days.map((d) => {
      const hasSession = d.minutes > 0;
      const intensity = Math.min(d.minutes / 30, 1);
      return {
        size: hasSession ? Math.round(8 + intensity * 16) : 6,
        active: hasSession,
      };
    });
  }, [weekData]);

  const completionRate = stats && stats.sessionsCount > 0
    ? Math.round((stats.streakDays / Math.max(stats.sessionsCount, 14)) * 100)
    : 0;

  const genreLabels = Object.keys(profile?.genre_weights ?? {});
  const currentYear = new Date().getFullYear();
  const goalText = profile
    ? `${profile.yearly_goal} books in ${currentYear}`
    : "Set your goal";
  const goalProgress = profile && profile.yearly_goal > 0
    ? Math.min((stats?.booksCompleted ?? 0) / profile.yearly_goal * 100, 100)
    : 0;

  const isLoading = profileLoading || statsLoading || insightLoading;

  const refreshing =
    refetchingProfile || refetchingStats || refetchingWeek ||
    refetchingInsight || refetchingFinished || refetchingTarget;

  const { refreshing: isRefreshing, onRefresh } = usePullRefresh(
    [refetchProfile, refetchStats, refetchWeek, refetchInsight, refetchFinished, refetchTarget],
    refreshing
  );

  if (isLoading) return <ProfileSkeleton />;

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar
        title="Profile"
        rightActions={[{ icon: "settings", color: "#444841", onPress: () => router.push("/settings" as never) }]} />

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={REFRESH_TINT} colors={REFRESH_COLORS} />
          }
        >
          {/* Profile Header */}
          <View className="items-center mt-8 gap-4 px-2">
            <Text className="font-display text-[30px] leading-[40px] text-on-surface text-center">
              {`\u201C${getSeasonMantra()}, ${profile?.display_name ?? " "}\u201D`}
            </Text>
          </View>

          {/* Reading Goal */}
          <View className="bg-surface-container-low rounded-xl p-6 items-center gap-2">
            <Text className="font-label-md text-primary tracking-widest uppercase text-[10px]">Current Goal</Text>
            <Text className="font-display text-headline-md text-on-surface">{goalText}</Text>
            <View className="w-full max-w-xs h-1 bg-surface-variant rounded-full mt-2 overflow-hidden">
              <View className="h-full bg-primary rounded-full" style={{ width: `${goalProgress}%` }} />
            </View>
            <Text className="text-caption text-on-surface-variant">
              {stats?.booksCompleted ?? 0} book{(stats?.booksCompleted ?? 0) !== 1 ? "s" : ""} completed
            </Text>
          </View>

          {/* Weekly Coach */}
          <View className="gap-4">
            <Text className="font-title-lg text-on-surface">Weekly Coach</Text>
            <View className="gap-4">
              <ReflectionCard
                icon="auto_awesome"
                iconBg="bg-primary-fixed"
                iconColor="#52634c"
                text={insight?.narrative ?? "Start a reading session to get your personalized weekly insight."}
              />
              <ReflectionCard
                icon="lightbulb"
                iconBg="bg-secondary-fixed"
                iconColor="#7d562d"
                text={insight?.recommendation ?? "Log your first session and check back here for tailored recommendations."}
              />
            </View>
          </View>

          {/* Annual Journey */}
          <View className="gap-4">
            <View className="flex-row justify-between items-end">
              <Text className="font-display text-title-lg">Annual Journey</Text>
              <Text className="font-label-md text-primary">View Insights</Text>
            </View>
            <View className="flex-row gap-4">
              <StatTile
                icon="schedule"
                iconColor="#7d562d"
                value={stats ? `${Math.floor(stats.totalMinutes / 60)}h` : "—"}
                label="Reading Time"
              />
              <StatTile
                icon="auto_stories"
                iconColor="#52634c"
                value={stats ? stats.totalPages.toLocaleString() : "—"}
                label="Pages Turned"
              />
            </View>
          </View>

          {/* Consistency Vine */}
          <View className="p-6 bg-surface-container-low rounded-[32px] gap-6">
            <View className="flex-row justify-between items-end">
              <View className="gap-1">
                <Text className="font-title-lg text-on-surface">Consistency Vine</Text>
                <Text className="font-label-md text-on-surface-variant">
                  {stats && stats.streakDays > 0
                    ? `${stats.streakDays} day${stats.streakDays !== 1 ? "s" : ""} of mindfulness`
                    : "Start reading to grow your vine"}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-display text-headline-lg text-primary">
                  {completionRate > 0 ? `${completionRate}%` : "—"}
                </Text>
                <Text className="text-caption text-outline">Completion Rate</Text>
              </View>
            </View>
            <View className="relative h-16 flex-row items-center justify-between px-1">
              {vineDots.length > 0
                ? vineDots.map((dot, i) => (
                    <View
                      key={i}
                      className={`rounded-full ${dot.active ? "bg-primary" : "bg-outline-variant"}`}
                      style={{ width: dot.size, height: dot.size }}
                    />
                  ))
                : <Text className="font-body-md text-on-surface-variant w-full text-center">No data yet</Text>
              }
            </View>
          </View>

          {/* Favorite Genres */}
          <View className="gap-4">
            <Text className="font-display text-title-lg">Favorite Genres</Text>
            <View className="flex-row flex-wrap gap-2">
              {genreLabels.length > 0
                ? genreLabels.map((g) => (
                    <View key={g} className="px-4 py-1.5 rounded-full bg-primary/10">
                      <Text className="font-label-md text-primary">
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </View>
                  ))
                : (
                  <Text className="font-body-md text-on-surface-variant">
                    Add genres in onboarding to see them here.
                  </Text>
                )}
            </View>
          </View>

          {/* Recent Finishes */}
          <View className="gap-4">
            <View className="flex-row justify-between items-center">
              <Text className="font-title-lg text-on-surface">Recent Finishes</Text>
              <Pressable onPress={() => router.push("/library" as never)}>
                <Text className="text-primary font-label-md">View All</Text>
              </Pressable>
            </View>
            {finishedBooks && finishedBooks.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                {finishedBooks.map((item) => (
                  <BookCardVertical
                    key={item.id}
                    book={{
                      title: item.books?.title ?? "Unknown",
                      author: item.books?.author,
                      cover_url: item.books?.cover_url,
                    }}
                    subtitle={item.books?.author}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text className="font-body-md text-on-surface-variant">
                Finished books will appear here.
              </Text>
            )}
          </View>

          {/* Target Performance */}
          {targetPerf && targetPerf.totalWithTarget > 0 ? (
            <View className="gap-4">
              <Text className="font-title-lg text-on-surface">Target Performance</Text>
              <View className="bg-surface-container-low rounded-2xl p-5 gap-4">
                <View className="flex-row justify-between items-center">
                  <Text className="font-body-md text-on-surface-variant">Average session</Text>
                  <Text className="font-title-lg text-on-surface">{targetPerf.averageSessionMinutes} min</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="font-body-md text-on-surface-variant">Average target</Text>
                  <Text className="font-title-lg text-on-surface">{targetPerf.averageTargetMinutes} min</Text>
                </View>
                <View className="h-px bg-surface-variant" />
                <View className="flex-row justify-around">
                  <View className="items-center gap-1">
                    <Text className="font-display text-headline-md text-secondary">{targetPerf.exceededCount}</Text>
                    <Text className="text-caption text-on-surface-variant">Exceeded</Text>
                  </View>
                  <View className="items-center gap-1">
                    <Text className="font-display text-headline-md text-primary">{targetPerf.metCount}</Text>
                    <Text className="text-caption text-on-surface-variant">Met</Text>
                  </View>
                  <View className="items-center gap-1">
                    <Text className="font-display text-headline-md text-outline">{targetPerf.fellShortCount}</Text>
                    <Text className="text-caption text-on-surface-variant">Fell short</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
