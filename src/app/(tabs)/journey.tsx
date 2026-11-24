import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuthStore } from "../../stores/auth-store";
import { getProfile } from "../../lib/profiles";
import { getReadingStats, getDailySessionCounts, getTargetPerformance } from "../../lib/reading-sessions";
import { getQueueItems } from "../../lib/queue-items";
import { getWeeklyInsight } from "../../lib/weekly-coach";
import { usePullRefresh, REFRESH_TINT, REFRESH_COLORS } from "../../lib/use-pull-refresh";
import TopAppBar from "../../components/TopAppBar";
import StatTile from "../../components/StatTile";
import { JourneySkeleton } from "../../components/SkeletonScreens";
import { BookCardVertical } from "../../components/BookCard";
import ReflectionCard from "../../components/ReflectionCard";
import { t } from "../../i18n";
import { Colors } from "../../constants/colors";

const ACTIVITY_WEEKS = 13;
const CELL_SIZE = 14;
const CELL_GAP = 5;
const WEEKDAY_WIDTH = 18;
const LABEL_GUTTER = WEEKDAY_WIDTH + 6;
const WEEKDAY_LABELS = ["M", "", "W", "", "F", "", ""];
const EMPTY_ACTIVITY_DAYS: { date: string; count: number }[] = [];
const ACTIVITY_COLORS = [
  Colors.surfaceVariant,
  "rgba(82, 99, 76, 0.28)",
  "rgba(82, 99, 76, 0.5)",
  "rgba(82, 99, 76, 0.72)",
  Colors.primary,
];

