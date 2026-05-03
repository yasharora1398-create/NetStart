import "react-native-gesture-handler";
import { ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import {
  Fraunces_700Bold,
  Fraunces_700Bold_Italic,
} from "@expo-google-fonts/fraunces";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/lib/auth";
import { theme } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Web routes the notification body uses don't 1:1 match mobile routes.
// This map keeps the data layer untouched (the web app reads the same
// `link` field) while handling the mobile-specific target.
const mapWebLinkToMobile = (link: string): string | null => {
  if (link.startsWith("/u/")) return link;
  if (link === "/mynet" || link === "/talent" || link === "/match") {
    return link === "/talent"
      ? "/(tabs)/browse"
      : link === "/match"
        ? "/(tabs)"
        : "/(tabs)/mynet";
  }
  if (link === "/chats") return "/(tabs)/threads";
  // Fallback: open the inbox-like Threads tab.
  return "/(tabs)/threads";
};

const navTheme = {
  dark: true,
  colors: {
    primary: theme.gold,
    background: theme.bg,
    card: theme.bgElev,
    text: theme.text,
    border: theme.border,
    notification: theme.gold,
  },
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" as const },
    medium: { fontFamily: "System", fontWeight: "500" as const },
    bold: { fontFamily: "System", fontWeight: "700" as const },
    heavy: { fontFamily: "System", fontWeight: "900" as const },
  },
};

const RouteGuard = () => {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!session && !inAuth) {
      router.replace("/(auth)/sign-in");
    } else if (session && inAuth) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments, router]);

  // Route the user to the screen referenced by the push payload's
  // `link` field when they tap a notification.
  useEffect(() => {
    if (!session) return;
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const link = response.notification.request.content.data?.link as
          | string
          | undefined;
        if (link && typeof link === "string") {
          // Strip the leading slash mismatch and route. We map a few
          // known web routes to mobile equivalents.
          const target = mapWebLinkToMobile(link);
          if (target) router.push(target as never);
        }
      },
    );
    return () => sub.remove();
  }, [session, router]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.gold} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_700Bold,
    Fraunces_700Bold_Italic,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const onReady = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider value={navTheme}>
            <RouteGuard />
            <StatusBar style="light" />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
