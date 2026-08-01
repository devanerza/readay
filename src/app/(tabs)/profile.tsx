import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/auth-store";
import { getProfile } from "../../lib/profiles";
import { getReadingStats, getWeeklySessionDays, getTargetPerformance } from "../../lib/reading-sessions";
import { getQueueItems } from "../../lib/queue-items";
import { generateWeeklyInsight } from "../../lib/weekly-coach";
import TopAppBar from "../../components/TopAppBar";
import StatTile from "../../components/StatTile";
import { ProfileSkeleton } from "../../components/SkeletonScreens";
import { BookCardVertical } from "../../components/BookCard";
import ReflectionCard from "../../components/ReflectionCard";
import Icon, { type IconName } from "../../components/Icon";

const QUOTES = [
  "A reader lives a thousand lives before they die.",
  "Today a reader, tomorrow a leader.",
  "Reading is to the mind what exercise is to the body.",
  "So many books, so little time.",
  "The more that you read, the more things you will know.",
  "Books are a uniquely portable magic.",
  "Reading is an exercise in empathy.",
  "A room without books is like a body without a soul.",
];

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

function getRandomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

const PREFERENCES: { icon: IconName; label: string; value: string }[] = [
  { icon: "wb_twilight", label: "Preferred Timing", value: "Evening" },
  { icon: "mood", label: "Reading Mood", value: "Contemplative" },
  { icon: "light_mode", label: "Theme", value: "Paper White" },
];

export default function Profile() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["reading-stats", userId],
    queryFn: () => getReadingStats(userId!),
    enabled: !!userId,
  });

  const { data: queueItems } = useQuery({
    queryKey: ["queue-count", userId],
    queryFn: () => getQueueItems(userId!),
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

  const { data: targetPerf } = useQuery({
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

  const genreLabels = Object.keys(profile?.genre_weights ?? {});
  const currentYear = new Date().getFullYear();
  const goalText = profile
    ? `${profile.yearly_goal} books in ${currentYear}`
    : "Set your goal";
  const goalProgress = profile && profile.yearly_goal > 0
    ? Math.min((stats?.booksCompleted ?? 0) / profile.yearly_goal * 100, 100)
    : 0;

  const isLoading = profileLoading || statsLoading || insightLoading;

  if (isLoading) return <ProfileSkeleton />;

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar
        title="Profile"
        rightActions={[{ icon: "settings", color: "#444841" }]} />

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View className="items-center mt-8 gap-4 px-2">
            <Text className="font-display text-[30px] leading-[40px] text-on-surface text-center">
              "{getSeasonMantra()}, {profile?.display_name ?? " "}"
            </Text>
            {/* <View className="flex-row items-center gap-2">
              <View className="h-px w-6 bg-outline/30" />
              <Text className="font-title-lg text-on-surface-variant">{profile?.display_name ?? "Reader"}</Text>
              <View className="h-px w-6 bg-outline/30" />
            </View>
            <Text className="font-body-md text-primary">{getSeasonMantra()}</Text> */}
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

          {/* Personal Library Link */}
          <Pressable className="bg-surface-container-lowest border border-surface-variant/20 rounded-xl p-4 flex-row items-center justify-between active:bg-surface-container-low">
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 rounded-lg bg-primary-container/20 items-center justify-center">
                <Icon name="book_2" size={20} color="#52634c" />
              </View>
              <View>
                <Text className="font-title-lg text-[18px]">Personal Library</Text>
                <Text className="text-caption text-on-surface-variant">
                  {queueItems?.length ?? "—"} title{(queueItems?.length ?? 0) !== 1 ? "s" : ""} collected
                </Text>
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
