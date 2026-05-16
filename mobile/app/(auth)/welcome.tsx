/**
 * Post-signout welcome screen.
 *
 * Lives at the root of the (auth) stack so RouteGuard hands the user
 * here whenever the session ends. Plays a short, deliberate intro:
 *
 *   t=0       small moth + "Polln8" mark, both centered
 *   t=200ms   "Polln8" fades up + out
 *   t=200ms   moth swoops from center -> upper-right, growing + tilting
 *   t=1800ms  "Welcome" headline + body + CTAs fade in from below
 *   t=2400ms  CTAs become interactive
 *
 * Get started routes to sign-up. The "Sign in" link in the footer
 * routes to sign-in. Both are tabbable + clickable only after the
 * animation completes so the user can't tap through before the
 * screen is finished rendering itself.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";

const MOTH_SOURCE = require("@/assets/images/moth.png");
const ANIMATION_MS = 2400;

export default function Welcome() {
  const { theme, mode } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [ready, setReady] = useState(false);

  // Path values are derived from screen width so the arc lands roughly
  // in the upper-right corner regardless of device.
  const endX = Math.min(width * 0.32, 160);
  const endY = -8;

  const tx = useSharedValue(0);
  const ty = useSharedValue(40);
  const rot = useSharedValue(0);
  const scale = useSharedValue(0.55);
  const brand = useSharedValue(1);
  const copy = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.bezier(0.22, 1, 0.36, 1);

    // Brand mark fades out as the moth lifts off.
    brand.value = withDelay(
      200,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );

    // Moth arc — four waypoints, chained via withSequence so each
    // segment kicks off when the previous one finishes. Sequencing
    // every channel separately (tx, ty, rot, scale) keeps each
    // dimension independent and easy to tune later.
    const arc = (vals: [number, number, number, number]) =>
      withDelay(
        200,
        withSequence(
          withTiming(vals[0], { duration: 440, easing: ease }),
          withTiming(vals[1], { duration: 540, easing: ease }),
          withTiming(vals[2], { duration: 560, easing: ease }),
          withTiming(vals[3], { duration: 460, easing: ease }),
        ),
      );

    tx.value = arc([-width * 0.22, -width * 0.04, width * 0.22, endX]);
    ty.value = arc([-90, -200, -120, endY]);
    rot.value = arc([-22, 0, 28, 32]);
    scale.value = arc([0.75, 0.95, 1.3, 1.6]);

    // Copy + CTAs fade in as the moth settles.
    copy.value = withDelay(1800, withTiming(1, { duration: 700, easing: ease }));

    const t = setTimeout(() => setReady(true), ANIMATION_MS);
    return () => clearTimeout(t);
    // Shared values are stable refs; we don't include them in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endX, endY, width]);

  const mothStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
      { scale: scale.value },
    ],
  }));
  const brandStyle = useAnimatedStyle(() => ({ opacity: brand.value }));
  const copyStyle = useAnimatedStyle(() => ({
    opacity: copy.value,
    transform: [{ translateY: (1 - copy.value) * 12 }],
  }));

  // In dark mode the moth PNG (dark silhouette) needs to be tinted
  // white-ish so it reads against the near-black background.
  const mothTint = mode === "dark" ? theme.text : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.brandRow, brandStyle]}>
        <Text style={styles.brandText}>Polln8</Text>
      </Animated.View>

      <View style={styles.mothStage} pointerEvents="none">
        <Animated.View style={[styles.mothBox, mothStyle]}>
          <Image
            source={MOTH_SOURCE}
            style={[styles.moth, mothTint ? { tintColor: mothTint } : null]}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <Animated.View style={[styles.copy, copyStyle]} pointerEvents="none">
        <Text style={styles.h1}>Welcome</Text>
        <Text style={styles.body}>
          Polln8 is where founders find cofounders and builders find startups
          to join for equity: vetted profiles, real shipping history, no spam.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.actions, copyStyle]}>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable
            disabled={!ready}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { opacity: 0.85 },
              !ready && { opacity: 0.55 },
            ]}
          >
            <Text style={styles.primaryBtnText}>Get started</Text>
          </Pressable>
        </Link>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link
            href="/(auth)/sign-in"
            disabled={!ready}
            style={[styles.footerLink, !ready && { opacity: 0.55 }]}
          >
            Sign in
          </Link>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const makeStyles = (theme: ThemePalette) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  brandRow: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  brandText: {
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  mothStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mothBox: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  moth: {
    width: "100%",
    height: "100%",
  },
  copy: {
    alignItems: "center",
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 24,
  },
  h1: {
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 56,
    letterSpacing: -1.2,
    lineHeight: 60,
    marginBottom: 16,
  },
  body: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 380,
  },
  actions: {
    width: "100%",
    gap: 14,
    alignItems: "center",
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: theme.gold,
    borderRadius: 6,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: theme.bg,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    color: theme.textMuted,
    fontSize: 14,
  },
  footerLink: {
    color: theme.gold,
    fontSize: 14,
    fontWeight: "600",
  },
});