function activityLevel(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

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

  const { data: dailyCounts, refetch: refetchActivity, isRefetching: refetchingActivity } = useQuery({
    queryKey: ["daily-session-counts", userId],
    queryFn: () => getDailySessionCounts(userId!, ACTIVITY_WEEKS),
    enabled: !!userId,
  });

  const { data: insight, isLoading: insightLoading, refetch: refetchInsight, isRefetching: refetchingInsight } = useQuery({
    queryKey: ["weekly-insight", userId],
    queryFn: () => getWeeklyInsight(userId!),
    enabled: !!userId,
  });

  const { data: finishedBooks, refetch: refetchFinished, isRefetching: refetchingFinished } = useQuery({
    queryKey: ["queue-items", userId, "finished"],
    queryFn: () => getQueueItems(userId!, 'finished'),
    enabled: !!userId,
  });

  const { data: targetPerf, refetch: refetchTarget, isRefetching: refetchingTarget } = useQuery({
    queryKey: ["target-performance", userId],
    queryFn: () => getTargetPerformance(userId!),
    enabled: !!userId,
  });

  const activityDays = dailyCounts ?? EMPTY_ACTIVITY_DAYS;
  const activityWeeks = useMemo(
    () => Array.from({ length: ACTIVITY_WEEKS }, (_, i) => activityDays.slice(i * 7, i * 7 + 7)),
    [activityDays]
  );
  const monthLabels = useMemo(
    () => activityWeeks.map((week, i) => {
      if (week.length === 0) return "";
      const label = format(new Date(`${week[0].date}T00:00:00`), "MMM");
      const previous = activityWeeks[i - 1]?.[0];
      return previous && format(new Date(`${previous.date}T00:00:00`), "MMM") === label ? "" : label;
    }),
    [activityWeeks]
  );
  const activitySessionCount = activityDays.reduce((total, day) => total + day.count, 0);

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
    refetchingProfile || refetchingStats || refetchingActivity ||
    refetchingInsight || refetchingFinished || refetchingTarget;

  const { refreshing: isRefreshing, onRefresh } = usePullRefresh(
    [refetchProfile, refetchStats, refetchActivity, refetchInsight, refetchFinished, refetchTarget],
    refreshing
  );

  if (isLoading) return <JourneySkeleton />;

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar
        title="Journey"
        rightSlot={
          <Pressable onPress={() => router.push("/profile" as never)} className="w-9 h-9 rounded-full bg-primary items-center justify-center active:opacity-80">
            <Text className="font-display text-sm text-on-primary">
              {(profile?.display_name ?? "R")[0].toUpperCase()}
            </Text>
          </Pressable>
        } />

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
          <View className="bg-primary rounded-xl p-6 items-center gap-2">
            <Text className="font-label-md text-surface tracking-widest uppercase text-[10px]">Current Goal</Text>
            <Text className="font-display text-headline-md text-surface">{goalText}</Text>
            <View className="w-full max-w-xs h-1 bg-surface-variant rounded-full mt-2 overflow-hidden">
              <View className="h-full bg-primary rounded-full" style={{ width: `${goalProgress}%` }} />
            </View>
            <Text className="text-caption text-surface">
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
                iconColor={Colors.primary}
                text={insight?.narrative ?? "Start a reading session to get your personalized weekly insight."}
              />
              <ReflectionCard
                icon="lightbulb"
                iconBg="bg-secondary-fixed"
                iconColor={Colors.secondary}
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
                iconColor={Colors.surface}
                value={stats ? `${Math.floor(stats.totalMinutes / 60)}h` : "—"}
                label="Reading Time"
              />
              <StatTile
                icon="auto_stories"
                iconColor={Colors.surface}
                value={stats ? stats.totalPages.toLocaleString() : "—"}
                label="Pages Turned"
              />
            </View>
          </View>

          {/* Reading Activity — one block per day, 13 weeks of sessions */}
          <View className="p-6 bg-surface-container-low rounded-[32px] gap-5">
            <View className="flex-row justify-between items-end gap-4">
              <View className="flex-1 gap-1">
                <Text className="font-display text-title-lg text-on-surface">
                  {t("journey.activityTitle")}
                </Text>
                <Text className="font-body-md text-on-surface-variant">
                  {activitySessionCount > 0
                    ? t("journey.activityCount", { count: activitySessionCount, weeks: ACTIVITY_WEEKS })
                    : t("journey.activityEmpty")}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-display text-headline-lg text-on-surface">
                  {stats?.streakDays ?? 0}
                </Text>
                <Text className="text-caption text-on-surface-variant">
                  {t("journey.dayStreak")}
                </Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View className="flex-row mb-2" style={{ marginLeft: LABEL_GUTTER }}>
                  {monthLabels.map((label, i) => (
                    <Text
                      key={i}
                      numberOfLines={1}
                      className="text-caption text-on-surface-variant"
                      style={{ width: i === monthLabels.length - 1 ? CELL_SIZE : CELL_SIZE + CELL_GAP }}
                    >
                      {label}
                    </Text>
                  ))}
                </View>
                <View className="flex-row">
                  <View style={{ width: WEEKDAY_WIDTH, marginRight: LABEL_GUTTER - WEEKDAY_WIDTH }}>
                    {WEEKDAY_LABELS.map((label, i) => (
                      <View
                        key={i}
                        className="justify-center"
                        style={{ height: CELL_SIZE + (i < WEEKDAY_LABELS.length - 1 ? CELL_GAP : 0) }}
                      >
                        <Text className="text-caption text-on-surface-variant">{label}</Text>
                      </View>
                    ))}
                  </View>
                  <View className="flex-row" style={{ gap: CELL_GAP }}>
                    {activityWeeks.map((week, weekIndex) => (
                      <View key={weekIndex} style={{ gap: CELL_GAP }}>
                        {week.map((day) => (
                          <View
                            key={day.date}
                            style={{
                              width: CELL_SIZE,
                              height: CELL_SIZE,
                              borderRadius: 3,
                              backgroundColor: ACTIVITY_COLORS[activityLevel(day.count)],
                            }}
                          />
                        ))}
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="flex-row items-center justify-end gap-1.5">
              <Text className="text-caption text-on-surface-variant">{t("journey.less")}</Text>
              {ACTIVITY_COLORS.map((color, i) => (
                <View
                  key={i}
                  style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }}
                />
              ))}
              <Text className="text-caption text-on-surface-variant">{t("journey.more")}</Text>
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
