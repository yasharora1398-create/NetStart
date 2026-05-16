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
  Dimensions,
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

const makeStyles = (theme: ThemePalette) => {
  // Sizing is derived from the screen width so the layout matches
  // the storyboard proportions on any phone — "Welcome" spans ~85%
  // of the viewport, the moth fills the right side and clips off
  // the right edge, body copy is bold and a third the size of the
  // headline, button sits near the bottom.
  const w = Dimensions.get("window").width;
  const titleFont = Math.min(w * 0.26, 160);
  const titleLine = titleFont * 0.92;
  const bodyFont = Math.min(w * 0.05, 22);
  const ctaFont = Math.min(w * 0.044, 19);
  const signinFont = Math.min(w * 0.036, 16);
  const mothSize = Math.min(w * 0.86, 520);

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.bg,
      paddingHorizontal: w * 0.05,
      paddingTop: 24,
      paddingBottom: 32,
      overflow: "hidden",
    },
    brandRow: {
      alignItems: "center",
    },
    brandText: {
      color: theme.text,
      fontFamily: fonts.display,
      fontSize: Math.min(w * 0.05, 22),
      fontWeight: "700",
      letterSpacing: -0.4,
    },
    title: {
      textAlign: "center",
      color: theme.text,
      fontFamily: fonts.display,
      fontSize: titleFont,
      lineHeight: titleLine,
      letterSpacing: -titleFont * 0.04,
      marginTop: 48,
      fontWeight: "800",
    },
    mothStage: {
      flex: 1,
      width: "100%",
      position: "relative",
    },
    mothBox: {
      position: "absolute",
      right: -w * 0.14,
      top: 16,
      width: mothSize,
      height: mothSize,
      transform: [{ rotate: "32deg" }],
    },
    moth: { width: "100%", height: "100%" },
    arrowWrap: {
      position: "absolute",
      left: "2%",
      right: "24%",
      bottom: "6%",
      height: "56%",
    },
    body: {
      textAlign: "center",
      color: theme.text,
      fontSize: bodyFont,
      fontWeight: "700",
      lineHeight: bodyFont * 1.3,
      marginTop: 16,
      marginBottom: 32,
      paddingHorizontal: 8,
    },
    actionBlock: {
      width: "100%",
      marginBottom: 14,
    },
    primaryBtn: {
      width: "100%",
      backgroundColor: theme.gold,
      borderRadius: 10,
      paddingVertical: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnText: {
      color: theme.bg,
      fontSize: ctaFont,
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
      fontSize: signinFont,
    },
    footerLink: {
      color: theme.gold,
      fontSize: signinFont,
      fontWeight: "700",
    },
  });
};
