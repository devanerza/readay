import React from "react";
import { View, Pressable } from "react-native";
import { Tabs, useRouter, usePathname } from "expo-router";
import Icon from "../../components/Icon";

const TABS: { name: string; label: string; icon: any }[] = [
  { name: "home", label: "Home", icon: "auto_stories" },
  { name: "discover", label: "Discover", icon: "explore" },
  { name: "library", label: "Library", icon: "book_2" },
  { name: "journey", label: "Journey", icon: "auto_awesome_motion" },
  { name: "profile", label: "Profile", icon: "person_2" },
];

function CustomTabBar({ state, navigation }: any) {
  return (
    <View
      className="absolute bottom-0 left-0 w-full flex-row justify-around items-center px-4 pb-6 pt-3 bg-surface/90 rounded-t-xl"
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

        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            className={
              focused
                ? "flex-col items-center justify-center bg-primary-container/20 rounded-full px-5 py-1.5"
                : "flex-col items-center justify-center px-2 py-1.5"
            }
          >
            <Icon name={tab.icon} size={22} color={focused ? "#52634c" : "#444841"} filled={focused} />
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
  const { Text } = require("react-native");
  return (
    <Text className={`font-label-md text-[11px] ${focused ? "text-primary" : "text-on-surface-variant"}`}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="journey" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
