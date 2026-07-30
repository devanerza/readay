import React from "react";
import { View, Text, ScrollView, Image, Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth-store";
import { getBook, getBookByOlId } from "../lib/books";
import { getBookDetails, buildCoverUrl, getWorkPageCount } from "../lib/open-library";
import { cacheBookFromDetail } from "../lib/book-service";
import { addToQueue, getCurrentPage } from "../lib/queue-items";
import { getReadingStats } from "../lib/reading-sessions";
import { supabase } from "../lib/supabase";
import TopAppBar from "../components/TopAppBar";
import ProgressBar from "../components/ProgressBar";
import { BookDetailSkeleton } from "../components/SkeletonScreens";
import Icon from "../components/Icon";

export default function BookDetail() {
  const router = useRouter();
  const { book_id, open_library_id } = useLocalSearchParams<{ book_id?: string; open_library_id?: string }>();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [adding, setAdding] = React.useState(false);

  const { data: localBook, isLoading: localLoading } = useQuery({
    queryKey: ["local-book", book_id || open_library_id],
    queryFn: () => book_id ? getBook(book_id) : getBookByOlId(open_library_id!),
    enabled: !!(book_id || open_library_id),
  });

  const olId = open_library_id || localBook?.open_library_id;

  const { data: detail, isLoading: olLoading } = useQuery({
    queryKey: ["ol-detail", olId],
    queryFn: () => getBookDetails(olId!),
    enabled: !!olId,
  });

  const localBookId = book_id || localBook?.id;
  const cachedPageCount = localBook?.page_count ?? 0;

  const { data: olPageCount } = useQuery({
    queryKey: ["ol-page-count", olId],
    queryFn: async () => {
      const count = await getWorkPageCount(olId!);
      if (count && localBook?.id) {
        await supabase.from('books').update({ page_count: count }).eq('id', localBook.id);
      }
      return count;
    },
    enabled: !!olId && cachedPageCount === 0,
  });

  const pageCount = cachedPageCount || olPageCount || 0;

  const { data: currentPage = 0 } = useQuery({
    queryKey: ["current-page", localBookId, userId],
    queryFn: () => getCurrentPage(localBookId!, userId!),
    enabled: !!localBookId && !!userId,
  });

  const { data: stats } = useQuery({
    queryKey: ["reading-stats", userId],
    queryFn: () => getReadingStats(userId!),
    enabled: !!userId,
  });

  const displayCover = detail?.covers?.[0] ? buildCoverUrl(detail.covers[0]) : null;
  const displayDescription = typeof detail?.description === "string" ? detail.description : detail?.description?.value ?? null;
  const genreTags = detail?.subjects?.slice(0, 3) ?? [];
  const progressPct = pageCount > 0 ? Math.min((currentPage / pageCount) * 100, 100) : 0;

  const handleAddToLibrary = async () => {
    if (!userId || !olId) return;
    setAdding(true);
    try {
      const bookId = await cacheBookFromDetail(olId);
      await addToQueue({ user_id: userId, book_id: bookId });
      Alert.alert("Added", `${detail?.title ?? "Book"} added to your library.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : typeof e === 'object' && e ? (e as any).message ?? JSON.stringify(e) : String(e);
      Alert.alert("Error", `Could not add: ${msg}`);
    } finally {
      setAdding(false);
    }
  };

  if (olLoading || localLoading) return <BookDetailSkeleton />;

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
                  <Text className="text-caption text-outline uppercase tracking-wider mb-1">Pages</Text>
                  <View className="flex-row items-center gap-2">
                    <Icon name="auto_stories" size={18} color="#52634c" />
                    <Text className="font-title-lg text-body-md text-primary">
                      {pageCount > 0 ? pageCount : "—"}
                    </Text>
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
                onPress={handleAddToLibrary}
                disabled={adding}
                className="w-full py-4 bg-primary rounded-full items-center flex-row justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Icon name={adding ? "check" : "book_2"} size={20} color="#ffffff" filled />
                <Text className="text-white font-label-md">{adding ? "Adding..." : "Add to Library"}</Text>
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
          {localBookId && pageCount > 0 ? (
            <View className="px-margin-page mt-8">
              <View className="bg-surface-container-high/40 p-6 rounded-2xl border border-surface-variant">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="font-title-lg text-on-surface">Your Reading</Text>
                  <Text className="font-label-md text-primary">{currentPage} / {pageCount}</Text>
                </View>
                <ProgressBar progress={progressPct} />
                <Text className="mt-3 text-caption text-on-surface-variant">
                  {currentPage > 0 ? `${Math.round(progressPct)}% complete` : "Not started yet"}
                </Text>
              </View>
            </View>
          ) : stats && stats.sessionsCount > 0 ? (
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
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
