import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { TabView, Route } from "react-native-tab-view";
import { LinearGradient } from "expo-linear-gradient";
import { useQueryClient } from "@tanstack/react-query";
import Icon from "../../components/Icon";
import { useAuthStore } from "../../stores/auth-store";
import { prefetchTabs } from "../../lib/tab-prefetch";
import { getScheduleBlocks } from "../../lib/schedule-blocks";
import { usePreferencesStore } from "../../stores/preferences-store";
import { hasNotificationPermission, syncBlockReminders, stopSessionTimer } from "../../lib/session-notifications";
import { Colors } from "../../constants/colors";

import Home from "./home";
import Discover from "./discover";
import Library from "./library";
import Journey from "./journey";

const TABS: { key: string; label: string; icon: any }[] = [
  { key: "home", label: "Home", icon: "auto_stories" },
  { key: "discover", label: "Discover", icon: "explore" },
  { key: "library", label: "Library", icon: "book_2" },
  { key: "journey", label: "Journey", icon: "wb_twilight" },
];

const renderScene = ({ route }: { route: Route }) => {
  switch (route.key) {
    case "home":
      return <Home />;
    case "discover":
      return <Discover />;
    case "library":
      return <Library />;
    case "journey":
      return <Journey />;
    default:
      return null;
  }
};

export default function TabsLayout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const routes = TABS.map((t) => ({ key: t.key, title: t.label }));

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth" as never);
    }
  }, [session, isLoading]);

  const userId = session?.user.id;
  const remindersEnabled = usePreferencesStore((s) => s.remindersEnabled);

  useEffect(() => {
    if (userId) prefetchTabs(queryClient, userId);
  }, [userId, queryClient]);

  useEffect(() => {
    if (!userId) return;
    stopSessionTimer();
    if (!remindersEnabled) return;
    (async () => {
      try {
        if (await hasNotificationPermission()) {
          await syncBlockReminders(await getScheduleBlocks(userId));
        }
      } catch {}
    })();
  }, [userId, remindersEnabled]);

  const handleIndexChange = useCallback((newIndex: number) => {
    setIndex(newIndex);
  }, []);

  if (!session) return null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        renderTabBar={() => null}
        initialLayout={{ width: layout.width, height: layout.height }}
        lazy
        style={{ flex: 1 }}
      />
      {/* Tab Bar */}
      <View pointerEvents="box-none" style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(251,249,245,0)", Colors.surface]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 96 }}
        />
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 24,
            height: 64,
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            paddingHorizontal: 12,
            backgroundColor: Colors.primary,
            borderRadius: 999,
            shadowColor: Colors.shadowMedium,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 16,
          }}
        >
          {TABS.map((tab) => {
            const isFocused = index === TABS.findIndex((t) => t.key === tab.key);

            const onPress = () => {
              handleIndexChange(TABS.findIndex((t) => t.key === tab.key));
            };

            return (
              <Pressable
                key={tab.key}
                onPress={onPress}
                style={{
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isFocused ? "rgba(255,255,255,0.15)" : "transparent",
                  borderRadius: 999,
                  paddingHorizontal: 20,
                  paddingVertical: 6,
                }}
              >
                <Icon name={tab.icon} size={18} color={isFocused ? Colors.onPrimary : "rgba(255,255,255,0.72)"} filled={isFocused} />
                <View style={{ marginTop: 4 }}>
                  <Text style={{
                    fontFamily: "Inter-Bold",
                    fontSize: 14,
                    color: isFocused ? "white" : "rgba(255,255,255,0.70)",
                  }}>
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
