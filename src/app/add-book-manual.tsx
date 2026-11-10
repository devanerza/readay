import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth-store";
import { addBookToLibrary } from "../lib/queue-items";
import TopAppBar from "../components/TopAppBar";
import Icon from "../components/Icon";
import { Colors } from "../constants/colors";

interface BookForm {
  title: string;
  author: string;
  total_pages: string;
  genre: string;
  description: string;
  cover_url: string;
}

const INITIAL_FORM: BookForm = {
  title: "",
  author: "",
  total_pages: "",
  genre: "",
  description: "",
  cover_url: "",
};

export default function AddBookManual() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;

  const [form, setForm] = useState<BookForm>(INITIAL_FORM);

  const updateField = (field: keyof BookForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const { mutate: submitBook, isPending } = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not authenticated");
      if (!form.title.trim()) throw new Error("Title is required");

      return addBookToLibrary(userId, {
        title: form.title.trim(),
        author: form.author.trim() || undefined,
        total_pages: form.total_pages ? parseInt(form.total_pages, 10) : undefined,
        genre: form.genre.trim() || undefined,
        description: form.description.trim() || undefined,
        cover_url: form.cover_url.trim() || undefined,
        status: "want_to_read",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-items", userId] });
      queryClient.invalidateQueries({ queryKey: ["all-reading", userId] });
      router.back();
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message || "Failed to add book. Please try again.");
    },
  });

  const isValid = form.title.trim().length > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar
          title="Add Your Own Book"
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
          keyboardShouldPersistTaps="handled"
        >
          <View className="mt-2 gap-2">
            <Text className="font-body-md text-on-surface-variant">
              Fill in the details of the book you want to add to your library.
            </Text>
          </View>

          {/* Required fields */}
          <View className="gap-4">
            <FormField
              label="Title *"
              placeholder="e.g. The Midnight Library"
              value={form.title}
              onChangeText={updateField("title")}
              autoFocus
            />
            <FormField
              label="Author"
              placeholder="e.g. Matt Haig"
              value={form.author}
              onChangeText={updateField("author")}
            />
          </View>

          {/* Optional fields */}
          <View className="gap-1">
            <Text className="font-label-lg text-on-surface-variant uppercase tracking-wider text-xs">
              Optional Details
            </Text>
            <View className="gap-4 mt-2">
              <FormField
                label="Total Pages"
                placeholder="e.g. 288"
                value={form.total_pages}
                onChangeText={updateField("total_pages")}
                keyboardType="numeric"
              />
              <FormField
                label="Genre"
                placeholder="e.g. Fiction, Self-Help, Mystery"
                value={form.genre}
                onChangeText={updateField("genre")}
              />
              <FormField
                label="Cover Image URL"
                placeholder="https://..."
                value={form.cover_url}
                onChangeText={updateField("cover_url")}
                keyboardType="url"
                autoCapitalize="none"
              />
              <FormField
                label="Description"
                placeholder="A short summary or your personal notes..."
                value={form.description}
                onChangeText={updateField("description")}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </ScrollView>

        {/* Submit button — pinned bottom */}
        <View
          className="px-margin-page pb-8 pt-4 bg-surface"
          style={{
            shadowColor: Colors.shadowMedium,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Pressable
            onPress={() => submitBook()}
            disabled={!isValid || isPending}
            className={`rounded-2xl py-4 items-center justify-center flex-row gap-2 ${
              isValid && !isPending ? "bg-primary active:opacity-90" : "bg-surface-container-low"
            }`}
          >
            {isPending ? (
              <ActivityIndicator color={Colors.onPrimary} size="small" />
            ) : (
              <>
                <Icon
                  name="add"
                  size={20}
                  color={isValid ? Colors.onPrimary : Colors.outline}
                />
                <Text
                  className={`font-label-lg text-base ${
                    isValid ? "text-on-primary" : "text-outline"
                  }`}
                >
                  Add to Library
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
  numberOfLines = 1,
  autoFocus = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "numeric" | "url" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words";
  multiline?: boolean;
  numberOfLines?: number;
  autoFocus?: boolean;
}) {
  return (
    <View className="gap-1.5">
      <Text className="font-label-lg text-on-surface">{label}</Text>
      <TextInput
        className="bg-surface-container-low rounded-xl px-4 font-body-md text-on-surface"
        style={{
          paddingVertical: 14,
          minHeight: multiline ? numberOfLines * 44 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
        placeholder={placeholder}
        placeholderTextColor={Colors.outline}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        autoFocus={autoFocus}
      />
    </View>
  );
}
