import React, { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { getProfile } from "../lib/profiles";
import Icon from "../components/Icon";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      getProfile(user.id)
        .then((profile) => {
          router.replace(profile?.display_name ? "/home" : ("/onboarding" as never));
        })
        .catch(() => router.replace("/onboarding" as never));
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 px-margin-page justify-center"
        >
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-full bg-primary-container/20 items-center justify-center mb-6">
              <Icon name="auto_stories" size={32} color="#52634c" />
            </View>
            <Text className="font-display text-headline-lg-mobile text-on-surface text-center">
              Welcome back
            </Text>
            <Text className="font-body-md text-on-surface-variant text-center mt-3">
              Sign in with your email and password
            </Text>
          </View>

          <View className="bg-surface-container-low rounded-xl px-4 py-3 mb-3">
            <TextInput
              className="font-body-md text-on-surface"
              placeholder="you@example.com"
              placeholderTextColor="#747870"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
          </View>

          <View className="bg-surface-container-low rounded-xl px-4 py-3 mb-4">
            <TextInput
              className="font-body-md text-on-surface"
              placeholder="Password"
              placeholderTextColor="#747870"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {error ? (
            <Text className="font-label-md text-error mb-4 text-center">{error}</Text>
          ) : null}

          <Pressable
            onPress={handleSignIn}
            disabled={loading || !email.trim() || !password}
            className="w-full py-4 bg-primary rounded-full items-center active:scale-95 disabled:opacity-50"
          >
            <Text className="text-on-primary font-label-md">
              {loading ? "Signing in…" : "Sign In"}
            </Text>
          </Pressable>

          <View className="flex-row justify-center mt-6">
            <Text className="font-body-md text-on-surface-variant">
              Don't have an account?{" "}
            </Text>
            <Pressable onPress={() => router.push("/auth" as never)}>
              <Text className="font-label-md text-primary">Create one</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
