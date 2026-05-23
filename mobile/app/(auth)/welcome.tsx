/**
 * Welcome screen — the unauthenticated landing for the mobile app.
 * Shown on first install, after every sign-out, and any time the
 * user isn't signed in (routed via RouteGuard in app/_layout.tsx).
 *
 * Layout matches the "Polln8 Welcome" design (HomeScreen variant
 * from the Claude Design handoff): top wordmark, big serif Welcome
 * headline, moth rotated 49° just below it, then "Find your person."
 * + description copy, then a single big green Get started CTA at
 * the bottom.
 *
 * The CTA is pinned to the bottom edge with position: absolute so
 * it stays visible regardless of viewport height. The content above
 * lives in a ScrollView so phones whose viewport is shorter than
 * the natural layout can still scroll through everything.
 */
import { useMemo } from "react";
import { Link } from "expo-router";
import {
 Dimensions,
 Image,
 Pressable,
 ScrollView,
 StyleSheet,
 Text,
 View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fonts } from "@/lib/theme";

const MOTH_SOURCE = require("@/assets/images/moth.png");

// Welcome is ALWAYS rendered in the light palette from the design
// hand-off. We deliberately do not call useTheme() here.
const PALETTE = {
 bg: "#FAFAF7",
 ink: "#0F1410",
 muted: "#4A4D52",
 accent: "#1F5F3E",
 onAccent: "#FAFAF7",
} as const;

export default function Welcome() {
 const styles = useMemo(() => makeStyles(), []);

 return (
 <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
 {/* Everything except the CTA scrolls. The ScrollView grows to
 fill remaining height, so on tall phones the spacer pushes
 content up and on short phones the user can scroll. */}
 <ScrollView
 style={styles.scroll}
 contentContainerStyle={styles.scrollContent}
 showsVerticalScrollIndicator={false}
 >
 <View style={styles.wordmarkRow}>
 <Text style={styles.wordmark}>Polln8</Text>
 </View>

 <View style={styles.titleWrap}>
 <Text style={styles.title}>Welcome</Text>
 </View>

 <View style={styles.mothRow} pointerEvents="none">
 <Image source={MOTH_SOURCE} style={styles.moth} resizeMode="contain" />
 </View>

 <View style={styles.copyBlock}>
 <Text style={styles.headline}>Find your person.</Text>
 <Text style={styles.body}>
 Polln8 is where founders find cofounders and partners find startups
 to join for equity. Vetted profiles, real shipping history, no spam.
 </Text>
 </View>
 </ScrollView>

 {/* The big green Get started CTA is its own absolute-positioned
 bar at the bottom so it can NEVER get pushed below the
 screen edge no matter how tall the content above is. */}
 <View style={styles.ctaBar}>
 <Link href="/(auth)/sign-up" asChild>
 <Pressable style={styles.primaryBtn}>
 <Text style={styles.primaryBtnText}>Get started</Text>
 </Pressable>
 </Link>
 </View>
 </SafeAreaView>
 );
}

const makeStyles = () => {
 // Reference artboard: 390x844. Font + moth sizes scale off the
 // screen width so the design reads the same on any phone.
 const w = Dimensions.get("window").width;
 const ref = 390;
 const k = w / ref;
 const titleFont = 76 * k;
 const headlineFont = 30 * k;
 const bodyFont = 15 * k;
 const ctaFont = 18 * k;
 const wordmarkFont = 22 * k;
 const mothSize = 340 * k;

 return StyleSheet.create({
 safe: {
 flex: 1,
 backgroundColor: PALETTE.bg,
 },
 scroll: {
 flex: 1,
 },
 // Bottom padding reserves space for the absolute-positioned
 // ctaBar so the last bit of body copy isn't tucked under it.
 scrollContent: {
 paddingBottom: 180,
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
 // Absolute-positioned bar pinned near the bottom of the
 // SafeAreaView. Sits ~32px above the bottom edge so it doesn't
 // hug the home indicator or the very bottom of the screen.
 ctaBar: {
 position: "absolute",
 left: 0,
 right: 0,
 bottom: 32,
 paddingHorizontal: 24,
 backgroundColor: PALETTE.bg,
 },
 primaryBtn: {
 width: "100%",
 height: 64,
 borderRadius: 14,
 backgroundColor: PALETTE.accent,
 alignItems: "center",
 justifyContent: "center",
 shadowColor: PALETTE.accent,
 shadowOpacity: 0.25,
 shadowRadius: 16,
 shadowOffset: { width: 0, height: 8 },
 elevation: 6,
 },
 primaryBtnText: {
 color: PALETTE.onAccent,
 fontFamily: fonts.body,
 fontSize: ctaFont,
 fontWeight: "700",
 letterSpacing: -ctaFont * 0.01,
 },
 });
};
