/**
 * Post-signout welcome screen (Expo native + web bundle).
 *
 * Storyboard:
 *   t=0       small moth in center, "Polln8" brand at top
 *   t=0.2s    moth lifts off and orbits counter-clockwise around
 *             the center, growing as it goes
 *   t=2.4s    moth lands upper-right, large + tilted ~30°
 *   t=1.5s    "Welcome" title fades + lifts in
 *   t=2.0s    dashed arrow fades in pointing toward the moth
 *   t=2.4s    body copy fades in
 *   t=2.7s    Get started CTA rises in, then breathes a soft pulse
 *   t=2.9s    "Already have an account? Sign in" fades in
 *   t=3.0s    buttons become interactive
 *
 * The Polln8 brand mark stays pinned through the whole sequence —
 * matches the final-frame screenshot the design was based on.
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
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";

const MOTH_SOURCE = require("@/assets/images/moth.png");
const ANIMATION_MS = 3000;

export default function Welcome() {
  const { theme, mode } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [ready, setReady] = useState(false);

  // Orbit radius + final offset are derived from the screen width so
  // the moth lands roughly upper-right regardless of device.
  const R = Math.min(width * 0.32, 150);
  const endX = R * 1.05;
  const endY = -R * 0.6;

  // Moth motion + scale + rotation
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const scale = useSharedValue(0.45);

  // Text / arrow / CTA opacities + entrance lifts
  const titleOpacity = useSharedValue(0);
  const titleLift = useSharedValue(14);
  const arrowOpacity = useSharedValue(0);
  const bodyOpacity = useSharedValue(0);
  const bodyLift = useSharedValue(12);
  const ctaOpacity = useSharedValue(0);
  const ctaLift = useSharedValue(20);
  const ctaScale = useSharedValue(0.96);
  const ctaPulse = useSharedValue(1);
  const signInOpacity = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.bezier(0.42, 0, 0.58, 1);
    const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
    const seg = (vals: number[], durs: number[]) =>
      withDelay(
        200,
        withSequence(
          ...vals.map((v, i) =>
            withTiming(v, { duration: durs[i], easing: ease }),
          ),
        ),
      );

    // CCW orbit waypoints (translateX). 9 segments, ~242ms each.
    const durs = [180, 220, 260, 260, 260, 260, 260, 260, 240];
    tx.value = seg([0, -95, -150, -120, 0, 120, 155, 130, endX], durs);
    ty.value = seg([-90, -120, -25, 85, 130, 85, -25, -110, endY], durs);
    rot.value = seg([-40, -95, -150, -200, -235, -275, -310, -340, -328], durs);
    scale.value = seg([0.55, 0.62, 0.7, 0.78, 0.9, 1.05, 1.25, 1.5, 1.75], durs);

    // Welcome title fades + lifts in at t=1500
    titleOpacity.value = withDelay(1500, withTiming(1, { duration: 700, easing: easeOut }));
    titleLift.value = withDelay(1500, withTiming(0, { duration: 700, easing: easeOut }));

    // Dashed arrow fades in at t=2000
    arrowOpacity.value = withDelay(2000, withTiming(0.7, { duration: 700, easing: easeOut }));

    // Body copy fades + lifts at t=2400
    bodyOpacity.value = withDelay(2400, withTiming(1, { duration: 700, easing: easeOut }));
    bodyLift.value = withDelay(2400, withTiming(0, { duration: 700, easing: easeOut }));

    // Get started CTA rises in at t=2700, then breathes forever from t=3400
    ctaOpacity.value = withDelay(2700, withTiming(1, { duration: 650, easing: easeOut }));
    ctaLift.value = withDelay(2700, withTiming(0, { duration: 650, easing: easeOut }));
    ctaScale.value = withDelay(2700, withTiming(1, { duration: 650, easing: easeOut }));
    ctaPulse.value = withDelay(
      3400,
      withRepeat(
        withSequence(
          withTiming(1.015, { duration: 1300, easing: easeOut }),
          withTiming(1, { duration: 1300, easing: easeOut }),
        ),
        -1,
        false,
      ),
    );

    // Sign-in link fades at t=2900
    signInOpacity.value = withDelay(2900, withTiming(1, { duration: 500, easing: easeOut }));

    const t = setTimeout(() => setReady(true), ANIMATION_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endX, endY]);

  const mothStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
      { scale: scale.value },
    ],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleLift.value }],
  }));
  const arrowStyle = useAnimatedStyle(() => ({ opacity: arrowOpacity.value }));
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: bodyOpacity.value,
    transform: [{ translateY: bodyLift.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [
      { translateY: ctaLift.value },
      { scale: ctaScale.value * ctaPulse.value },
    ],
  }));
  const signInStyle = useAnimatedStyle(() => ({ opacity: signInOpacity.value }));

  const mothTint = mode === "dark" ? theme.text : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Brand mark — pinned, no fade */}
      <View style={styles.brandRow}>
        <Text style={styles.brandText}>Polln8</Text>
      </View>

      {/* Welcome title */}
      <Animated.Text style={[styles.title, titleStyle]}>Welcome</Animated.Text>

      {/* Moth stage + dashed arrow overlay */}
      <View style={styles.mothStage} pointerEvents="none">
        <Animated.View style={[styles.mothBox, mothStyle]}>
          <Image
            source={MOTH_SOURCE}
            style={[styles.moth, mothTint ? { tintColor: mothTint } : null]}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.arrowWrap, arrowStyle]} pointerEvents="none">
          <Svg viewBox="0 0 360 220" width="100%" height="100%">
            <Path
              d="M 30,200 Q 120,140 200,150 T 320,80"
              stroke={theme.textMuted}
              strokeWidth={2.5}
              strokeDasharray="3 7"
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M 314,72 L 326,82 L 314,92"
              stroke={theme.textMuted}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      </View>

      {/* Body copy */}
      <Animated.Text style={[styles.body, bodyStyle]}>
        Polln8 is where founders find cofounders and builders find startups
        to join for equity: vetted profiles, real shipping history, no spam.
      </Animated.Text>

      {/* Get started */}
      <Animated.View style={[styles.actionBlock, ctaStyle]}>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable
            disabled={!ready}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { opacity: 0.85 },
              !ready && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.primaryBtnText}>Get started</Text>
          </Pressable>
        </Link>
      </Animated.View>

      {/* Already have an account? Sign in */}
      <Animated.View style={[styles.footerRow, signInStyle]}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link
          href="/(auth)/sign-in"
          disabled={!ready}
          style={[styles.footerLink, !ready && { opacity: 0.6 }]}
        >
          Sign in
        </Link>
      </Animated.View>
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
    fontSize: 96,
    lineHeight: 92,
    letterSpacing: -3,
    marginTop: 24,
    marginBottom: 0,
    fontWeight: "800",
  },
  mothStage: {
    flex: 1,
    width: "100%",
    position: "relative",
    marginTop: -60,
  },
  mothBox: {
    position: "absolute",
    width: 180,
    height: 180,
    left: "50%",
    top: "50%",
    marginLeft: -90,
    marginTop: -90,
  },
  moth: { width: "100%", height: "100%" },
  arrowWrap: {
    position: "absolute",
    left: "6%",
    right: "6%",
    bottom: "10%",
    height: "55%",
  },
  body: {
    textAlign: "center",
    color: theme.text,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 23,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  actionBlock: {
    width: "100%",
    marginTop: 8,
    marginBottom: 12,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: theme.gold,
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.gold,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
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
