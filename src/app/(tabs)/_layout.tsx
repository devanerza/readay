import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { enableScreens, enableFreeze } from "react-native-screens";
import Icon from "../../components/Icon";
import { useAuthStore } from "../../stores/auth-store";
import { prefetchTabs } from "../../lib/tab-prefetch";

enableScreens(true);
enableFreeze(true);

const TABS: { name: string; label: string; icon: any }[] = [
  { name: "home", label: "Home", icon: "auto_stories" },
  { name: "discover", label: "Discover", icon: "explore" },
  { name: "library", label: "Library", icon: "book_2" },
  { name: "profile", label: "Profile", icon: "person_2" },
];

function CustomTabBar({ state, navigation }: any) {
  return (
    <View
      className="absolute bottom-0 left-0 w-full h-20 flex-row justify-around items-center px-3 pb-6 pt-3 bg-primary rounded-t-xl"
      style={{
        shadowColor: "#2d2d2d",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 12,
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.jumpTo(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            className={
              focused
                ? "flex-col items-center justify-center bg-white/15 rounded-full px-5 py-1.5"
                : "flex-col items-center justify-center px-5 py-1.5 active:bg-white/15 active:rounded-full"
            }
          >
            <Icon name={tab.icon} size={18} color={focused ? "#ffffff" : "rgba(255,255,255,0.72)"} filled={focused} />
            <View className="mt-1">
              <TabLabel label={tab.label} focused={focused} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text className={`font-display text-sm ${focused ? "text-white" : "text-white/70"}`}>
      {label}
    </Text>
  );
}

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
    <Tabs
      screenOptions={{ headerShown: false, lazy: true }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
