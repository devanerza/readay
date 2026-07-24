import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/auth-store";
import { getProfile } from "../../lib/profiles";
import { getReadingStats, getWeeklySessionDays } from "../../lib/reading-sessions";
import { getQueueItems } from "../../lib/queue-items";
import { generateWeeklyInsight } from "../../lib/weekly-coach";
import TopAppBar from "../../components/TopAppBar";
import LoadingOverlay from "../../components/LoadingOverlay";
import { BookCardVertical } from "../../components/BookCard";
import ReflectionCard from "../../components/ReflectionCard";

const SEASONS = [
  { name: "Spring", months: [2, 3, 4] },
  { name: "Summer", months: [5, 6, 7] },
  { name: "Autumn", months: [8, 9, 10] },
  { name: "Winter", months: [11, 0, 1] },
];

function getCurrentSeason() {
  const m = new Date().getMonth();
  return SEASONS.find((s) => s.months.includes(m))?.name ?? "Winter";
}

export default function Journey() {
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["reading-stats", userId],
    queryFn: () => getReadingStats(userId!),
    enabled: !!userId,
  });

  const { data: weekData } = useQuery({
    queryKey: ["weekly-session-days", userId],
    queryFn: () => getWeeklySessionDays(userId!, 2),
    enabled: !!userId,
  });

  const { data: insight, isLoading: insightLoading } = useQuery({
    queryKey: ["weekly-insight", userId],
    queryFn: () => generateWeeklyInsight(userId!),
    enabled: !!userId,
  });

  const { data: finishedBooks } = useQuery({
    queryKey: ["finished-books", userId],
    queryFn: () => getQueueItems(userId!, 'finished'),
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

  const genreEntries = useMemo(() => {
    if (!profile?.genre_weights) return [];
    const weights = profile.genre_weights as Record<string, number>;
    return Object.entries(weights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);
  }, [profile]);

  const completionRate = stats && stats.sessionsCount > 0
    ? Math.round((stats.streakDays / Math.max(stats.sessionsCount, 14)) * 100)
    : 0;

  const season = getCurrentSeason();

  const isLoading = statsLoading || insightLoading;

  if (isLoading) return <LoadingOverlay />;

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar
          title="ReadFlow"
          rightActions={[{ icon: "settings", color: "#444841" }]}
        />

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View className="gap-3 mt-2">
            <Text className="font-label-md text-secondary uppercase tracking-widest">{season} Chapter</Text>
            <Text className="font-display text-[38px] leading-[44px] text-on-surface">
              {insight?.narrative ?? "Your reading narrative continues to unfold."}
            </Text>
            <Text className="font-body-lg text-on-surface-variant">
              {insight?.recommendation ?? "Start a session to unlock your weekly insight."}
            </Text>
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

          {/* Monthly Highlights */}
          <View className="gap-4">
            <View className="flex-row justify-between items-center">
              <Text className="font-title-lg text-on-surface">Recent Finishes</Text>
              <Pressable>
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

          {/* Evolving Tastes */}
          <View className="gap-6 items-center">
            <View className="gap-3 w-full">
              <Text className="font-title-lg text-on-surface">Evolving Tastes</Text>
              <Text className="font-body-md text-on-surface-variant">
                {profile && genreEntries.length === 2
                  ? `You're enjoying ${genreEntries[0][0]} and ${genreEntries[1][0]} this season.`
                  : "Your genre preferences from onboarding will guide your recommendations."}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {genreEntries.map(([genre, weight]) => (
                  <View key={genre} className={`px-4 py-1.5 rounded-full ${(weight as number) > 0.5 ? "bg-primary/10" : "bg-secondary/10"}`}>
                    <Text className={`font-label-md ${(weight as number) > 0.5 ? "text-primary" : "text-secondary"}`}>
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
