import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { enableScreens, enableFreeze } from "react-native-screens";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  EBGaramond_400Regular,
  EBGaramond_500Medium,
  EBGaramond_600SemiBold,
  EBGaramond_700Bold,
} from "@expo-google-fonts/eb-garamond";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/auth-store";
import "../lib/session-notifications";

enableScreens(true);
enableFreeze(true);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return <>{children}</>;
}

function useNotificationObserver() {
  const router = useRouter();

  useEffect(() => {
    const redirect = (data: Record<string, unknown> | null | undefined) => {
      if (!data) return;
      const kind = data.kind;
      if (kind !== "block_prep" && kind !== "block_start") return;
      if (!useAuthStore.getState().session) return;
      const bookId = typeof data.book_id === "string" ? data.book_id : null;
      const target = typeof data.target_minutes === "string" ? data.target_minutes : null;
      if (bookId) {
        const qs = [`book_id=${bookId}`, target ? `target_minutes=${target}` : null].filter(Boolean).join("&");
        router.push(`/reading-session?${qs}` as never);
      } else {
        router.push("/schedule" as never);
      }
    };

    try {
      const initial = Notifications.getLastNotificationResponse();
      redirect(initial?.notification.request.content.data as Record<string, unknown> | undefined);
    } catch {}

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification.request.content.data as Record<string, unknown>);
    });
    return () => subscription.remove();
  }, [router]);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    EBGaramond_400Regular,
    EBGaramond_500Medium,
    EBGaramond_600SemiBold,
    EBGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useNotificationObserver();

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="book-detail" options={{ presentation: "card" }} />
          <Stack.Screen name="reading-session" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="schedule" options={{ presentation: "card" }} />
          <Stack.Screen name="profile" options={{ presentation: "card" }} />
        </Stack>
      </AuthGate>
    </QueryClientProvider>
  );
}
