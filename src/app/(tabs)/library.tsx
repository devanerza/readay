import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/auth-store";
import { getQueueItems, updateQueueItemStatus, deleteQueueItem } from "../../lib/queue-items";
import { getProfile } from "../../lib/profiles";
import { toCoverThumbUrl } from "../../lib/open-library";
import { prefetchCovers } from "../../lib/cover-prefetch";
import { usePullRefresh, REFRESH_TINT, REFRESH_COLORS } from "../../lib/use-pull-refresh";
import { useToast } from "../../lib/use-toast";
import TopAppBar from "../../components/TopAppBar";
import TabSwitcher from "../../components/TabSwitcher";
import EmptyState from "../../components/EmptyState";
import { LibrarySkeleton } from "../../components/SkeletonScreens";
import ConfirmModal from "../../components/ConfirmModal";
import ProgressBar from "../../components/ProgressBar";
import Toast from "../../components/Toast";
import { Colors } from "../../constants/colors";

const TABS = [
  { key: "all", label: "All" },
  { key: "want_to_read", label: "Want to Read" },
  { key: "reading", label: "Reading" },
  { key: "finished", label: "Finished" },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function Library() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [removeTarget, setRemoveTarget] = useState<{ id: string; title: string } | null>(null);
  const toast = useToast();

  const { data: items, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["queue-items", userId, activeTab],
    queryFn: () => getQueueItems(userId!, activeTab === "all" ? undefined : activeTab),
    enabled: !!userId,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  });

  const { refreshing: isRefreshing, onRefresh } = usePullRefresh([refetch], isRefetching);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'reading' | 'finished' | 'want_to_read' }) =>
      updateQueueItemStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["queue-items", userId] });
      queryClient.invalidateQueries({ queryKey: ["all-reading", userId] });
      if (variables.status === 'reading') {
        const item = filteredItems.find((i) => i.id === variables.id);
        if (item) router.push(`/reading-session?book_id=${item.book_id}`);
      }
    },
    onError: () => toast.show("Could not update book status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQueueItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-items", userId] });
      queryClient.invalidateQueries({ queryKey: ["all-reading", userId] });
    },
    onError: () => toast.show("Could not remove book."),
  });

  const filteredItems = items ?? [];

  const getNextStatus = (current: string): { status: 'reading' | 'finished' | 'want_to_read'; label: string } | null => {
    if (current === "want_to_read") return { status: "reading", label: "Start Reading" };
    if (current === "reading") return { status: "finished", label: "Mark Finished" };
    if (current === "finished") return { status: "want_to_read", label: "Move to Want to Read" };
    return null;
  };

  if (isLoading) return <LibrarySkeleton />;

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar
          title="Library"
          rightSlot={
            <Pressable onPress={() => router.push("/profile" as never)} className="w-9 h-9 rounded-full bg-primary items-center justify-center active:opacity-80">
              <Text className="font-display text-sm text-on-primary">
                {(profile?.display_name ?? "R")[0].toUpperCase()}
              </Text>
            </Pressable>
          }
        />

        <TabSwitcher
          tabs={TABS.map(t => ({ key: t.key, label: t.label }))}
          activeKey={activeTab}
          onSelect={(key) => setActiveTab(key as TabKey)}
        />

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={REFRESH_TINT} colors={REFRESH_COLORS} />
          }
        >
          {filteredItems.length > 0 ? filteredItems.map((item) => {
            const next = getNextStatus(item.status);
            return (
              <View
                key={item.id}
                className="bg-primary rounded-2xl overflow-hidden border border-surface-variant/20"
              >
                <View className="flex-row p-4 gap-4">
                  {/* Book Cover */}
                  <Pressable
                    onPress={() => { prefetchCovers([item.books?.cover_url]); router.push(`/book-detail?book_id=${item.book_id}`); }}
                    className="w-24 shrink-0"
                  >
                    <View className="aspect-[2/3] rounded-lg overflow-hidden bg-surface-variant">
                      {item.books?.cover_url ? (
                        <Image source={{ uri: toCoverThumbUrl(item.books.cover_url) }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Text className="text-surface-variant font-display text-headline-md">
                            {item.books?.title?.[0] ?? "?"}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>

                  {/* Info + Actions */}
                  <View className="flex-1 gap-1 justify-between">
                    <View>
                      <Text className="font-title-lg text-surface" numberOfLines={2}>
                        {item.books?.title ?? "Unknown"}
                      </Text>
                      <Text className="text-caption text-surface-variant italic">
                        {item.books?.author ?? ""}
                      </Text>
                      {item.reason_text ? (
                        <Text className="text-caption text-surface mt-1" numberOfLines={2}>
                          {item.reason_text}
                        </Text>
                      ) : null}
                      {item.status === "reading" && item.books?.page_count ? (
                        <View className="mt-1">
                          <ProgressBar
                            progress={item.books.page_count > 0 ? (item.current_page / item.books.page_count) * 100 : 0}
                          />
                        </View>
                      ) : null}
                      {item.status === "finished" ? (
                        <View className="mt-1">
                          <Text className="text-caption text-primary font-label-md">✓ Finished</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Actions */}
                    <View className="flex-row gap-2 mt-2">
                      {item.status === "reading" ? (
                        <Pressable
                          onPress={() => router.push(`/reading-session?book_id=${item.book_id}`)}
                          className="flex-1 py-2 bg-surface rounded-full active:opacity-80 items-center"
                        >
                          <Text className="text-primary font-label-md text-xs">Resume</Text>
                        </Pressable>
                      ) : next ? (
                        <Pressable
                          onPress={() => statusMutation.mutate({ id: item.id, status: next.status })}
                          className="flex-1 py-2 bg-surface rounded-full active:opacity-80 items-center"
                        >
                          <Text className="text-primary font-label-md text-xs">{next.label}</Text>
                        </Pressable>
                      ) : null}
                      <Pressable
                        onPress={() => setRemoveTarget({ id: item.id, title: item.books?.title ?? "this book" })}
                        className="flex-1 py-2 bg-red-100 rounded-full active:opacity-80 items-center"
                      >
                        <Text className="text-error font-label-md text-xs">Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            );
          }) : (
            <EmptyState
              icon={activeTab === "all" ? "auto_stories" : activeTab === "want_to_read" ? "auto_stories" : activeTab === "reading" ? "auto_awesome_motion" : "check"}
              title={activeTab === "all" ? "Your library is empty" : activeTab === "want_to_read" ? "Your queue is empty" : activeTab === "reading" ? "Not reading anything yet" : "No finished books yet"}
              subtitle={activeTab === "all" ? "Add books to your library to get started." : activeTab === "want_to_read" ? "Discover books to add to your reading list." : activeTab === "reading" ? "Pick a book from your queue and start reading." : "Finished books will appear here. Keep reading!"}
              cta="Discover Books"
              onCta={() => router.push("/discover" as never)}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      <ConfirmModal
        visible={!!removeTarget}
        title="Remove Book"
        message={`Remove "${removeTarget?.title ?? "this book"}" from your library? This won't delete your reading history.`}
        confirmLabel="Remove"
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) deleteMutation.mutate(removeTarget.id);
          setRemoveTarget(null);
        }}
      />

      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </View>
  );
}
