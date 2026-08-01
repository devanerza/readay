import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, Image, Pressable, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/auth-store";
import { getProfile } from "../../lib/profiles";
import { searchBooks, getBooksBySubject, buildCoverUrl, extractOpenLibraryId, type OLSearchResult } from "../../lib/open-library";
import TopAppBar from "../../components/TopAppBar";
import Icon from "../../components/Icon";
import { SkeletonBlock } from "../../components/Skeleton";

const GENRES = [
  { label: "All Curated" },
  { label: "Mystery" },
  { label: "Sci-Fi" },
  { label: "Memoirs" },
  { label: "Classics" },
  { label: "Poetry" },
];

const SUBJECT_MAP: Record<string, string> = {
  "All Curated": "fiction",
  "Mystery": "mystery",
  "Sci-Fi": "science_fiction",
  "Memoirs": "biography",
  "Classics": "classic",
  "Poetry": "poetry",
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

export default function Discover() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All Curated");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  });

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["ol-search", debouncedQuery],
    queryFn: () => searchBooks(debouncedQuery, 20),
    enabled: debouncedQuery.length >= 2,
  });

  const { data: subjectResults, isLoading: subjectLoading } = useQuery({
    queryKey: ["ol-subject", activeGenre],
    queryFn: () => getBooksBySubject(SUBJECT_MAP[activeGenre] ?? "fiction", 20),
    enabled: !debouncedQuery,
  });

  const genreEntries = React.useMemo(() => {
    if (!profile?.genre_weights) return [];
    const weights = profile.genre_weights as Record<string, number>;
    return Object.entries(weights).sort(([, a], [, b]) => b - a).slice(0, 3);
  }, [profile]);

  const topGenre = genreEntries[0]?.[0] ?? "fiction";

  const { data: favoriteResults, isLoading: favoriteLoading } = useQuery({
    queryKey: ["ol-favorites", topGenre],
    queryFn: () => getBooksBySubject(topGenre, 20),
    enabled: !debouncedQuery && !!topGenre,
  });

  const displayDocs = (debouncedQuery ? searchResults : subjectResults) ?? [];
  const perfectDocs = subjectResults?.slice(0, 2) ?? [];
  const favoriteDocs = favoriteResults?.slice(0, 4) ?? [];

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar rightActions={[{ icon: "settings", color: "#444841" }]} />

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar */}
          <View className="mt-2">
            <View className="bg-surface-container-low px-4 py-3 rounded-xl flex-row items-center gap-3">
              <Icon name="search" size={20} color="#747870" />
              <TextInput
                className="flex-1 font-label-md text-on-surface"
                placeholder="Search curated titles..."
                placeholderTextColor="#747870"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
              />
            </View>
          </View>

          {/* Genre Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {GENRES.map((g) => {
              const active = activeGenre === g.label;
              return (
                <Pressable
                  key={g.label}
                  onPress={() => setActiveGenre(g.label)}
                  className={active ? "px-6 py-2 rounded-full bg-primary" : "px-6 py-2 rounded-full bg-surface-variant"}
                >
                  <Text className={active ? "font-label-md text-on-primary" : "font-label-md text-on-surface-variant"}>
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {searching && debouncedQuery ? (
            <View className="gap-y-6 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <View key={i} className="w-full gap-2">
                  <SkeletonBlock className="w-full aspect-[3/4] rounded-lg" />
                  <SkeletonBlock className="w-full h-4" />
                  <SkeletonBlock className="w-2/3 h-3" />
                </View>
              ))}
            </View>
          ) : displayDocs.length === 0 && !debouncedQuery ? (
            <>
              {/* Perfect for Tonight */}
              {subjectLoading && (
                <View className="gap-4">
                  <SkeletonBlock className="w-48 h-7" />
                  <View className="gap-4">
                    {[1, 2].map((i) => (
                      <SkeletonBlock key={i} className="w-full h-56 rounded-2xl" />
                    ))}
                  </View>
                </View>
              )}
              {!subjectLoading && perfectDocs.length > 0 && (
                <View className="gap-4">
                  <Text className="font-headline-lg-mobile text-on-surface">Perfect for Tonight</Text>
                  <View className="gap-4">
                    {perfectDocs.map((doc, i) => {
                      const d = olToDisplay(doc);
                      return (
                        <FeatureCard
                          key={d.key}
                          coverUrl={d.cover_url}
                          title={d.title}
                          author={d.author ? `by ${d.author}` : ""}
                          onPress={() => router.push(`/book-detail?open_library_id=${d.open_library_id}`)}
                        />
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Based on Your Favorites */}
              {favoriteLoading && (
                <View className="gap-4">
                  <SkeletonBlock className="w-52 h-7" />
                  <View className="gap-y-6">
                    {[1, 2, 3, 4].map((i) => (
                      <View key={i} className="w-full gap-2">
                        <SkeletonBlock className="w-full aspect-[3/4] rounded-lg" />
                        <SkeletonBlock className="w-full h-4" />
                        <SkeletonBlock className="w-2/3 h-3" />
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {!favoriteLoading && favoriteDocs.length > 0 && (
                <View className="gap-4">
                  <Text className="font-headline-lg-mobile text-on-surface">Based on Your Favorites</Text>
                  <View className="gap-y-6">
                    {favoriteDocs.map((doc) => {
                      const d = olToDisplay(doc);
                      return (
                        <Pressable
                          key={d.key}
                          className="w-full h-full"
                          onPress={() => router.push(`/book-detail?open_library_id=${d.open_library_id}`)}
                        >
                          <View className="aspect-[3/4] w-full h-full rounded-lg overflow-hidden bg-surface-variant">
                            {d.cover_url ? (
                              <Image source={{ uri: d.cover_url }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                              <View className="flex-1 items-center justify-center">
                                <Text className="text-outline font-display text-headline-md">{d.title[0] ?? "?"}</Text>
                              </View>
                            )}
                          </View>
                          <Text className="mt-2 font-title-lg text-on-surface" numberOfLines={1}>{d.title}</Text>
                          <Text className="text-caption text-outline">{d.author}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              {displayDocs.length > 0 && (
                <View className="gap-4">
                  <Text className="font-headline-lg-mobile text-on-surface">
                    {debouncedQuery ? `Results for "${debouncedQuery}"` : `${activeGenre} Books`}
                  </Text>
                  <View className="gap-y-6">
                    {displayDocs.map((doc) => {
                      const d = olToDisplay(doc);
                      return (
                        <Pressable
                          key={d.key}
                          className="w-full"
                          onPress={() => router.push(`/book-detail?open_library_id=${d.open_library_id}`)}
                        >
                          <View className="aspect-[2/3] w-full h-100 rounded-lg overflow-hidden bg-surface-variant">
                            {d.cover_url ? (
                              <Image source={{ uri: d.cover_url }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                              <View className="flex-1 items-center justify-center">
                                <Text className="text-outline font-display text-headline-md">{d.title[0] ?? "?"}</Text>
                              </View>
                            )}
                          </View>
                          <Text className="mt-2 font-title-lg text-on-surface" numberOfLines={1}>{d.title}</Text>
                          <Text className="text-caption text-outline">{d.author}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FeatureCard({
  coverUrl,
  title,
  author,
  onPress,
}: {
  coverUrl: string | null;
  title: string;
  author: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="rounded-2xl overflow-hidden bg-surface-container-low active:opacity-80">
      <ImageBackground
        source={{ uri: coverUrl ?? "" }}
        className="h-[240px] justify-end"
        resizeMode="cover"
        style={coverUrl ? {} : { backgroundColor: "#e0e3db" }}
      >
        <View className="p-6" style={{ backgroundColor: coverUrl ? "rgba(0,0,0,0.4)" : "transparent" }}>
          <Text className="font-display text-headline-lg text-white mb-1">{title}</Text>
          {author ? <Text className="font-body-md text-white/90 italic">{author}</Text> : null}
        </View>
      </ImageBackground>
      <View className="p-6">
        <Pressable onPress={onPress} className="py-3 bg-primary rounded-full flex-row items-center justify-center gap-2 active:scale-95">
          <Icon name="auto_stories" size={16} color="#ffffff" />
          <Text className="text-on-primary font-label-md">Start Journey</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
