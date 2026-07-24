import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Image, Alert, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createReadingSession, updateSessionPages } from "../lib/reading-sessions";
import { getBook } from "../lib/books";
import { getCurrentPage, updateCurrentPage } from "../lib/queue-items";
import { useAuthStore } from "../stores/auth-store";
import Icon from "../components/Icon";
import TopAppBar from "../components/TopAppBar";
import ProgressBar from "../components/ProgressBar";
import LoadingOverlay from "../components/LoadingOverlay";

const QUICK_OPTIONS = [5, 10, 15, 20, 30, 45];

export default function ReadingSession() {
  const router = useRouter();
  const { book_id } = useLocalSearchParams<{ book_id?: string }>();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<"duration" | "reading" | "page-input">("duration");
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [customMin, setCustomMin] = useState("20");
  const [pageInput, setPageInput] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedRef = useRef(false);
  const endSessionRef = useRef<() => void>(() => {});

  const { data: book, isLoading } = useQuery({
    queryKey: ["session-book", book_id],
    queryFn: () => getBook(book_id!),
    enabled: !!book_id && book_id !== 'unknown',
  });

  const { data: currentPage = 0 } = useQuery({
    queryKey: ["current-page", book_id, userId],
    queryFn: () => getCurrentPage(book_id!, userId!),
    enabled: !!book_id && !!userId && book_id !== 'unknown',
  });

  const elapsedSeconds = totalSeconds - seconds;

  const startSession = (minutes: number) => {
    const total = minutes * 60;
    setTotalSeconds(total);
    setSeconds(total);
    setIsPaused(false);
    setPhase("reading");
    endedRef.current = false;
  };

  useEffect(() => {
    if (phase !== "reading") return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (isPaused || s <= 0) return s;
        const next = s - 1;
        if (next <= 0 && !endedRef.current) {
          endedRef.current = true;
          endSessionRef.current();
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, isPaused]);

  const handleEndSession = async () => {
    if (!userId) return;
    if (elapsedSeconds < 10) { router.back(); return; }

    setSaving(true);
    try {
      const id = await createReadingSession({
        user_id: userId,
        book_id: book_id ?? 'unknown',
        duration_seconds: elapsedSeconds,
        pages_read: 0,
        date: new Date().toISOString(),
      });
      setSavedSessionId(id);
      setPageInput(currentPage > 0 ? String(currentPage) : "");
      setPhase("page-input");
    } catch {
      Alert.alert("Error", "Could not save session.");
    } finally {
      setSaving(false);
    }
  };

  endSessionRef.current = handleEndSession;

  const handleSavePage = async () => {
    const page = parseInt(pageInput, 10);
    if (isNaN(page) || page <= 0) { router.back(); return; }
    if (!savedSessionId || !book_id || !userId) { router.back(); return; }

    try {
      const pagesRead = page - currentPage;
      await updateSessionPages(savedSessionId, Math.max(pagesRead, 0));
      await updateCurrentPage(book_id, userId, page);
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
  const progressPct = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;

  if (phase === "page-input") {
    return (
      <View className="flex-1 bg-surface">
        <SafeAreaView edges={["top"]} className="flex-1">
          <TopAppBar onBack={() => router.back()} />
          <View className="flex-1 items-center justify-center px-margin-page gap-8">
            <View className="items-center gap-3">
              <View className="p-4 bg-primary/10 rounded-3xl">
                <Icon name="auto_stories" size={36} color="#52634c" />
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
        </SafeAreaView>
      </View>
    );
  }

  if (phase === "duration") {
    return (
      <View className="flex-1 bg-surface">
        <SafeAreaView edges={["top"]} className="flex-1">
          <TopAppBar onBack={() => router.back()} />
          <View className="flex-1 items-center justify-center px-margin-page gap-8">
            <View className="items-center gap-3">
              <View className="p-4 bg-primary/10 rounded-3xl">
                <Icon name="timer" size={36} color="#52634c" />
              </View>
              <Text className="font-display text-headline-md text-on-surface text-center">
                How long will{'\n'}you read?
              </Text>
            </View>

            <View className="flex-row flex-wrap justify-center gap-3">
              {QUICK_OPTIONS.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => startSession(m)}
                  className="px-6 py-3.5 rounded-full bg-primary-container/20 active:bg-primary-container/40"
                >
                  <Text className="font-label-lg text-primary">{m} min</Text>
                </Pressable>
              ))}
            </View>

            <View className="items-center gap-4">
              <Text className="font-body-md text-on-surface-variant">or set custom</Text>
              <View className="flex-row items-center gap-3">
                <View className="bg-surface-container-low rounded-xl px-4 py-2.5 w-20">
                  <TextInput
                    className="font-display text-headline-md text-on-surface text-center"
                    value={customMin}
                    onChangeText={(v) => setCustomMin(v.replace(/\D/g, "").slice(0, 3))}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
                <Text className="font-body-lg text-on-surface-variant">min</Text>
              </View>
              <Pressable
                onPress={() => {
                  const m = parseInt(customMin, 10);
                  if (m > 0) startSession(m);
                }}
                className="px-10 py-3.5 rounded-full bg-primary active:opacity-90"
              >
                <Text className="text-on-primary font-label-lg">Start Reading</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (isLoading) return <LoadingOverlay />;

  return (
    <View className="flex-1 bg-surface" style={isPaused ? { opacity: 0.8 } : undefined}>
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar onBack={() => router.back()} />

        <View className="flex-1 items-center justify-center px-margin-page">
          <View className="mb-6 w-40 aspect-[2/3] rounded-lg overflow-hidden bg-surface-variant">
            {book?.cover_url ? (
              <Image source={{ uri: book.cover_url }} className="w-full h-full" resizeMode="cover" />
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

          <View className="items-center gap-2 mb-10">
            <View className="flex-row items-center gap-3">
              <Icon name="timer" size={22} color="#52634c" filled />
              <Text className="font-display text-headline-lg-mobile text-primary tracking-widest">{timeLabel}</Text>
            </View>
            <Text className="font-label-md text-on-surface-variant uppercase tracking-tighter">remaining</Text>
            <View className="w-48 mt-2">
              <ProgressBar progress={progressPct} />
            </View>
          </View>

          <View className="flex-row items-center gap-8">
            <Pressable
              onPress={() => setIsPaused((p) => !p)}
              className="w-14 h-14 items-center justify-center rounded-full bg-surface-container border border-outline-variant active:scale-90"
            >
              <Icon name={isPaused ? "play_arrow" : "pause"} color="#52634c" filled={isPaused} />
            </Pressable>
            <Pressable
              onPress={handleEndSession}
              disabled={saving}
              className="px-8 py-3 rounded-full bg-primary flex-row items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Icon name="stop_circle" size={16} color="#ffffff" />
              <Text className="text-on-primary font-label-md">{saving ? "Saving…" : "End Session"}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
