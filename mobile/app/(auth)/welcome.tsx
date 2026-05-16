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

const MOTH_SOURCE = require("@/assets/images/moth.png");

// Welcome is ALWAYS rendered in the light palette from the design
// hand-off. We deliberately do not call useTheme() here — the screen
// stays the same whether the app's elsewhere in light or dark mode.
const PALETTE = {
  bg: "#FAFAF7",
  ink: "#0F1410",
  muted: "#4A4D52",
  quiet: "#6B6E73",
  accent: "#1F5F3E",
  onAccent: "#FAFAF7",
} as const;

export default function Welcome() {
  const styles = useMemo(() => makeStyles(), []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wordmarkRow}>
        <Text style={styles.wordmark}>Polln8</Text>
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>Welcome</Text>
      </View>

      <View style={styles.mothRow} pointerEvents="none">
        {/* Render the moth at its native dark silhouette — no tint,
            regardless of the app's theme mode. */}
        <Image source={MOTH_SOURCE} style={styles.moth} resizeMode="contain" />
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
        {/* Single CTA — Get started is the whole entry point on this
            screen. Sign-in lives one click deeper inside the sign-up
            flow so the welcome surface stays uncluttered. */}
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

      <View style={styles.bottomSpacer} />
    </SafeAreaView>
  );
}

const makeStyles = () => {
  // Reference artboard: 390x844. Font + moth sizes scale off
  // screen width so the design reads the same on any phone.
  const w = Dimensions.get("window").width;
  const ref = 390;
  const k = w / ref;
  const titleFont = 76 * k;
  const headlineFont = 30 * k;
  const bodyFont = 15 * k;
  const ctaFont = 16 * k;
  const wordmarkFont = 22 * k;
  const mothSize = 340 * k;

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: PALETTE.bg,
    },
    wordmarkRow: {
      paddingTop: 24,
      paddingHorizontal: 24,
      alignItems: "center",
    },
    wordmark: {
      color: PALETTE.ink,
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
      color: PALETTE.ink,
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
      color: PALETTE.ink,
      fontFamily: fonts.displayMedium,
      fontSize: headlineFont,
      lineHeight: headlineFont * 1.1,
      letterSpacing: -headlineFont * 0.015,
      fontWeight: "500",
      marginBottom: 14,
      textAlign: "center",
    },
    body: {
      color: PALETTE.muted,
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
    },
    primaryBtn: {
      height: 64,
      borderRadius: 14,
      backgroundColor: PALETTE.accent,
      alignItems: "center",
      justifyContent: "center",
      // Soft drop shadow so the bigger button reads as the
      // single confident CTA on the screen.
      shadowColor: PALETTE.accent,
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    primaryBtnText: {
      color: PALETTE.onAccent,
      fontFamily: fonts.body,
      fontSize: ctaFont + 2,
      fontWeight: "700",
      letterSpacing: -(ctaFont + 2) * 0.01,
    },
    bottomSpacer: { height: 32 },
  });
};
