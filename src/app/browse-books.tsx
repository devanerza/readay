import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, Pressable, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { searchBooks, getBooksBySubject, buildCoverUrl, extractOpenLibraryId, type OLSearchResult } from "../lib/open-library";
import { prefetchCovers } from "../lib/cover-prefetch";
import { usePullRefresh, REFRESH_TINT, REFRESH_COLORS } from "../lib/use-pull-refresh";
import TopAppBar from "../components/TopAppBar";
import Icon from "../components/Icon";
import { SkeletonBlock } from "../components/Skeleton";
import { Colors } from "../constants/colors";

const GENRES = [
  { label: "All" },
  { label: "Fiction" },
  { label: "Mystery" },
  { label: "Sci-Fi" },
  { label: "Memoirs" },
  { label: "Classics" },
  { label: "Poetry" },
  { label: "Self-Help" },
  { label: "History" },
];

const SUBJECT_MAP: Record<string, string> = {
  "All": "fiction",
  "Fiction": "fiction",
  "Mystery": "mystery",
  "Sci-Fi": "science_fiction",
  "Memoirs": "biography",
  "Classics": "classic",
  "Poetry": "poetry",
  "Self-Help": "self_help",
  "History": "history",
};

function olToDisplay(doc: OLSearchResult) {
  return {
    key: doc.key,
    open_library_id: extractOpenLibraryId(doc.key),
    title: doc.title,
    author: doc.author_name?.[0] ?? "",
    cover_url: doc.cover_i ? buildCoverUrl(doc.cover_i) : null,
  };
}

export default function BrowseBooks() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults, isLoading: searching, refetch: refetchSearch, isRefetching: refetchingSearch } = useQuery({
    queryKey: ["browse-search", debouncedQuery],
    queryFn: () => searchBooks(debouncedQuery, 20),
    enabled: debouncedQuery.length >= 2,
  });

  const { data: subjectResults, isLoading: subjectLoading, refetch: refetchSubject, isRefetching: refetchingSubject } = useQuery({
    queryKey: ["browse-subject", activeGenre],
    queryFn: () => getBooksBySubject(SUBJECT_MAP[activeGenre] ?? "fiction", 24),
    enabled: !debouncedQuery,
  });

  const { refreshing: isRefreshing, onRefresh } = usePullRefresh(
    [refetchSearch, refetchSubject],
    refetchingSearch || refetchingSubject
  );

  const displayDocs = React.useMemo(
    () => (debouncedQuery ? searchResults : subjectResults) ?? [],
    [debouncedQuery, searchResults, subjectResults]
  );

  const coverUrls = React.useMemo(
    () => displayDocs.map((doc) => olToDisplay(doc).cover_url),
    [displayDocs]
  );

  React.useEffect(() => {
    prefetchCovers(coverUrls);
  }, [coverUrls]);

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar
          title="Browse Books"
          leftSlot={
            <Pressable
              onPress={() => router.back()}
              className="w-9 h-9 rounded-full items-center justify-center active:bg-surface-container-low"
            >
              <Icon name="arrow_back" size={22} color={Colors.onSurface} />
            </Pressable>
          }
        />

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={REFRESH_TINT} colors={REFRESH_COLORS} />
          }
        >
          {/* Search Bar */}
          <View className="mt-2">
            <View className="bg-surface-container-low px-4 py-3 rounded-xl flex-row items-center gap-3">
              <Icon name="search" size={20} color={Colors.outline} />
              <TextInput
                className="flex-1 font-label-md text-on-surface"
                placeholder="Search books by title or author..."
                placeholderTextColor={Colors.outline}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                autoFocus={false}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")} className="active:opacity-70">
                  <Icon name="close" size={18} color={Colors.outline} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Genre Chips */}
          {!debouncedQuery && (
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, marginHorizontal: -16 }}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16, alignItems: "center" }}
            >
              {GENRES.map((g) => {
                const active = activeGenre === g.label;
                return (
                  <Pressable
                    key={g.label}
                    onPress={() => setActiveGenre(g.label)}
                    className={active ? "px-5 py-2 rounded-full bg-primary" : "px-5 py-2 rounded-full bg-surface-container-low"}
                  >
                    <Text className={active ? "font-label-md text-on-primary" : "font-label-md text-on-surface-variant"}>
                      {g.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Results */}
          {debouncedQuery ? (
            searching ? (
              <BookGridSkeleton />
            ) : displayDocs.length > 0 ? (
              <View className="gap-4">
                <Text className="font-headline-lg-mobile text-on-surface">
                  Results for &ldquo;{debouncedQuery}&rdquo;
                </Text>
                <BookGrid docs={displayDocs} router={router} />
              </View>
            ) : (
              <View className="gap-2 pt-8 items-center">
                <Icon name="search_off" size={40} color={Colors.outline} />
                <Text className="font-title-lg text-on-surface">No results found</Text>
                <Text className="font-body-md text-on-surface-variant text-center">
                  Try a different title or author name.
                </Text>
              </View>
            )
          ) : subjectLoading ? (
            <BookGridSkeleton />
          ) : displayDocs.length > 0 ? (
            <View className="gap-4">
              <Text className="font-headline-lg-mobile text-on-surface">{activeGenre} Books</Text>
              <BookGrid docs={displayDocs} router={router} />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function BookGrid({ docs, router }: { docs: OLSearchResult[]; router: ReturnType<typeof useRouter> }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
      {docs.map((doc) => {
        const d = olToDisplay(doc);
        return (
          <Pressable
            key={d.key}
            style={{ width: "46%" }}
            onPress={() => {
              prefetchCovers([d.cover_url]);
              router.push(`/book-detail?open_library_id=${d.open_library_id}` as never);
            }}
            className="active:opacity-80"
          >
            <View className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-surface-variant">
              {d.cover_url ? (
                <Image
                  source={{ uri: d.cover_url }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  recyclingKey={d.cover_url}
                  transition={150}
                />
              ) : (
                <View className="flex-1 items-center justify-center p-4">
                  <Text className="text-outline font-display text-2xl text-center">{d.title[0] ?? "?"}</Text>
                </View>
              )}
            </View>
            <Text className="mt-2 font-title-lg text-on-surface" numberOfLines={2}>{d.title}</Text>
            <Text className="text-caption text-outline" numberOfLines={1}>{d.author}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function BookGridSkeleton() {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={{ width: "46%" }} className="gap-2">
          <SkeletonBlock className="w-full aspect-[2/3] rounded-xl" />
          <SkeletonBlock className="w-full h-4" />
          <SkeletonBlock className="w-2/3 h-3" />
        </View>
      ))}
    </View>
  );
}
