import React, { useState } from "react";
import { View, Text, ScrollView, Image, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/auth-store";
import { getQueueItems, updateQueueItemStatus, deleteQueueItem } from "../../lib/queue-items";
import TopAppBar from "../../components/TopAppBar";
import TabSwitcher from "../../components/TabSwitcher";
import EmptyState from "../../components/EmptyState";
import LoadingOverlay from "../../components/LoadingOverlay";
import Icon from "../../components/Icon";

const TABS = [
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
  const [activeTab, setActiveTab] = useState<TabKey>("want_to_read");

  const { data: items, isLoading } = useQuery({
    queryKey: ["queue-items", userId, activeTab],
    queryFn: () => getQueueItems(userId!, activeTab === "want_to_read" ? undefined : activeTab),
    enabled: !!userId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'reading' | 'finished' | 'want_to_read' }) =>
      updateQueueItemStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["queue-items", userId] });
      queryClient.invalidateQueries({ queryKey: ["queue-count", userId] });
      queryClient.invalidateQueries({ queryKey: ["finished-books", userId] });
      queryClient.invalidateQueries({ queryKey: ["currently-reading", userId] });
      queryClient.invalidateQueries({ queryKey: ["next-read", userId] });
      if (variables.status === 'reading') {
        const item = filteredItems.find((i) => i.id === variables.id);
        if (item) router.push(`/reading-session?book_id=${item.book_id}`);
      }
    },
    onError: () => Alert.alert("Error", "Could not update book status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQueueItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-items", userId] });
      queryClient.invalidateQueries({ queryKey: ["queue-count", userId] });
    },
    onError: () => Alert.alert("Error", "Could not remove book."),
  });

  const filteredItems = items ?? [];

  const getNextStatus = (current: string): { status: 'reading' | 'finished' | 'want_to_read'; label: string } | null => {
    if (current === "want_to_read") return { status: "reading", label: "Start Reading" };
    if (current === "reading") return { status: "finished", label: "Mark Finished" };
    if (current === "finished") return { status: "want_to_read", label: "Move to Want to Read" };
    return null;
  };

  if (isLoading) return <LoadingOverlay />;

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar
          title="Library"
          rightActions={[{ icon: "settings", color: "#444841" }]}
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
        >
          {filteredItems.length > 0 ? filteredItems.map((item) => {
            const next = getNextStatus(item.status);
            return (
              <View
                key={item.id}
                className="bg-surface-container-low rounded-2xl overflow-hidden border border-surface-variant/20"
              >
                <View className="flex-row p-4 gap-4">
                  {/* Book Cover */}
                  <Pressable
                    onPress={() => router.push(`/book-detail?book_id=${item.book_id}`)}
                    className="w-20 shrink-0"
                  >
                    <View className="aspect-[2/3] rounded-lg overflow-hidden bg-surface-variant">
                      {item.books?.cover_url ? (
                        <Image source={{ uri: item.books.cover_url }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Text className="text-outline font-display text-headline-md">
                            {item.books?.title?.[0] ?? "?"}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>

                  {/* Info */}
                  <View className="flex-1 gap-1 justify-center">
                    <Text className="font-title-lg text-on-surface" numberOfLines={2}>
                      {item.books?.title ?? "Unknown"}
                    </Text>
                    <Text className="text-caption text-on-surface-variant italic">
                      {item.books?.author ?? ""}
                    </Text>
                    {item.reason_text ? (
                      <Text className="text-caption text-outline mt-1" numberOfLines={2}>
                        {item.reason_text}
                      </Text>
                    ) : null}
                    {item.status === "reading" && item.books?.page_count ? (
                      <View className="flex-row items-center gap-2 mt-1">
                        <View className="h-1 flex-1 bg-surface-variant rounded-full overflow-hidden">
                          <View className="h-full bg-primary rounded-full" style={{ width: "0%" }} />
                        </View>
                      </View>
                    ) : null}
                    {item.status === "finished" ? (
                      <View className="mt-1">
                        <Text className="text-caption text-primary font-label-md">✓ Finished</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row border-t border-surface-variant/20">
                  {item.status === "reading" ? (
                    <Pressable
                      onPress={() => router.push(`/reading-session?book_id=${item.book_id}`)}
                      className="flex-1 py-3 items-center active:bg-surface-variant"
                    >
                      <Text className="font-label-md text-primary text-sm">Resume</Text>
                    </Pressable>
                  ) : next ? (
                    <Pressable
                      onPress={() => statusMutation.mutate({ id: item.id, status: next.status })}
                      className="flex-1 py-3 items-center active:bg-surface-variant"
                    >
                      <Text className="font-label-md text-primary text-sm">{next.label}</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => {
                      Alert.alert("Remove Book", `Remove "${item.books?.title ?? "this book"}" from your library?`, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Remove", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
                      ]);
                    }}
                    className={`flex-1 py-3 items-center active:bg-surface-variant ${next || item.status === "reading" ? "border-l border-surface-variant/20" : ""}`}
                  >
                    <Text className="font-label-md text-error text-sm">Remove</Text>
                  </Pressable>
                </View>
              </View>
            );
          }) : (
            <EmptyState
              icon={activeTab === "want_to_read" ? "auto_stories" : activeTab === "reading" ? "auto_awesome_motion" : "check"}
              title={activeTab === "want_to_read" ? "Your queue is empty" : activeTab === "reading" ? "Not reading anything yet" : "No finished books yet"}
              subtitle={activeTab === "want_to_read" ? "Discover books to add to your reading list." : activeTab === "reading" ? "Pick a book from your queue and start reading." : "Finished books will appear here. Keep reading!"}
              cta={activeTab === "reading" ? "Go to Want to Read" : "Discover Books"}
              onCta={activeTab === "reading" ? () => setActiveTab("want_to_read") : () => router.push("/discover" as never)}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
