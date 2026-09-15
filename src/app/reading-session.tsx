import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Alert, TextInput, Modal } from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createReadingSession, updateSessionPages } from "../lib/reading-sessions";
import { getBook } from "../lib/books";
import { getCurrentPage, updateCurrentPage, getQueueItemForBook, updateQueueItemStatus } from "../lib/queue-items";
import { startSessionTimer, stopSessionTimer, pauseSessionTimer, resumeSessionTimer } from "../lib/session-notifications";
import { useAuthStore } from "../stores/auth-store";
import Icon from "../components/Icon";
import TopAppBar from "../components/TopAppBar";
import ProgressBar from "../components/ProgressBar";
import { SessionSkeleton } from "../components/SkeletonScreens";
import { Colors } from "../constants/colors";

export default function ReadingSession() {
  const router = useRouter();
  const { book_id, target_minutes: targetParam } = useLocalSearchParams<{ book_id?: string; target_minutes?: string }>();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const targetMinutes = targetParam ? parseInt(targetParam, 10) : null;
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showPageInput, setShowPageInput] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState("");
  const accumulatedMsRef = useRef(0);
  const runningSinceRef = useRef<number | null>(null);
  const timerStartedRef = useRef(false);

  const elapsedSec = () =>
    Math.floor((accumulatedMsRef.current + (runningSinceRef.current ? Date.now() - runningSinceRef.current : 0)) / 1000);

  const { data: book, isLoading } = useQuery({
    queryKey: ["session-book", book_id],
    queryFn: () => getBook(book_id!),
    enabled: !!book_id,
  });

  const { data: currentPage = 0 } = useQuery({
    queryKey: ["current-page", book_id, userId],
    queryFn: () => getCurrentPage(book_id!, userId!),
    enabled: !!book_id && !!userId,
  });

  const elapsedSeconds = seconds;
  const targetSeconds = targetMinutes ? targetMinutes * 60 : null;
  const targetReached = !!targetSeconds && elapsedSeconds >= targetSeconds;

  useEffect(() => {
    const id = setInterval(() => {
      if (!isPaused) setSeconds(elapsedSec());
    }, 500);
    return () => clearInterval(id);
  }, [isPaused]);

  const togglePause = () => {
    if (isPaused) {
      runningSinceRef.current = Date.now();
      setIsPaused(false);
      resumeSessionTimer(elapsedSec());
    } else {
      accumulatedMsRef.current += runningSinceRef.current ? Date.now() - runningSinceRef.current : 0;
      runningSinceRef.current = null;
      setIsPaused(true);
      pauseSessionTimer(elapsedSec());
    }
  };

  useEffect(() => {
    if (!isLoading && !timerStartedRef.current) {
      timerStartedRef.current = true;
      startSessionTimer(book?.title ?? null);
    }
  }, [isLoading, book]);

  useEffect(() => {
    runningSinceRef.current = Date.now();
    return () => {
      stopSessionTimer();
    };
  }, []);

  const handleEndSession = async () => {
    if (!userId) return;
    const duration = elapsedSec();
    if (duration < 10) {
      Alert.alert("Session too short", "Sessions under 10 seconds won't be saved.", [
        { text: "Cancel", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]);
      return;
    }

    setSaving(true);
    try {
      const id = await createReadingSession({
        user_id: userId,
        book_id: book_id ?? null,
        duration_seconds: duration,
        target_minutes: targetMinutes ?? undefined,
        pages_read: 0,
        date: new Date().toISOString(),
      });
      setSavedSessionId(id);
      setShowSummary(true);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : String(e));
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const handleSummaryDone = () => {
    setShowSummary(false);
    if (!book_id) {
      queryClient.invalidateQueries({ queryKey: ["reading-stats", userId] });
      router.back();
      return;
    }
    setPageInput(currentPage > 0 ? String(currentPage) : "");
    setShowPageInput(true);
  };

  const handleSavePage = async () => {
    const page = parseInt(pageInput, 10);
    if (isNaN(page) || page <= 0) { router.back(); return; }
    if (!savedSessionId || !book_id || !userId) { router.back(); return; }

    try {
      const pagesRead = page - currentPage;
      await updateSessionPages(savedSessionId, Math.max(pagesRead, 0));
      await updateCurrentPage(book_id, userId, page);

      if (book?.page_count && page >= book.page_count) {
        const queueItem = await getQueueItemForBook(book_id, userId);
        if (queueItem && queueItem.status === 'reading') {
          await updateQueueItemStatus(queueItem.id, 'finished');
          queryClient.invalidateQueries({ queryKey: ["queue-items", userId] });
          queryClient.invalidateQueries({ queryKey: ["all-reading", userId] });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["current-page", book_id, userId] });
      queryClient.invalidateQueries({ queryKey: ["reading-stats", userId] });
      router.back();
    } catch {
      Alert.alert("Error", "Could not save page.");
    }
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeLabel = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  const progressPct = targetSeconds ? Math.min((elapsedSeconds / targetSeconds) * 100, 100) : null;

  const summaryDiff = targetMinutes ? elapsedSeconds / 60 - targetMinutes : 0;
  let summaryResult: string;
  if (!targetMinutes) {
    summaryResult = `Read for ${mins} min`;
  } else if (summaryDiff >= 1) {
    summaryResult = `Exceeded by ${Math.round(summaryDiff)} min`;
  } else if (summaryDiff >= -1) {
    summaryResult = "Met your target";
  } else {
    summaryResult = `Fell short by ${Math.round(Math.abs(summaryDiff))} min`;
  }

  if (isLoading) return <SessionSkeleton />;

  return (
    <View className="flex-1 bg-surface" style={isPaused ? { opacity: 0.8 } : undefined}>
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar onBack={() => router.back()} />

        <View className="flex-1 items-center justify-center px-margin-page">
          <View className="mb-6 w-40 aspect-[2/3] rounded-lg overflow-hidden bg-surface-variant">
            {book?.cover_url ? (
              <Image source={{ uri: book.cover_url }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-outline font-display text-headline-xl">{book?.title?.[0] ?? "?"}</Text>
              </View>
            )}
          </View>

          <Text className="font-title-lg text-on-surface text-center mb-1">{book?.title ?? "Reading"}</Text>
          {book?.author ? (
            <Text className="font-body-md text-on-surface-variant italic mb-8">{book.author}</Text>
          ) : null}

          {/* Target badge */}
          {targetMinutes ? (
            <View className="flex-row items-center gap-2 mb-2">
              <View className={`px-3 py-1 rounded-full ${targetReached ? "bg-primary/20" : "bg-surface-variant"}`}>
                <Text className={`font-label-md text-xs ${targetReached ? "text-primary" : "text-on-surface-variant"}`}>
                  {targetReached ? "Target reached!" : `Target: ${targetMinutes} min`}
                </Text>
              </View>
            </View>
          ) : null}

          <View className="items-center gap-2 mb-10">
            <View className="flex-row items-center gap-3">
              <Icon name="timer" size={22} color={Colors.primary} filled />
              <Text className="font-display text-headline-lg-mobile text-primary tracking-widest">{timeLabel}</Text>
            </View>
            <Text className="font-label-md text-on-surface-variant uppercase tracking-tighter">elapsed</Text>
            {progressPct !== null ? (
              <View className="w-48 mt-2">
                <ProgressBar progress={progressPct} />
              </View>
            ) : null}
          </View>

          <View className="flex-row items-center gap-8">
            <Pressable
              onPress={togglePause}
              className="w-14 h-14 items-center justify-center rounded-full bg-surface-container border border-outline-variant active:scale-90"
            >
              <Icon name={isPaused ? "play_arrow" : "pause"} color={Colors.primary} filled={isPaused} />
            </Pressable>
            <Pressable
              onPress={handleEndSession}
              disabled={saving}
              className="px-8 py-3 rounded-full bg-primary flex-row items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Icon name="stop_circle" size={16} color={Colors.onPrimary} />
              <Text className="text-on-primary font-label-md">{saving ? "Saving…" : "End Session"}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Summary Modal */}
      <Modal visible={showSummary} animationType="slide" transparent>
        <View className="flex-1 bg-black/40">
          <View className="flex-1 justify-end">
            <View className="bg-surface rounded-t-3xl p-8 pb-12 gap-8">
              <View className="items-center gap-4">
                <View className="p-4 bg-primary/10 rounded-3xl">
                  <Icon name="check_circle" size={36} color={Colors.primary} filled />
                </View>
                <Text className="font-display text-headline-md text-on-surface text-center">Session Complete</Text>
              </View>

              <View className="bg-surface-container-low rounded-2xl p-5 gap-3">
                <View className="flex-row justify-between items-center">
                  <Text className="font-body-md text-on-surface-variant">Time read</Text>
                  <Text className="font-title-lg text-on-surface">{mins} min {secs} sec</Text>
                </View>
                {targetMinutes ? (
                  <>
                    <View className="h-px bg-surface-variant" />
                    <View className="flex-row justify-between items-center">
                      <Text className="font-body-md text-on-surface-variant">Target</Text>
                      <Text className="font-title-lg text-on-surface">{targetMinutes} min</Text>
                    </View>
                    <View className="h-px bg-surface-variant" />
                    <View className="flex-row justify-between items-center">
                      <Text className="font-body-md text-on-surface-variant">Result</Text>
                      <Text className={`font-title-lg ${summaryDiff >= 0 ? "text-primary" : "text-secondary"}`}>
                        {summaryResult}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>

              <Pressable
                onPress={handleSummaryDone}
                className="w-full py-4 bg-primary rounded-full items-center active:opacity-90"
              >
                <Text className="text-on-primary font-label-lg">Continue</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Page Input Modal */}
      <Modal visible={showPageInput} animationType="slide" transparent>
        <View className="flex-1 bg-black/40">
          <View className="flex-1 justify-end">
            <View className="bg-surface rounded-t-3xl p-8 pb-12 gap-8">
              <View className="items-center gap-3">
                <View className="p-4 bg-primary/10 rounded-3xl">
                  <Icon name="auto_stories" size={36} color={Colors.primary} />
                </View>
                <Text className="font-display text-headline-md text-on-surface text-center">
                  What page did you{'\n'}reach?
                </Text>
                {book ? (
                  <Text className="font-body-md text-on-surface-variant">{book.title}</Text>
                ) : null}
              </View>

              <View className="items-center gap-6">
                <View className="flex-row items-center gap-3">
                  <View className="bg-surface-container-low rounded-xl px-5 py-3 w-28">
                    <TextInput
                      className="font-display text-headline-lg-mobile text-on-surface text-center"
                      value={pageInput}
                      onChangeText={(v) => setPageInput(v.replace(/\D/g, "").slice(0, 5))}
                      keyboardType="number-pad"
                      maxLength={5}
                      autoFocus
                      selectTextOnFocus
                    />
                  </View>
                  <Text className="font-body-lg text-on-surface-variant">of {book?.page_count ?? "—"} pages</Text>
                </View>

                <View className="flex-row gap-4">
                  <Pressable
                    onPress={() => router.back()}
                    className="px-6 py-3.5 rounded-full bg-surface-variant active:opacity-80"
                  >
                    <Text className="font-label-lg text-on-surface-variant">Skip</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSavePage}
                    className="px-8 py-3.5 rounded-full bg-primary active:opacity-90"
                  >
                    <Text className="text-on-primary font-label-lg">Save</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
