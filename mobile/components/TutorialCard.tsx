/**
 * Tutorial card — implementation of the Profile Tutorial.html design
 * handoff. Visually identical to a real profile card so a new user can
 * see exactly what they'll be looking at when matching.
 *
 * Card structure (top → bottom): name → square image → wrapping pills
 * (commitment / location / skills) → headline → role-aware CTA.
 *
 * Pass / Save buttons live in the parent screen at the bottom of the
 * deck — kept off the card so it has room to be readable.
 *
 * Tap the CTA to dismiss the tutorial.
 */
import { useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Clock,
  MapPin,
  MessageCircle,
  Send,
  User,
} from "lucide-react-native";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";

type Role = "founder" | "partner";

export type Rect = { x: number; y: number; width: number; height: number };

const HEADLINE =
  "Building something at the intersection of payments and AI agents. Looking for a co-founder who ships fast and thinks in systems.";

export const TutorialCard = ({
  role,
  onDismiss,
  onCardLayout,
  onCtaLayout,
  onSpecsLayout,
}: {
  role: Role;
  onDismiss: () => void;
  onCardLayout?: (r: Rect) => void;
  onCtaLayout?: (r: Rect) => void;
  onSpecsLayout?: (r: Rect) => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const ctaLabel = role === "founder" ? "Request chat" : "Apply";
  const CtaIcon = role === "founder" ? MessageCircle : Send;
  const cardRef = useRef<View>(null);
  const ctaRef = useRef<View>(null);
  const specsRef = useRef<View>(null);

  const measureRoot = () => {
    cardRef.current?.measureInWindow((x, y, width, height) => {
      onCardLayout?.({ x, y, width, height });
    });
  };
  const measureCta = () => {
    ctaRef.current?.measureInWindow((x, y, width, height) => {
      onCtaLayout?.({ x, y, width, height });
    });
  };
  const measureSpecs = () => {
    specsRef.current?.measureInWindow((x, y, width, height) => {
      onSpecsLayout?.({ x, y, width, height });
    });
  };

  return (
    <View
      ref={cardRef}
      style={styles.card}
      onLayout={measureRoot}
    >
      <Text style={styles.name}>Tutorial</Text>

      <View style={styles.image}>
        <User
          size={64}
          color={theme.textDim}
          strokeWidth={1.4}
        />
      </View>

      {/* Pills + headline grouped so the tutorial overlay can spotlight
          this whole "specifics" region in M3. */}
      <View
        ref={specsRef}
        onLayout={measureSpecs}
        style={{ gap: 14 }}
      >
        <View style={styles.pills}>
          <View style={[styles.pill, styles.pillCommitment]}>
            <Clock size={11} color={theme.marigold} strokeWidth={2} />
            <Text style={[styles.pillText, { color: theme.marigold }]}>
              Full-time
            </Text>
          </View>
          <View style={[styles.pill, styles.pillLocation]}>
            <MapPin size={11} color={theme.sageDeep} strokeWidth={2} />
            <Text style={[styles.pillText, { color: theme.sageDeep }]}>
              San Francisco
            </Text>
          </View>
          {["Frontend", "Design", "Product"].map((skill) => (
            <View key={skill} style={[styles.pill, styles.pillSkill]}>
              <Text style={[styles.pillText, { color: theme.textMuted }]}>
                {skill}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.headline}>{HEADLINE}</Text>
      </View>

      <Pressable
        ref={ctaRef as never}
        onLayout={measureCta}
        onPress={onDismiss}
        style={({ pressed }) => [
          styles.cta,
          pressed && { backgroundColor: theme.goldDeep },
        ]}
      >
        <CtaIcon size={14} color="#FFFFFF" strokeWidth={2.2} />
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
};

const makeStyles = (theme: ThemePalette) => StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 22,
    padding: 18,
    gap: 14,
    shadowColor: "#1F1008",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },

  name: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.3,
    color: theme.text,
    lineHeight: 24,
    marginHorizontal: 2,
    marginTop: 2,
    fontFamily: fonts.display,
  },

  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: theme.bgAlt,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    paddingHorizontal: 2,
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
    letterSpacing: 0.05,
  },
  pillCommitment: {
    backgroundColor: "rgba(244,162,97,0.18)",
    borderColor: "rgba(212,130,63,0.28)",
  },
  pillLocation: {
    backgroundColor: "rgba(168,181,158,0.28)",
    borderColor: "rgba(107,122,96,0.28)",
  },
  pillSkill: {
    backgroundColor: theme.bgAlt,
    borderColor: theme.border,
  },

  headline: {
    fontSize: 13.5,
    lineHeight: 19,
    color: theme.textMuted,
    paddingHorizontal: 2,
    margin: 0,
  },

  cta: {
    width: "100%",
    height: 46,
    borderRadius: 13,
    backgroundColor: theme.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: theme.gold,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    marginTop: 2,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "600",
    letterSpacing: -0.05,
  },
});
