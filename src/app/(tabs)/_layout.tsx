import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { enableScreens, enableFreeze } from 'react-native-screens';
import { useAuthStore } from "../../stores/auth-store";
import { prefetchTabs } from "../../lib/tab-prefetch";

enableScreens(true);
enableFreeze(true);

export default function TabsLayout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth" as never);
    }
  }, [session, isLoading]);

  const userId = session?.user.id;
  useEffect(() => {
    if (userId) prefetchTabs(queryClient, userId);
  }, [userId, queryClient]);

  if (!session) return null;

  return (
    <NativeTabs
      backgroundColor="#52634c"
      iconColor={{ default: "#ffffff", selected: "#ffffff" }}
      labelStyle={{
        default: { color: "#ffffff", fontFamily: "Inter_500Medium", fontSize: 11 },
        selected: { color: "#ffffff", fontFamily: "Inter_500Medium", fontSize: 11 },
      }}
      shadowColor="rgba(255, 255, 255, 0.06)"
      indicatorColor="rgba(255, 255, 255, 0.35)"
      rippleColor="rgba(255, 255, 255, 0.15)"
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          md="auto_stories"
          sf={{ default: "book.closed", selected: "book.closed.fill" }}
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Icon
          md="explore"
          sf={{ default: "safari", selected: "safari.fill" }}
        />
        <NativeTabs.Trigger.Label>Discover</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Icon
          md="book_2"
          sf={{ default: "books.vertical", selected: "books.vertical.fill" }}
        />
        <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          md="person_2"
          sf={{ default: "person", selected: "person.fill" }}
        />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
