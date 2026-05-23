import "react-native-gesture-handler";
import { ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MothLoader } from "@/components/MothLoader";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import {
 Fraunces_500Medium,
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
import { ThemeProvider, useTheme } from "@/lib/themeMode";

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

const RouteGuard = () => {
 const { session, loading } = useAuth();
 const { theme } = useTheme();
 const router = useRouter();
 const segments = useSegments();

 useEffect(() => {
 if (loading) return;
 const inAuth = segments[0] === "(auth)";
 if (!session && !inAuth) {
 // Native (iOS / Android via TestFlight or App Store) gets the
 // welcome screen first; web (polln8.com/m/) skips it and goes
 // straight to sign-in per the latest direction.
 const dest =
 Platform.OS === "web" ? "/(auth)/sign-in" : "/(auth)/welcome";
 router.replace(dest);
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
 <MothLoader size={220} />
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
 Fraunces_500Medium,
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
 <GestureHandlerRootView style={{ flex: 1 }}>
 <ErrorBoundary>
 <SafeAreaProvider>
 <AuthProvider>
 <ThemeProvider>
 <ThemedShell />
 </ThemeProvider>
 </AuthProvider>
 </SafeAreaProvider>
 </ErrorBoundary>
 </GestureHandlerRootView>
 );
}

// Inner shell that lives INSIDE ThemeProvider so it can read the
// dynamic theme via useTheme() and apply it to the navigation theme,
// the status bar, and a top-level background.
const ThemedShell = () => {
 const { mode, theme } = useTheme();

 const navTheme = useMemo(
 () => ({
 dark: mode === "dark",
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
 }),
 [mode, theme],
 );

 return (
 <View style={{ flex: 1, backgroundColor: theme.bg }}>
 <NavThemeProvider value={navTheme}>
 <RouteGuard />
 <StatusBar style={mode === "dark" ? "light" : "dark"} />
 </NavThemeProvider>
 </View>
 );
};
