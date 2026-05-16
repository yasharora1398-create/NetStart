/**
 * Welcome screen — the unauthenticated landing for the mobile app.
 * Shown on first install, after every sign-out, and any time the
 * user isn't signed in (routed via RouteGuard in app/_layout.tsx).
 *
 * Pure static layout, no animations. Buttons route directly to the
 * sign-up and sign-in screens.
 */
import { useMemo } from "react";
import { Link } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";

const MOTH_SOURCE = require("@/assets/images/moth.png");

export default function Welcome() {
  const { theme, mode } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // In dark mode the dark-silhouette PNG needs to be tinted to the
  // foreground colour so it reads against the near-black background.
  const mothTint = mode === "dark" ? theme.text : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.brandRow}>
        <Text style={styles.brandText}>Polln8</Text>
      </View>

      <Text style={styles.title}>Welcome</Text>

      <View style={styles.mothStage} pointerEvents="none">
        <View style={styles.mothBox}>
          <Image
            source={MOTH_SOURCE}
            style={[styles.moth, mothTint ? { tintColor: mothTint } : null]}
            resizeMode="contain"
          />
        </View>

        <View style={styles.arrowWrap} pointerEvents="none">
          <Svg viewBox="0 0 360 220" width="100%" height="100%">
            <Path
              d="M 30,200 Q 120,140 200,150 T 320,80"
              stroke={theme.text}
              strokeWidth={2.5}
              strokeDasharray="3 7"
              strokeLinecap="round"
              fill="none"
              opacity={0.85}
            />
            <Path
              d="M 314,72 L 326,82 L 314,92"
              stroke={theme.text}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.85}
            />
          </Svg>
        </View>
      </View>

      <Text style={styles.body}>
        Polln8 is where founders find cofounders and builders find startups
        to join for equity: vetted profiles, real shipping history, no spam.
      </Text>

      <View style={styles.actionBlock}>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { opacity: 0.88 },
            ]}
          >
            <Text style={styles.primaryBtnText}>Get started</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/sign-in" style={styles.footerLink}>
          Sign in
        </Link>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (theme: ThemePalette) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    overflow: "hidden",
  },
  brandRow: {
    alignItems: "center",
    paddingVertical: 4,
  },
  brandText: {
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  title: {
    textAlign: "center",
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 110,
    lineHeight: 100,
    letterSpacing: -3.5,
    marginTop: 28,
    fontWeight: "800",
  },
  mothStage: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  mothBox: {
    position: "absolute",
    right: -90,
    top: 16,
    width: 360,
    height: 360,
    transform: [{ rotate: "32deg" }],
  },
  moth: { width: "100%", height: "100%" },
  arrowWrap: {
    position: "absolute",
    left: "2%",
    right: "18%",
    bottom: "8%",
    height: "55%",
  },
  body: {
    textAlign: "center",
    color: theme.text,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 23,
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  actionBlock: {
    width: "100%",
    marginBottom: 12,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: theme.gold,
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: theme.bg,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    color: theme.textMuted,
    fontSize: 14,
  },
  footerLink: {
    color: theme.gold,
    fontSize: 14,
    fontWeight: "700",
  },
});
