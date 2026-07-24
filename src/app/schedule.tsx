import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, Image, Modal, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/auth-store";
import { getScheduleBlocks, createScheduleBlock, updateScheduleBlock, deleteScheduleBlock, type ScheduleBlockWithBook } from "../lib/schedule-blocks";
import { getQueueItems, type QueueItemWithBook } from "../lib/queue-items";
import Icon from "../components/Icon";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type FormState = {
  day_of_week: number;
  start_hour: string;
  start_minute: string;
  duration_minutes: string;
  label: string;
  book_id: string | null;
};

const emptyForm: FormState = {
  day_of_week: new Date().getDay(),
  start_hour: "19",
  start_minute: "00",
  duration_minutes: "20",
  label: "Reading Session",
  book_id: null,
};

function formatTime(h: string, m: string) {
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

function parseDuration(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

export default function Schedule() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [showBookPicker, setShowBookPicker] = useState(false);

  const { data: blocks, isLoading } = useQuery({
    queryKey: ["schedule-blocks", userId],
    queryFn: () => getScheduleBlocks(userId!),
    enabled: !!userId,
  });

  const { data: queueItems = [] } = useQuery({
    queryKey: ["queue-all", userId],
    queryFn: () => getQueueItems(userId!),
    enabled: !!userId && showBookPicker,
  });

  const selectedBook = queueItems.find((q) => q.book_id === form.book_id)?.books ?? null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        await updateScheduleBlock(editingId, {
          day_of_week: form.day_of_week,
          start_time: formatTime(form.start_hour, form.start_minute),
          duration_minutes: parseInt(form.duration_minutes, 10),
          label: form.label,
          book_id: form.book_id,
        });
      } else {
        await createScheduleBlock({
          user_id: userId!,
          day_of_week: form.day_of_week,
          start_time: formatTime(form.start_hour, form.start_minute),
          duration_minutes: parseInt(form.duration_minutes, 10),
          label: form.label,
          book_id: form.book_id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-blocks", userId] });
      resetForm();
    },
    onError: (e) => Alert.alert("Error", `Could not save schedule block: ${e instanceof Error ? e.message : String(e)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteScheduleBlock(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule-blocks", userId] }),
    onError: (e) => Alert.alert("Error", `Could not delete schedule block: ${e instanceof Error ? e.message : String(e)}`),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setShowBookPicker(false);
  };

  const editBlock = (block: ScheduleBlockWithBook) => {
    setForm({
      day_of_week: block.day_of_week,
      start_hour: block.start_time.slice(0, 2),
      start_minute: block.start_time.slice(3, 5),
      duration_minutes: String(parseDuration(block.start_time, block.end_time)),
      label: block.label,
      book_id: block.book_id,
    });
    setEditingId(block.id);
    setShowForm(true);
  };

  const today = new Date().getDay();
  const todayBlocks = blocks?.filter((b) => b.day_of_week === today) ?? [];
  const allBlocks = blocks?.slice().sort((a, b) => a.day_of_week - b.day_of_week) ?? [];

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="small" color="#52634c" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="w-full flex-row justify-between items-center px-margin-page py-4">
          <View className="flex-row items-center gap-4">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2 active:bg-surface-container rounded-full">
              <Icon name="arrow_back" color="#52634c" />
            </Pressable>
            <Text className="font-display text-headline-md text-primary ml-2">Schedule</Text>
          </View>
          <Pressable
            onPress={() => { resetForm(); setShowForm(true); }}
            className="w-10 h-10 bg-primary rounded-full items-center justify-center active:scale-90"
          >
            <Icon name="add" size={20} color="#ffffff" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Today's Blocks */}
          <View className="gap-4 mt-2">
            <Text className="font-display text-title-lg text-on-surface">Today</Text>
            {todayBlocks.length > 0 ? todayBlocks.map((block) => (
              <BlockCard key={block.id} block={block} onEdit={() => editBlock(block)} onDelete={() => {
                Alert.alert("Delete Block", `Remove "${block.label}"?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(block.id) },
                ]);
              }} />
            )) : (
              <View className="bg-surface-container-low rounded-2xl p-6 items-center gap-3">
                <Icon name="schedule" size={32} color="#747870" />
                <Text className="font-body-md text-on-surface-variant text-center">No reading blocks scheduled for today.</Text>
                <Pressable onPress={() => { resetForm(); setShowForm(true); }} className="mt-2">
                  <Text className="text-primary font-label-md">Add a block</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* All Blocks */}
          <View className="gap-4">
            <View className="flex-row justify-between items-center">
              <Text className="font-display text-title-lg text-on-surface">All Blocks</Text>
              <Pressable onPress={() => { resetForm(); setShowForm(true); }}>
                <Text className="text-primary font-label-md">+ Add</Text>
              </Pressable>
            </View>
            {allBlocks.length > 0 ? (
              <View className="gap-3">
                {allBlocks.map((block) => (
                  <BlockCard key={block.id} block={block} onEdit={() => editBlock(block)} onDelete={() => {
                    Alert.alert("Delete Block", `Remove "${block.label}"?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(block.id) },
                    ]);
                  }} />
                ))}
              </View>
            ) : (
              <View className="bg-surface-container-low rounded-2xl p-6 items-center gap-3">
                <Icon name="schedule" size={32} color="#747870" />
                <Text className="font-body-md text-on-surface-variant text-center">No reading blocks set.</Text>
                <Pressable onPress={() => { resetForm(); setShowForm(true); }} className="mt-2">
                  <Text className="text-primary font-label-md">Add your first block</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Add/Edit Form */}
          {showForm && (
            <View className="bg-surface-container-low rounded-2xl p-6 gap-6">
              <View className="flex-row justify-between items-center">
                <Text className="font-title-lg text-on-surface">{editingId ? "Edit Block" : "New Block"}</Text>
                <Pressable onPress={resetForm} className="p-1">
                  <Icon name="close" size={20} color="#444841" />
                </Pressable>
              </View>

              {/* Label */}
              <View className="gap-2">
                <Text className="font-label-md text-on-surface-variant">Label</Text>
                <View className="bg-surface rounded-xl px-4 py-3">
                  <TextInput
                    className="font-body-md text-on-surface"
                    value={form.label}
                    onChangeText={(v) => setForm((f) => ({ ...f, label: v }))}
                    placeholder="Evening Reading"
                    placeholderTextColor="#747870"
                  />
                </View>
              </View>

              {/* Book (optional) */}
              <View className="gap-2">
                <Text className="font-label-md text-on-surface-variant">Book (optional)</Text>
                {selectedBook ? (
                  <View className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3">
                    <View className="w-10 h-14 rounded overflow-hidden bg-surface-variant">
                      {selectedBook.cover_url ? (
                        <Image source={{ uri: selectedBook.cover_url }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Text className="text-outline text-xs">{selectedBook.title?.[0] ?? "?"}</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-label-md text-on-surface" numberOfLines={1}>{selectedBook.title}</Text>
                      {selectedBook.author ? (
                        <Text className="text-caption text-on-surface-variant" numberOfLines={1}>{selectedBook.author}</Text>
                      ) : null}
                    </View>
                    <Pressable onPress={() => setForm((f) => ({ ...f, book_id: null }))} className="p-1">
                      <Icon name="close" size={16} color="#747870" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setShowBookPicker(true)}
                    className="bg-surface rounded-xl px-4 py-3.5 flex-row items-center gap-3 active:bg-surface-variant"
                  >
                    <Icon name="book_2" size={20} color="#747870" />
                    <Text className="font-body-md text-on-surface-variant">Pick a book from your queue</Text>
                  </Pressable>
                )}
              </View>

              {/* Day */}
              <View className="gap-2">
                <Text className="font-label-md text-on-surface-variant">Day</Text>
                <View className="flex-row flex-wrap gap-2">
                  {DAY_NAMES.map((name, i) => (
                    <Pressable
                      key={name}
                      onPress={() => setForm((f) => ({ ...f, day_of_week: i }))}
                      className={`px-4 py-2 rounded-full ${form.day_of_week === i ? "bg-primary" : "bg-surface-variant"}`}
                    >
                      <Text className={`font-label-md ${form.day_of_week === i ? "text-on-primary" : "text-on-surface-variant"}`}>
                        {name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Start Time */}
              <View className="gap-2">
                <Text className="font-label-md text-on-surface-variant">Start Time</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-surface rounded-xl px-4 py-3">
                    <TextInput
                      className="font-body-md text-on-surface"
                      value={form.start_hour}
                      onChangeText={(v) => setForm((f) => ({ ...f, start_hour: v.replace(/\D/g, "").slice(0, 2) }))}
                      placeholder="19"
                      placeholderTextColor="#747870"
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <Text className="font-body-md text-on-surface-variant self-center">:</Text>
                  <View className="flex-1 bg-surface rounded-xl px-4 py-3">
                    <TextInput
                      className="font-body-md text-on-surface"
                      value={form.start_minute}
                      onChangeText={(v) => setForm((f) => ({ ...f, start_minute: v.replace(/\D/g, "").slice(0, 2) }))}
                      placeholder="00"
                      placeholderTextColor="#747870"
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                </View>
              </View>

              {/* Duration */}
              <View className="gap-2">
                <Text className="font-label-md text-on-surface-variant">Duration (minutes)</Text>
                <View className="bg-surface rounded-xl px-4 py-3">
                  <TextInput
                    className="font-body-md text-on-surface"
                    value={form.duration_minutes}
                    onChangeText={(v) => setForm((f) => ({ ...f, duration_minutes: v.replace(/\D/g, "").slice(0, 3) }))}
                    placeholder="20"
                    placeholderTextColor="#747870"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Pressable
                onPress={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="w-full py-4 bg-primary rounded-full items-center active:scale-95 disabled:opacity-50"
              >
                <Text className="text-on-primary font-label-md">
                  {saveMutation.isPending ? "Saving…" : editingId ? "Save Changes" : "Add Block"}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Book Picker Modal */}
        <Modal visible={showBookPicker} animationType="slide" transparent>
          <View className="flex-1 bg-black/40">
            <View className="flex-1 mt-24 bg-surface rounded-t-3xl">
              <View className="flex-row justify-between items-center px-6 py-4 border-b border-surface-variant/30">
                <Text className="font-display text-title-lg text-on-surface">Pick a Book</Text>
                <Pressable onPress={() => setShowBookPicker(false)} className="p-1">
                  <Icon name="close" size={20} color="#444841" />
                </Pressable>
              </View>
              <FlatList
                data={queueItems.filter((q) => q.books)}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, gap: 8 }}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setForm((f) => ({ ...f, book_id: item.book_id }));
                      setShowBookPicker(false);
                    }}
                    className="flex-row items-center gap-3 p-3 rounded-xl active:bg-surface-variant"
                  >
                    <View className="w-12 h-16 rounded overflow-hidden bg-surface-variant">
                      {item.books?.cover_url ? (
                        <Image source={{ uri: item.books.cover_url }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Text className="text-outline text-xs">{item.books?.title?.[0] ?? "?"}</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-label-md text-on-surface" numberOfLines={1}>{item.books?.title ?? "Unknown"}</Text>
                      {item.books?.author ? (
                        <Text className="text-caption text-on-surface-variant">{item.books.author}</Text>
                      ) : null}
                      <Text className="text-caption text-primary mt-0.5 capitalize">{item.status.replace(/_/g, " ")}</Text>
                    </View>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <View className="items-center py-12 gap-3">
                    <Icon name="book_2" size={32} color="#747870" />
                    <Text className="font-body-md text-on-surface-variant text-center">No books in your queue yet.{'\n'}Add books from Discover first.</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

function BlockCard({ block, onEdit, onDelete }: { block: ScheduleBlockWithBook; onEdit: () => void; onDelete: () => void }) {
  const [sh, sm] = block.start_time.split(":").map(Number);
  const [eh, em] = block.end_time.split(":").map(Number);
  const duration = (eh * 60 + em) - (sh * 60 + sm);
  const hour = new Date().getHours();
  const isUpcoming = sh > hour || (sh === hour && sm > new Date().getMinutes());

  return (
    <View className="bg-surface-container-low rounded-2xl p-5 flex-row items-center gap-4 border border-surface-variant/20">
      {block.books?.cover_url ? (
        <View className="w-12 h-16 rounded-lg overflow-hidden bg-surface-variant shrink-0">
          <Image source={{ uri: block.books.cover_url }} className="w-full h-full" resizeMode="cover" />
        </View>
      ) : (
        <View className={`w-12 h-12 rounded-xl items-center justify-center shrink-0 ${isUpcoming ? "bg-primary/10" : "bg-surface-variant"}`}>
          <Icon name="schedule" size={24} color={isUpcoming ? "#52634c" : "#747870"} />
        </View>
      )}
      <View className="flex-1 gap-0.5">
        <Text className="font-title-lg text-on-surface">{block.label}</Text>
        {block.books ? (
          <Text className="text-caption text-primary" numberOfLines={1}>{block.books.title}</Text>
        ) : null}
        <Text className="text-caption text-on-surface-variant">
          {FULL_DAYS[block.day_of_week]} • {block.start_time.slice(0, 5)} – {block.end_time.slice(0, 5)} • {duration} min
        </Text>
      </View>
      <View className="flex-row gap-2">
        <Pressable onPress={onEdit} className="p-2 active:bg-surface-variant rounded-full">
          <Icon name="edit" size={18} color="#444841" />
        </Pressable>
        <Pressable onPress={onDelete} className="p-2 active:bg-surface-variant rounded-full">
          <Icon name="delete" size={18} color="#ba1a1a" />
        </Pressable>
      </View>
    </View>
  );
}
