import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getProfile } from "../lib/profiles";
import { useAuthStore } from "../stores/auth-store";

export default function Index() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) return;
    if (!session) { router.replace("/auth" as never); return; }

    getProfile(session.user.id)
      .then((profile) => {
        router.replace(profile?.display_name ? "/home" : ("/onboarding" as never));
      })
      .catch(() => router.replace("/onboarding" as never));
  }, [session, isLoading]);

  return (
    <View className="flex-1 bg-surface items-center justify-center">
      <ActivityIndicator size="small" color="#52634c" />
    </View>
  );
}
