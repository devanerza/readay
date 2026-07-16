import React from "react";
import { View, Text, ScrollView, Image, Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth-store";
import { getBookDetails, buildCoverUrl } from "../lib/open-library";
import { cacheBookFromDetail } from "../lib/book-service";
import { addToQueue } from "../lib/queue-items";
import { getReadingStats } from "../lib/reading-sessions";
import TopAppBar from "../components/TopAppBar";
import ProgressBar from "../components/ProgressBar";
import LoadingOverlay from "../components/LoadingOverlay";
import Icon from "../components/Icon";

export default function BookDetail() {
  const router = useRouter();
  const { open_library_id } = useLocalSearchParams<{ open_library_id?: string }>();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;

  const { data: detail, isLoading } = useQuery({
    queryKey: ["ol-detail", open_library_id],
    queryFn: () => getBookDetails(open_library_id!),
    enabled: !!open_library_id,
  });

  const { data: stats } = useQuery({
    queryKey: ["reading-stats", userId],
    queryFn: () => getReadingStats(userId!),
    enabled: !!userId,
  });

  const [adding, setAdding] = React.useState(false);

  const displayCover = detail?.covers?.[0] ? buildCoverUrl(detail.covers[0]) : null;
  const displayDescription = typeof detail?.description === "string" ? detail.description : detail?.description?.value ?? null;
  const genreTags = detail?.subjects?.slice(0, 3) ?? [];
  const estimateTime = null; // OL doesn't provide read time

  const handleStartReading = async () => {
    if (!userId || !open_library_id) return;
    setAdding(true);
    try {
      const bookId = await cacheBookFromDetail(open_library_id);
      await addToQueue({ user_id: userId, book_id: bookId });
      router.push(`/reading-session?book_id=${bookId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : typeof e === 'object' && e ? (e as any).message ?? JSON.stringify(e) : String(e);
      Alert.alert("Error", `Could not add: ${msg}`);
    } finally {
      setAdding(false);
    }
  };

  const handleAddToQueue = async () => {
    if (!userId || !open_library_id) return;
    setAdding(true);
    try {
      const bookId = await cacheBookFromDetail(open_library_id);
      await addToQueue({ user_id: userId, book_id: bookId });
      Alert.alert("Added", `${detail?.title ?? "Book"} added to your queue.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : typeof e === 'object' && e ? (e as any).message ?? JSON.stringify(e) : String(e);
      Alert.alert("Error", `Could not add: ${msg}`);
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) return <LoadingOverlay />;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar
          onBack={() => router.back()}
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
          {/* Hero */}
          <View className="px-margin-page pt-4 items-center">
            <View className="w-full max-w-[280px] aspect-[2/3] rounded-lg overflow-hidden bg-surface-variant">
              {displayCover ? (
                <Image source={{ uri: displayCover }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-outline font-display text-headline-xl">{detail?.title?.[0] ?? "?"}</Text>
                </View>
              )}
            </View>

            <View className="items-center pt-4 w-full">
              {genreTags.length > 0 && (
                <View className="flex-row flex-wrap justify-center gap-2 mb-3">
                  {genreTags.map((tag) => (
                    <View key={tag} className="bg-tertiary-container/10 px-3 py-1 rounded-full">
                      <Text className="font-label-md text-on-tertiary-container">{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text className="font-headline-lg-mobile text-on-surface text-center mb-1">{detail?.title ?? "Unknown Book"}</Text>

              {/* Stats */}
              <View className="flex-row gap-4 w-full mb-6">
                <View className="flex-1 bg-surface-container-low p-4 rounded-xl">
                  <Text className="text-caption text-outline uppercase tracking-wider mb-1">Time to Read</Text>
                  <View className="flex-row items-center gap-2">
                    <Icon name="schedule" size={18} color="#52634c" />
                    <Text className="font-title-lg text-body-md text-primary">—</Text>
                  </View>
                </View>
                <View className="flex-1 bg-surface-container-low p-4 rounded-xl">
                  <Text className="text-caption text-outline uppercase tracking-wider mb-1">Released</Text>
                  <View className="flex-row items-center gap-2">
                    <Icon name="calendar_month" size={18} color="#52634c" />
                    <Text className="font-title-lg text-body-md text-primary">{detail?.first_publish_date ?? "—"}</Text>
                  </View>
                </View>
              </View>

              {/* CTA */}
              <Pressable
                onPress={handleStartReading}
                disabled={adding}
                className="w-full py-4 bg-primary rounded-full items-center flex-row justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Icon name="play_arrow" size={20} color="#ffffff" filled />
                <Text className="text-white font-label-md">{adding ? "Adding..." : "Start Reading"}</Text>
              </Pressable>
              <Pressable
                onPress={handleAddToQueue}
                disabled={adding}
                className="w-full py-3 mt-3 items-center active:opacity-70"
              >
                <Text className="font-label-md text-primary">Add to Queue</Text>
              </Pressable>
            </View>
          </View>

          {/* Description */}
          {displayDescription && (
            <View className="px-margin-page mt-8">
              <View className="flex-row items-center gap-3 mb-4">
                <View className="w-10 h-10 rounded-full bg-secondary-container items-center justify-center">
                  <Icon name="favorite" size={18} color="#7a532a" />
                </View>
                <Text className="font-headline-md text-on-surface">About this book</Text>
              </View>
              <Text className="font-body-lg text-on-surface-variant leading-relaxed">
                {displayDescription}
              </Text>
            </View>
          )}

          {/* Reading Progress */}
          {stats && stats.sessionsCount > 0 && (
            <View className="px-margin-page mt-8">
              <View className="bg-surface-container-high/40 p-6 rounded-2xl border border-surface-variant">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="font-title-lg text-on-surface">Your Reading</Text>
                  <Text className="font-label-md text-primary">{stats.totalMinutes} min</Text>
                </View>
                <ProgressBar progress={Math.min((stats.totalPages / 300) * 100, 100)} />
                <Text className="mt-3 text-caption text-on-surface-variant italic">
                  {stats.sessionsCount} session{stats.sessionsCount !== 1 ? "s" : ""} logged
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
