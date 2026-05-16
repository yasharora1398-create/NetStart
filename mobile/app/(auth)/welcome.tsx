/**
 * Welcome screen — the unauthenticated landing for the mobile app.
 * Shown on first install, after every sign-out, and any time the
 * user isn't signed in (routed via RouteGuard in app/_layout.tsx).
 *
 * Layout matches the "Polln8 Welcome" design (HomeScreen variant
 * from the Claude Design handoff): top wordmark, big serif Welcome
 * headline, moth rotated 49° just below it, then "Find your person."
 * + description copy, then the full-width Get started CTA and the
 * "Already have an account? Sign in" line.
 *
 * Sizes follow the 390x844 artboard the designer used. We don't
 * pin to those exact pixel values on every device — instead we
 * scale font sizes/widths off the screen width so the same
 * composition reads on any phone.
 */
import { useMemo } from "react";
import { Link } from "expo-router";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";

const MOTH_SOURCE = require("@/assets/images/moth.png");

export default function Welcome() {
  const { theme, mode } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Dark silhouette PNG → tint to foreground in dark mode so it
  // reads against the near-black background.
  const mothTint = mode === "dark" ? theme.text : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wordmarkRow}>
        <Text style={styles.wordmark}>Polln8</Text>
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>Welcome</Text>
      </View>

      <View style={styles.mothRow} pointerEvents="none">
        <Image
          source={MOTH_SOURCE}
          style={[styles.moth, mothTint ? { tintColor: mothTint } : null]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.copyBlock}>
        <Text style={styles.headline}>Find your person.</Text>
        <Text style={styles.body}>
          Polln8 is where founders find cofounders and builders find startups
          to join for equity. Vetted profiles, real shipping history, no spam.
        </Text>
      </View>

      <View style={styles.spacer} />

      <View style={styles.ctaBlock}>
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

        <View style={styles.signInRow}>
          <Text style={styles.signInLead}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" style={styles.signInLink}>
            Sign in
          </Link>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </SafeAreaView>
  );
}

const makeStyles = (theme: ThemePalette) => {
  // Reference artboard: 390x844. Font + moth sizes scale off
  // screen width so the design reads the same on any phone.
  const w = Dimensions.get("window").width;
  const ref = 390;
  const k = w / ref;
  const titleFont = 76 * k;
  const headlineFont = 30 * k;
  const bodyFont = 15 * k;
  const ctaFont = 16 * k;
  const signInFont = 14 * k;
  const wordmarkFont = 22 * k;
  const mothSize = 340 * k;

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    wordmarkRow: {
      paddingTop: 24,
      paddingHorizontal: 24,
      alignItems: "center",
    },
    wordmark: {
      color: theme.text,
      fontFamily: fonts.body,
      fontSize: wordmarkFont,
      fontWeight: "600",
      letterSpacing: -wordmarkFont * 0.025,
    },
    titleWrap: {
      marginTop: 56,
      alignItems: "center",
    },
    title: {
      color: theme.text,
      fontFamily: fonts.display,
      fontSize: titleFont,
      lineHeight: titleFont,
      letterSpacing: -titleFont * 0.045,
      fontWeight: "700",
    },
    mothRow: {
      marginTop: -40,
      alignItems: "center",
    },
    moth: {
      width: mothSize,
      height: mothSize,
      transform: [{ rotate: "49deg" }],
    },
    copyBlock: {
      paddingHorizontal: 24,
      marginTop: -8,
      alignItems: "center",
    },
    headline: {
      color: theme.text,
      fontFamily: fonts.displayMedium,
      fontSize: headlineFont,
      lineHeight: headlineFont * 1.1,
      letterSpacing: -headlineFont * 0.015,
      fontWeight: "500",
      marginBottom: 14,
      textAlign: "center",
    },
    body: {
      color: theme.textMuted,
      fontFamily: fonts.body,
      fontSize: bodyFont,
      lineHeight: bodyFont * 1.55,
      letterSpacing: -bodyFont * 0.005,
      textAlign: "center",
      maxWidth: 320,
    },
    spacer: { flex: 1 },
    ctaBlock: {
      paddingHorizontal: 24,
      paddingBottom: 4,
      gap: 18,
    },
    primaryBtn: {
      height: 56,
      borderRadius: 12,
      backgroundColor: theme.gold,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnText: {
      color: theme.bg,
      fontFamily: fonts.body,
      fontSize: ctaFont,
      fontWeight: "600",
      letterSpacing: -ctaFont * 0.01,
    },
    signInRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "baseline",
    },
    signInLead: {
      color: theme.textDim,
      fontFamily: fonts.body,
      fontSize: signInFont,
      letterSpacing: -signInFont * 0.005,
    },
    signInLink: {
      color: theme.gold,
      fontFamily: fonts.body,
      fontSize: signInFont,
      fontWeight: "500",
      letterSpacing: -signInFont * 0.005,
    },
    bottomSpacer: { height: 24 },
  });
};
