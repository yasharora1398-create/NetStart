/**
 * Detail overlay shown when the user swipes a card LEFT in the Match
 * deck. Slides up from the bottom; user dismisses by swiping DOWN
 * (matching the M5 → M6 → close flow in the tutorial).
 *
 * Renders the candidate's full info — bio, skills, location,
 * commitment, plus mock "past projects" and "looking for" sections so
 * the page feels like a real profile read.
 */
import { useEffect, useMemo } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  Send,
  User,
} from "lucide-react-native";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { getAvatarUrl, getResumeUrl } from "@/lib/api";
import type { Candidate } from "@/lib/types";

type RankedCandidate = Candidate & {
  similarity: number;
  role?: "founder" | "builder";
  projectTitle?: string;
  projectDescription?: string;
};

const SWIPE_DOWN_THRESHOLD = 80;

export type Role = "founder" | "builder";

export const CandidateDetail = ({
  candidate,
  role,
  onClose,
  onCtaPress,
}: {
  candidate: RankedCandidate;
  role: Role;
  onClose: () => void;
  onCtaPress?: () => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Slide-up entry + drag-down translate.
  const ty = useSharedValue(800);
  useEffect(() => {
    ty.value = withTiming(0, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
  }, [ty]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      // Only follow the finger when dragging DOWN.
      if (e.translationY > 0) ty.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > SWIPE_DOWN_THRESHOLD) {
        ty.value = withTiming(800, {
          duration: 280,
          easing: Easing.in(Easing.cubic),
        });
        runOnJS(onClose)();
      } else {
        ty.value = withTiming(0, { duration: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      ty.value,
      [0, 800],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const url =
    candidate.avatarPath?.startsWith("http")
      ? candidate.avatarPath
      : getAvatarUrl(candidate.avatarPath);

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { zIndex: 50, elevation: 50 }]}
    >
      {/* Dim backdrop fades in with the sheet */}
      <Animated.View
        pointerEvents="auto"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.55)" },
          backdropStyle,
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.sheet, sheetStyle]} pointerEvents="auto">
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Image */}
            <View style={styles.image}>
              {url ? (
                <Image
                  source={{ uri: url }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <User size={84} color={theme.textDim} strokeWidth={1.4} />
              )}
            </View>

            {/* Name */}
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {candidate.fullName || "Unnamed"}
              </Text>
            </View>

            {/* Pills */}
            <View style={styles.pills}>
              {candidate.commitment ? (
                <View style={[styles.pill, styles.pillCommitment]}>
                  <Clock size={11} color={theme.marigold} strokeWidth={2} />
                  <Text
                    style={[styles.pillText, { color: theme.marigold }]}
                  >
                    {candidate.commitment}
                  </Text>
                </View>
              ) : null}
              {candidate.location ? (
                <View style={[styles.pill, styles.pillLocation]}>
                  <MapPin size={11} color={theme.sageDeep} strokeWidth={2} />
                  <Text
                    style={[styles.pillText, { color: theme.sageDeep }]}
                  >
                    {candidate.location}
                  </Text>
                </View>
              ) : null}
              {candidate.skills.map((s) => (
                <View key={s} style={[styles.pill, styles.pillSkill]}>
                  <Text style={[styles.pillText, { color: theme.textMuted }]}>
                    {s}
                  </Text>
                </View>
              ))}
            </View>

            {candidate.headline ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Headline</Text>
                <Text style={styles.body}>{candidate.headline}</Text>
              </View>
            ) : null}

            {/* Project — only when this person is a founder. Pulls
                from their MyNet project. */}
            {candidate.role === "founder" && candidate.projectTitle ? (
              <View style={styles.projectBlock}>
                <Text style={styles.projectLabel}>Building</Text>
                <Text style={styles.projectTitle}>
                  {candidate.projectTitle}
                </Text>
                {candidate.projectDescription ? (
                  <Text style={styles.projectDesc}>
                    {candidate.projectDescription}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {candidate.bio ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>About</Text>
                <Text style={styles.body}>{candidate.bio}</Text>
              </View>
            ) : null}

            {/* Links — LinkedIn (always when present) and Resume (when
                the candidate uploaded one). Both open externally. */}
            {(candidate.linkedinUrl || candidate.resumePath) && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Links</Text>
                {candidate.linkedinUrl ? (
                  <Pressable
                    onPress={() => {
                      const url = candidate.linkedinUrl.startsWith("http")
                        ? candidate.linkedinUrl
                        : `https://${candidate.linkedinUrl}`;
                      Linking.openURL(url).catch(() =>
                        Alert.alert("Couldn't open", url),
                      );
                    }}
                    style={({ pressed }) => [
                      styles.linkBtn,
                      pressed && { backgroundColor: theme.bgAlt },
                    ]}
                  >
                    <LinkIcon size={16} color={theme.gold} strokeWidth={2} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.linkBtnTitle}>LinkedIn</Text>
                      <Text style={styles.linkBtnSub} numberOfLines={1}>
                        {candidate.linkedinUrl.replace(/^https?:\/\//, "")}
                      </Text>
                    </View>
                    <ExternalLink size={14} color={theme.textDim} />
                  </Pressable>
                ) : null}
                {candidate.resumePath ? (
                  <Pressable
                    onPress={async () => {
                      const url = await getResumeUrl(candidate.resumePath);
                      if (!url) {
                        Alert.alert(
                          "Resume unavailable",
                          "Couldn't fetch this resume right now.",
                        );
                        return;
                      }
                      Linking.openURL(url).catch(() =>
                        Alert.alert("Couldn't open the resume."),
                      );
                    }}
                    style={({ pressed }) => [
                      styles.linkBtn,
                      pressed && { backgroundColor: theme.bgAlt },
                    ]}
                  >
                    <FileText size={16} color={theme.gold} strokeWidth={2} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.linkBtnTitle}>Resume</Text>
                      <Text style={styles.linkBtnSub} numberOfLines={1}>
                        {candidate.resumeName || "Open resume"}
                      </Text>
                    </View>
                    <ExternalLink size={14} color={theme.textDim} />
                  </Pressable>
                ) : null}
              </View>
            )}

            {/* Hint */}
            <View style={styles.hint}>
              <ChevronDown size={14} color={theme.textDim} />
              <Text style={styles.hintText}>Swipe down to close</Text>
            </View>
          </ScrollView>

          {/* Role-aware CTA pinned to the bottom of the sheet.
              Builder viewing a founder → "Apply" (apply to their
                startup project — mirrors the web ApplyDialog).
              Founder viewing a builder → "Request chat" (open a thread
                to recruit them). */}
          <View style={styles.ctaWrap}>
            <Pressable
              onPress={onCtaPress}
              style={({ pressed }) => [
                styles.cta,
                pressed && { backgroundColor: theme.goldDeep },
              ]}
            >
              {role === "builder" ? (
                <Send size={16} color={theme.textOnPrimary} strokeWidth={2.2} />
              ) : (
                <MessageCircle size={16} color={theme.textOnPrimary} strokeWidth={2.2} />
              )}
              <Text style={styles.ctaText}>
                {role === "builder" ? "Apply" : "Request chat"}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const makeStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    sheet: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 80,
      bottom: 0,
      backgroundColor: theme.bgElev,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      shadowColor: "#000000",
      shadowOpacity: 0.32,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: -10 },
      elevation: 20,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.borderSoft,
      marginTop: 10,
      marginBottom: 6,
    },
    scroll: {
      padding: 20,
      // Generous bottom padding so the last content row clears both
      // the pinned CTA (bottom: 110, height: 52) and the floating tab
      // bar (bottom: 24, height: 68) underneath it.
      paddingBottom: 220,
      gap: 16,
    },
    image: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 18,
      backgroundColor: theme.bgAlt,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    name: {
      flex: 1,
      fontSize: 26,
      fontWeight: "700",
      letterSpacing: -0.4,
      color: theme.text,
      lineHeight: 28,
      fontFamily: fonts.display,
    },
    matchPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: theme.goldGlow,
      borderWidth: 1,
      borderColor: theme.goldSoft,
    },
    matchPillText: {
      color: theme.gold,
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 1.2,
      fontWeight: "600",
    },

    pills: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      height: 28,
      paddingHorizontal: 11,
      borderRadius: 999,
      borderWidth: 1,
    },
    pillText: {
      fontSize: 12,
      fontWeight: "500",
    },
    pillCommitment: {
      backgroundColor: theme.goldGlow,
      borderColor: theme.goldSoft,
    },
    pillLocation: {
      backgroundColor: theme.goldGlow,
      borderColor: theme.goldSoft,
    },
    pillSkill: {
      backgroundColor: theme.bgAlt,
      borderColor: theme.border,
    },

    section: {
      gap: 6,
    },
    sectionLabel: {
      color: theme.gold,
      fontFamily: fonts.mono,
      fontSize: 10,
      letterSpacing: 1.6,
      textTransform: "uppercase",
    },
    body: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
    },
    projectBlock: {
      padding: 14,
      borderWidth: 1,
      borderColor: theme.goldSoft,
      backgroundColor: theme.goldGlow,
      borderRadius: 14,
      gap: 6,
    },
    projectLabel: {
      color: theme.gold,
      fontFamily: fonts.mono,
      fontSize: 10,
      letterSpacing: 1.6,
      textTransform: "uppercase",
    },
    projectTitle: {
      color: theme.text,
      fontFamily: fonts.display,
      fontSize: 18,
      letterSpacing: -0.2,
    },
    projectDesc: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
    },
    linkBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bgElev,
      borderRadius: 12,
      marginTop: 4,
    },
    linkBtnTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: -0.1,
    },
    linkBtnSub: {
      color: theme.textMuted,
      fontFamily: fonts.mono,
      fontSize: 11,
      marginTop: 1,
    },

    hint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "center",
      marginTop: 12,
    },
    hintText: {
      color: theme.textDim,
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },

    // Pinned CTA — lifted above the floating tab bar (which sits at
    // bottom: 24 with height 68 ⇒ tops out at bottom: 92). Sitting at
    // bottom: 110 keeps the button clear of the tab bar with ~18px
    // breathing room.
    ctaWrap: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 110,
    },
    cta: {
      width: "100%",
      height: 52,
      borderRadius: 14,
      backgroundColor: theme.gold,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: theme.gold,
      shadowOpacity: 0.4,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    ctaText: {
      color: theme.textOnPrimary,
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: -0.05,
    },
  });
