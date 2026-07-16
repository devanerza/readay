import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/auth-store";
import { getScheduleBlocks, createScheduleBlock, updateScheduleBlock, deleteScheduleBlock } from "../lib/schedule-blocks";
import Icon from "../components/Icon";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type FormState = {
  day_of_week: number;
  start_hour: string;
  start_minute: string;
  duration_minutes: string;
  label: string;
};

const emptyForm: FormState = {
  day_of_week: new Date().getDay(),
  start_hour: "19",
  start_minute: "00",
  duration_minutes: "20",
  label: "Reading Session",
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

  const { data: blocks, isLoading } = useQuery({
    queryKey: ["schedule-blocks", userId],
    queryFn: () => getScheduleBlocks(userId!),
    enabled: !!userId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        await updateScheduleBlock(editingId, {
          day_of_week: form.day_of_week,
          start_time: formatTime(form.start_hour, form.start_minute),
          duration_minutes: parseInt(form.duration_minutes, 10),
          label: form.label,
        });
      } else {
        await createScheduleBlock({
          user_id: userId!,
          day_of_week: form.day_of_week,
          start_time: formatTime(form.start_hour, form.start_minute),
          duration_minutes: parseInt(form.duration_minutes, 10),
          label: form.label,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-blocks", userId] });
      resetForm();
    },
    onError: () => Alert.alert("Error", "Could not save schedule block."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteScheduleBlock(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule-blocks", userId] }),
    onError: () => Alert.alert("Error", "Could not delete schedule block."),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const editBlock = (block: any) => {
    setForm({
      day_of_week: block.day_of_week,
      start_hour: block.start_time.slice(0, 2),
      start_minute: block.start_time.slice(3, 5),
      duration_minutes: String(parseDuration(block.start_time, block.end_time)),
      label: block.label,
    });
    setEditingId(block.id);
    setShowForm(true);
  };

  const today = new Date().getDay();
  const todayBlocks = blocks?.filter((b) => b.day_of_week === today) ?? [];
  const weekBlocks = blocks ?? [];

  const blocksByDay = DAY_NAMES.map((_, i) => ({
    day: i,
    dayName: DAY_NAMES[i],
    fullDay: FULL_DAYS[i],
    blocks: weekBlocks.filter((b) => b.day_of_week === i),
  }));

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

          {/* Weekly Calendar */}
          <View className="gap-4">
            <Text className="font-display text-title-lg text-on-surface">Weekly Calendar</Text>
            <View className="gap-3">
              {blocksByDay.map(({ day, dayName, fullDay, blocks: dayBlocks }) => (
                <View key={day} className={`rounded-2xl p-4 ${day === today ? "bg-primary-container/10 border border-primary-container/20" : "bg-surface-container-low"}`}>
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className={`font-label-md ${day === today ? "text-primary" : "text-on-surface-variant"}`}>
                      {fullDay}{day === today ? " • Today" : ""}
                    </Text>
                    <Text className="text-caption text-outline">{dayBlocks.length} block{dayBlocks.length !== 1 ? "s" : ""}</Text>
                  </View>
                  {dayBlocks.length > 0 ? dayBlocks.map((block) => (
                    <View key={block.id} className="flex-row justify-between items-center py-2 border-t border-surface-variant/30">
                      <View className="flex-1">
                        <Text className="font-title-lg text-on-surface">{block.label}</Text>
                        <Text className="text-caption text-on-surface-variant">
                          {block.start_time.slice(0, 5)} – {block.end_time.slice(0, 5)} ({parseDuration(block.start_time, block.end_time)} min)
                        </Text>
                      </View>
                      <Pressable onPress={() => editBlock(block)} className="p-2 active:bg-surface-variant rounded-full">
                        <Icon name="edit" size={18} color="#444841" />
                      </Pressable>
                    </View>
                  )) : (
                    <View className="py-2 border-t border-surface-variant/30">
                      <Pressable onPress={() => { resetForm(); setForm((f) => ({ ...f, day_of_week: day })); setShowForm(true); }}>
                        <Text className="text-primary font-label-md text-sm">+ Add block</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
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
      </SafeAreaView>
    </View>
  );
}

function BlockCard({ block, onEdit, onDelete }: { block: any; onEdit: () => void; onDelete: () => void }) {
  const [sh, sm] = block.start_time.split(":").map(Number);
  const [eh, em] = block.end_time.split(":").map(Number);
  const duration = (eh * 60 + em) - (sh * 60 + sm);
  const hour = new Date().getHours();
  const isUpcoming = sh > hour || (sh === hour && sm > new Date().getMinutes());

  return (
    <View className="bg-surface-container-low rounded-2xl p-5 flex-row items-center gap-4 border border-surface-variant/20">
      <View className={`w-12 h-12 rounded-xl items-center justify-center ${isUpcoming ? "bg-primary/10" : "bg-surface-variant"}`}>
        <Icon name="schedule" size={24} color={isUpcoming ? "#52634c" : "#747870"} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-title-lg text-on-surface">{block.label}</Text>
        <Text className="text-caption text-on-surface-variant">
          {block.start_time.slice(0, 5)} – {block.end_time.slice(0, 5)} • {duration} min
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
