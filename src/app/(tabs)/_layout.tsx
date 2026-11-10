import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, Pressable, useWindowDimensions, Animated, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { TabView, Route } from "react-native-tab-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import Library from "./library";
import Journey from "./journey";
import Profile from "../profile";

const TABS: { key: string; label: string; icon: any }[] = [
  { key: "home", label: "Home", icon: "auto_stories" },
  { key: "library", label: "Library", icon: "book_2" },
  { key: "journey", label: "Journey", icon: "wb_twilight" },
  { key: "profile", label: "Profile", icon: "person" },
];

const renderScene = ({ route }: { route: Route }) => {
  switch (route.key) {
    case "home":
      return <Home />;
    case "library":
      return <Library />;
    case "journey":
      return <Journey />;
    case "profile":
      return <Profile />;
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
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

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

  const toggleAddMenu = useCallback(() => {
    const toValue = addMenuOpen ? 0 : 1;
    Animated.spring(menuAnim, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    setAddMenuOpen((v) => !v);
  }, [addMenuOpen, menuAnim]);

  const closeMenu = useCallback(() => {
    if (!addMenuOpen) return;
    Animated.spring(menuAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    setAddMenuOpen(false);
  }, [addMenuOpen, menuAnim]);

  const handleBrowseBooks = useCallback(() => {
    closeMenu();
    setTimeout(() => router.push("/browse-books" as never), 150);
  }, [closeMenu, router]);

  const handleAddOwn = useCallback(() => {
    closeMenu();
    setTimeout(() => router.push("/add-book-manual" as never), 150);
  }, [closeMenu, router]);

  if (!session) return null;

  const tabBarHeight = 64;
  const bottomGap = insets.bottom + 12;

  // Animation interpolations for menu items
  const menuScale = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
  const menuOpacity = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const menuTranslateY = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  // Split tabs around the center + button
  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2);

  return (
    <View className="flex-1 bg-surface">
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        renderTabBar={() => null}
        initialLayout={{ width: layout.width, height: layout.height }}
        lazy
        style={{ flex: 1 }}
      />

      {/* Backdrop to close menu */}
      {addMenuOpen && (
        <Pressable
          onPress={closeMenu}
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
          }}
        />
      )}

      {/* Add Book Menu popup */}
      {addMenuOpen && (
        <Animated.View
          style={{
            position: "absolute",
            bottom: bottomGap + tabBarHeight + 12,
            left: 0,
            right: 0,
            alignItems: "center",
            opacity: menuOpacity,
            transform: [{ scale: menuScale }, { translateY: menuTranslateY }],
          }}
          pointerEvents="box-none"
        >
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 20,
              paddingVertical: 8,
              paddingHorizontal: 4,
              minWidth: 220,
              shadowColor: Colors.shadowMedium,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            <Pressable
              onPress={handleAddOwn}
              className="flex-row items-center gap-3 px-4 py-3 rounded-xl active:bg-surface-container-low"
            >
              <View
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: Colors.primaryContainer ?? "#EDE7DA",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name="edit_note" size={20} color={Colors.primary} />
              </View>
              <View>
                <Text className="font-label-lg text-on-surface">Add Your Own Book</Text>
                <Text className="text-caption text-on-surface-variant">Enter book details manually</Text>
              </View>
            </Pressable>

            <View style={{ height: 1, backgroundColor: Colors.outline + "22", marginHorizontal: 16 }} />

            <Pressable
              onPress={handleBrowseBooks}
              className="flex-row items-center gap-3 px-4 py-3 rounded-xl active:bg-surface-container-low"
            >
              <View
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: Colors.primaryContainer ?? "#EDE7DA",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name="explore" size={20} color={Colors.primary} />
              </View>
              <View>
                <Text className="font-label-lg text-on-surface">Browse Books</Text>
                <Text className="text-caption text-on-surface-variant">Search & explore the catalog</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Tab Bar */}
      <View pointerEvents="box-none" className="absolute bottom-0 left-0 right-0">
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(247,239,222,0)", Colors.surface]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 160 }}
        />
        <View
          className="mx-4 flex-row justify-around items-center bg-primary rounded-full"
          style={{
            marginBottom: bottomGap,
            height: tabBarHeight,
            paddingHorizontal: 12,
            shadowColor: Colors.shadowMedium,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 16,
          }}
        >
          {/* Left tabs */}
          {leftTabs.map((tab) => {
            const isFocused = index === TABS.findIndex((t) => t.key === tab.key);
            return (
              <Pressable
                key={tab.key}
                onPress={() => { closeMenu(); handleIndexChange(TABS.findIndex((t) => t.key === tab.key)); }}
                className={
                  isFocused
                    ? "flex-col items-center justify-center bg-white/15 rounded-full px-5 py-1.5"
                    : "flex-col items-center justify-center px-5 py-1.5"
                }
              >
                <Icon name={tab.icon} size={18} color={isFocused ? Colors.onPrimary : "rgba(255,255,255,0.72)"} filled={isFocused} />
                <View className="mt-1">
                  <Text className={`font-display text-sm ${isFocused ? "text-white" : "text-white/70"}`}>
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {/* Center + Add button */}
          <Pressable
            onPress={toggleAddMenu}
            style={{
              width: 48, height: 48,
              borderRadius: 24,
              backgroundColor: addMenuOpen ? Colors.onPrimary : "rgba(255,255,255,0.22)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 2,
            }}
          >
            <Animated.View
              style={{
                transform: [{
                  rotate: menuAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] }),
                }],
              }}
            >
              <Icon
                name="add"
                size={24}
                color={addMenuOpen ? Colors.primary : Colors.onPrimary}
              />
            </Animated.View>
          </Pressable>

          {/* Right tabs */}
          {rightTabs.map((tab) => {
            const isFocused = index === TABS.findIndex((t) => t.key === tab.key);
            return (
              <Pressable
                key={tab.key}
                onPress={() => { closeMenu(); handleIndexChange(TABS.findIndex((t) => t.key === tab.key)); }}
                className={
                  isFocused
                    ? "flex-col items-center justify-center bg-white/15 rounded-full px-5 py-1.5"
                    : "flex-col items-center justify-center px-5 py-1.5"
                }
              >
                <Icon name={tab.icon} size={18} color={isFocused ? Colors.onPrimary : "rgba(255,255,255,0.72)"} filled={isFocused} />
                <View className="mt-1">
                  <Text className={`font-display text-sm ${isFocused ? "text-white" : "text-white/70"}`}>
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
