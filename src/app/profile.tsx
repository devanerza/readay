import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth-store";
import { usePreferencesStore } from "../stores/preferences-store";
import { getProfile } from "../lib/profiles";
import { supabase } from "../lib/supabase";
import { getScheduleBlocks } from "../lib/schedule-blocks";
import {
  ensureNotificationPermission,
  syncBlockReminders,
  cancelAllReminders,
} from "../lib/session-notifications";
import TopAppBar from "../components/TopAppBar";
import ConfirmModal from "../components/ConfirmModal";
import Icon, { type IconName } from "../components/Icon";
import { Colors } from "../constants/colors";

const PREFERENCE_ROWS: { key: string; icon: IconName; label: string; value?: string }[] = [
  { key: "reminders", icon: "schedule", label: "Schedule reminders" },
  { key: "theme", icon: "light_mode", label: "Theme", value: "Paper White" },
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

  const remindersEnabled = usePreferencesStore((s) => s.remindersEnabled);
  const setRemindersEnabled = usePreferencesStore((s) => s.setRemindersEnabled);

  const handleToggleReminders = async () => {
    const next = !remindersEnabled;
    setRemindersEnabled(next);
    try {
      if (!next) {
        await cancelAllReminders();
        return;
      }
      if (!userId) return;
      if (await ensureNotificationPermission()) {
        await syncBlockReminders(await getScheduleBlocks(userId));
      }
    } catch {}
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await cancelAllReminders();
      await supabase.auth.signOut();
    } catch {}
    queryClient.clear();
    setConfirmSignOut(false);
    router.replace("/auth" as never);
  };

  const preferenceValues: Record<string, string> = {
    reminders: remindersEnabled ? "On" : "Off",
    theme: "Paper White",
  };

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-1">
        <TopAppBar title="Profile" onBack={() => router.back()} />

        <ScrollView
          className="flex-1 px-margin-page"
          contentContainerStyle={{ paddingBottom: 120, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Account */}
          <View className="flex-row items-center gap-4 bg-surface-container-low rounded-2xl p-5">
            <View className="w-14 h-14 rounded-full bg-primary items-center justify-center">
              <Text className="font-display text-xl text-on-primary">
                {(profile?.display_name ?? "R")[0].toUpperCase()}
              </Text>
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
              {PREFERENCE_ROWS.map((row, i) => {
                const content = (
                  <>
                    <View className="flex-row items-center gap-3">
                      <Icon name={row.icon} size={20} color={Colors.primary} />
                      <Text className="font-body-lg text-on-surface">{row.label}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Text className="font-label-md text-on-surface-variant">{preferenceValues[row.key]}</Text>
                      <Icon name="chevron_right" size={18} color={Colors.outline} />
                    </View>
                  </>
                );
                const className = `flex-row items-center justify-between px-5 py-4 ${i > 0 ? "border-t border-outline/10" : ""}`;
                return row.key === "reminders" ? (
                  <Pressable key={row.key} onPress={handleToggleReminders} className={className}>
                    {content}
                  </Pressable>
                ) : (
                  <View key={row.key} className={className}>
                    {content}
                  </View>
                );
              })}
            </View>
          </View>

          {/* About */}
          <View className="gap-2">
            <Text className="font-label-md text-on-surface-variant uppercase tracking-wider px-1">About</Text>
            <View className="flex-row items-center justify-between px-5 py-4 bg-surface-container-low rounded-2xl">
              <View className="flex-row items-center gap-3">
                <Icon name="info" size={20} color={Colors.primary} />
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
            <Icon name="logout" size={20} color={Colors.error} />
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
