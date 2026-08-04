import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth-store";
import { getProfile } from "../lib/profiles";
import { supabase } from "../lib/supabase";
import TopAppBar from "../components/TopAppBar";
import ConfirmModal from "../components/ConfirmModal";
import Icon, { type IconName } from "../components/Icon";

const PREFERENCE_ROWS: { icon: IconName; label: string; value: string }[] = [
  { icon: "schedule", label: "Schedule reminders", value: "On" },
  { icon: "light_mode", label: "Theme", value: "Paper White" },
];

export default function Settings() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  });

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    queryClient.clear();
    setConfirmSignOut(false);
    router.replace("/auth" as never);
  };

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar title="Settings" onBack={() => router.back()} />

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Account */}
          <View className="flex-row items-center gap-4 bg-surface-container-low rounded-2xl p-5">
            <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center">
              <Icon name="person_2" size={26} color="#52634c" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="font-title-lg text-on-surface">{profile?.display_name ?? "Reader"}</Text>
              <Text className="font-body-md text-on-surface-variant" numberOfLines={1}>
                {session?.user.email}
              </Text>
            </View>
          </View>

          {/* Preferences */}
          <View className="gap-2">
            <Text className="font-label-md text-on-surface-variant uppercase tracking-wider px-1">Preferences</Text>
            <View className="bg-surface-container-low rounded-2xl overflow-hidden">
              {PREFERENCE_ROWS.map((row, i) => (
                <View
                  key={row.label}
                  className={`flex-row items-center justify-between px-5 py-4 ${i > 0 ? "border-t border-outline/10" : ""}`}
                >
                  <View className="flex-row items-center gap-3">
                    <Icon name={row.icon} size={20} color="#52634c" />
                    <Text className="font-body-lg text-on-surface">{row.label}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Text className="font-label-md text-on-surface-variant">{row.value}</Text>
                    <Icon name="chevron_right" size={18} color="#747870" />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* About */}
          <View className="gap-2">
            <Text className="font-label-md text-on-surface-variant uppercase tracking-wider px-1">About</Text>
            <View className="flex-row items-center justify-between px-5 py-4 bg-surface-container-low rounded-2xl">
              <View className="flex-row items-center gap-3">
                <Icon name="info" size={20} color="#52634c" />
                <Text className="font-body-lg text-on-surface">Version</Text>
              </View>
              <Text className="font-label-md text-on-surface-variant">1.0.0</Text>
            </View>
          </View>

          {/* Sign out */}
          <Pressable
            onPress={() => setConfirmSignOut(true)}
            disabled={signingOut}
            className="flex-row items-center justify-center gap-2 py-4 rounded-full bg-error/10 active:bg-error/20"
          >
            <Icon name="logout" size={20} color="#ba1a1a" />
            <Text className="font-label-lg text-error">{signingOut ? "Signing out…" : "Sign Out"}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <ConfirmModal
        visible={confirmSignOut}
        title="Sign out?"
        message="You'll need to sign in again to access your library."
        confirmLabel="Sign Out"
        icon="logout"
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={handleSignOut}
      />
    </View>
  );
}
