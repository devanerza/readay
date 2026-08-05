import React from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { supabase } from "../lib/supabase";
import Icon from "../components/Icon";

const GENRES = [
  "Mystery", "Thriller", "Fantasy", "Sci-Fi", "Horror", "Romance",
  "Historical Fiction", "Literary Fiction", "Contemporary", "Classic Lit",
  "Poetry", "Drama", "Short Stories", "Young Adult", "Adventure", "Graphic Novel",
  "Biography", "Memoir", "History", "Philosophy", "Psychology", "Self-Help",
  "True Crime", "Business", "Science", "Politics", "Travel", "Food & Cooking",
];

type FormData = {
  displayName: string;
  favoriteGenres: string[];
  yearlyGoal: string;
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: { displayName: "", favoriteGenres: [], yearlyGoal: "12" },
  });

  const selectedGenres = watch("favoriteGenres");

  const toggleGenre = (genre: string) => {
    const current = selectedGenres;
    if (current.includes(genre)) {
      setValue("favoriteGenres", current.filter((g) => g !== genre));
    } else {
      setValue("favoriteGenres", [...current, genre]);
    }
  };

  const onSubmit = async (data: FormData) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const genre_weights: Record<string, number> = {};
    data.favoriteGenres.forEach((g) => { genre_weights[g.toLowerCase()] = 0.8; });

    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      display_name: data.displayName.trim(),
      genre_weights,
      yearly_goal: parseInt(data.yearlyGoal, 10),
    }, { onConflict: 'user_id' });

    if (!error) router.replace("/home");
  };

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 60, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-4 gap-2">
            <Text className="font-display text-headline-lg-mobile text-on-surface">
              Welcome to ReadFlow
            </Text>
            <Text className="font-body-md text-on-surface-variant">
              Let's get to know you as a reader.
            </Text>
          </View>

          <View className="gap-4">
            <Text className="font-title-lg text-on-surface">Your Name</Text>
            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="bg-surface-container-low rounded-xl px-4 py-3">
                  <TextInput
                    className="font-body-md text-on-surface"
                    placeholder="How should we call you?"
                    placeholderTextColor="#747870"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoComplete="name"
                  />
                </View>
              )}
            />
          </View>

          <View className="gap-4">
            <Text className="font-title-lg text-on-surface">Favorite Genres</Text>
            <View className="flex-row flex-wrap gap-2">
              {GENRES.map((genre) => {
                const active = selectedGenres.includes(genre);
                return (
                  <Pressable
                    key={genre}
                    onPress={() => toggleGenre(genre)}
                    className={`px-4 py-2 rounded-full ${active ? "bg-primary" : "bg-surface-variant"}`}
                  >
                    <Text className={`font-label-md ${active ? "text-on-primary" : "text-on-surface-variant"}`}>
                      {genre}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-4">
            <Text className="font-title-lg text-on-surface">Reading Goal</Text>
            <Controller
              control={control}
              name="yearlyGoal"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="bg-surface-container-low rounded-xl px-4 py-3">
                  <TextInput
                    className="font-body-md text-on-surface"
                    placeholder="Books per year"
                    placeholderTextColor="#747870"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                  />
                </View>
              )}
            />
          </View>

          <Pressable
            onPress={handleSubmit(onSubmit)}
            className="w-full py-4 bg-primary rounded-full items-center active:scale-95"
          >
            <Text className="text-on-primary font-label-md">Start Reading</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
