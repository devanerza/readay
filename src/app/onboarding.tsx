import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { supabase } from "../lib/supabase";
import Icon from "../components/Icon";
import { Colors } from "../constants/colors";

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

const STEPS = [
  { key: "displayName", title: "Your Name", subtitle: "How should we call you?" },
  { key: "favoriteGenres", title: "Favorite Genres", subtitle: "Pick the genres you love." },
  { key: "yearlyGoal", title: "Reading Goal", subtitle: "How many books a year do you want to read?" },
] as const;

const getStepValid = (step: number, data: FormData) => {
  if (step === 0) return data.displayName.trim().length > 0;
  if (step === 1) return data.favoriteGenres.length > 0;
  if (step === 2) return data.yearlyGoal.trim().length > 0 && parseInt(data.yearlyGoal, 10) > 0;
  return false;
};

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: { displayName: "", favoriteGenres: [], yearlyGoal: "12" },
  });

  const data = watch();
  const selectedGenres = data.favoriteGenres;
  const isLastStep = step === STEPS.length - 1;
  const canProceed = getStepValid(step, data);

  const toggleGenre = (genre: string) => {
    const current = selectedGenres;
    if (current.includes(genre)) {
      setValue("favoriteGenres", current.filter((g) => g !== genre));
    } else {
      setValue("favoriteGenres", [...current, genre]);
    }
  };

  const onSubmit = async (formData: FormData) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const genre_weights: Record<string, number> = {};
      formData.favoriteGenres.forEach((g) => { genre_weights[g.toLowerCase()] = 0.8; });

      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        display_name: formData.displayName.trim(),
        genre_weights,
        yearly_goal: parseInt(formData.yearlyGoal, 10),
      }, { onConflict: 'user_id' });

      if (error) {
        setSubmitError(error.message);
        return;
      }
      router.replace("/home");
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (!canProceed) return;
    if (isLastStep) {
      handleSubmit(onSubmit)();
    } else {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    setSubmitError("");
    if (step > 0) setStep((s) => s - 1);
  };

  const current = STEPS[step];

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="flex-row items-center px-margin-page pt-4">
          {step > 0 ? (
            <Pressable
              onPress={goBack}
              hitSlop={12}
              className="w-10 h-10 rounded-full bg-surface-variant items-center justify-center"
            >
              <Icon name="arrow_back" size={20} color="Colors.onSurfaceVariant" />
            </Pressable>
          ) : (
            <View className="w-10 h-10" />
          )}
          <View className="flex-1 flex-row justify-center gap-2">
            {STEPS.map((s, i) => (
              <View
                key={s.key}
                className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-surface-variant"}`}
                style={{ width: 24 }}
              />
            ))}
          </View>
          <View className="w-10 h-10" />
        </View>

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 60, gap: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mt-8 gap-2">
            <Text className="font-display text-headline-lg-mobile text-on-surface">
              {current.title}
            </Text>
            <Text className="font-body-md text-on-surface-variant">
              {current.subtitle}
            </Text>
          </View>

          {step === 0 && (
            <View className="gap-4">
              <Controller
                control={control}
                name="displayName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="bg-surface-container-low rounded-xl px-4 py-3">
                    <TextInput
                      className="font-body-md text-on-surface"
                      placeholder="e.g. Alex"
                      placeholderTextColor="Colors.outline"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoComplete="name"
                    />
                  </View>
                )}
              />
            </View>
          )}

          {step === 1 && (
            <View className="gap-4">
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
          )}

          {step === 2 && (
            <View className="gap-4">
              <Controller
                control={control}
                name="yearlyGoal"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="bg-surface-container-low rounded-xl px-4 py-3">
                    <TextInput
                      className="font-body-md text-on-surface"
                      placeholder="Books per year"
                      placeholderTextColor="Colors.outline"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                    />
                  </View>
                )}
              />
            </View>
          )}

          {submitError ? (
            <Text className="font-label-md text-error text-center">{submitError}</Text>
          ) : null}
        </ScrollView>

        <View className="px-margin-page pb-8 pt-4 gap-3">
          {step > 0 ? (
            <Pressable
              onPress={goBack}
              className="w-full py-3 bg-surface-variant rounded-full items-center active:scale-95"
            >
              <Text className="text-on-surface-variant font-label-md">Back</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={goNext}
            disabled={!canProceed || submitting}
            className="w-full py-4 bg-primary rounded-full items-center active:scale-95 disabled:opacity-50"
          >
            <Text className="text-on-primary font-label-md">
              {submitting ? "Saving…" : isLastStep ? "Start Reading" : "Next"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
