/**
 * Full-screen overlay shown to users whose MyNet submission is
 * `pending` or `rejected`. The rest of the app is unusable until they
 * either get approved or dismiss to update their credentials. The
 * overlay is intentionally blocking - the entire experience past
 * sign-in is gated on review status.
 *
 * Renders three steps:
 *   1. Submitted [date/time]              - always green check
 *   2. Being reviewed                     - active when pending,
 *                                            green check when accepted
 *                                            or rejected
 *   3. Accepted (green check) OR
 *      Declined (X) + "Show reviewer note" button which expands the
 *      stored review_reason inline + an "Update credentials" CTA so
 *      the user can resubmit.
 *
 * Backdrop is a BlurView over whatever is mounted underneath, so the
 * existing app screen ghosts through but isn't readable.
 */
import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { ArrowRight, Check, ChevronDown, LogOut, Pencil, X } from "lucide-react-native";

import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { useAuth } from "@/lib/auth";
import { confirmSignOut } from "@/lib/confirmSignOut";
import type { ReviewStatus } from "@/lib/types";

const formatSubmittedAt = (iso: string | null): string => {
  if (!iso) return "Just now";
  const d = new Date(iso);
  // Mon, May 9 - 2:14 PM
  const date = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} - ${time}`;
};

export const ReviewStatusOverlay = ({
  status,
  submittedAt,
  reviewedAt,
  reviewReason,
  onContinue,
}: {
  status: ReviewStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewReason: string | null;
  // Fires when an `accepted` user taps "Continue". The parent uses
  // this to dismiss the overlay and remember it shouldn't reopen.
  onContinue?: () => void;
}) => {
  const { theme, mode } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const { signOut } = useAuth();
  const [noteOpen, setNoteOpen] = useState(false);

  const isRejected = status === "rejected";
  const isAccepted = status === "accepted";

  // Status pill color for the third step.
  const thirdStepIcon = isAccepted ? (
    <Check size={14} color="#FFFFFF" strokeWidth={3} />
  ) : isRejected ? (
    <X size={14} color="#FFFFFF" strokeWidth={3} />
  ) : (
    <View style={styles.dotPending} />
  );

  return (
    <View style={styles.absoluteFill} pointerEvents="auto">
      <BlurView
        intensity={mode === "dark" ? 60 : 50}
        tint={mode === "dark" ? "dark" : "light"}
        style={styles.absoluteFill}
      />
      <View style={styles.dim} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>MyNet review</Text>
            <Text style={styles.title}>
              {isRejected
                ? "Resubmit when you're ready."
                : isAccepted
                  ? "You're in."
                  : "We're reviewing your profile."}
            </Text>
            <Text style={styles.body}>
              {isRejected
                ? "We took a look and held off this round. Read the note below, update what's needed, and resubmit."
                : isAccepted
                  ? "Welcome to Polln8. Tap continue to start matching."
                  : "Most reviews clear within 24 hours. We'll notify you when there's a decision."}
            </Text>

            {/* Step 1 - Submitted */}
            <Step
              n={1}
              done
              title="Submitted"
              subtitle={formatSubmittedAt(submittedAt)}
              theme={theme}
              styles={styles}
              icon={<Check size={14} color="#FFFFFF" strokeWidth={3} />}
              connectorActive
            />

            {/* Step 2 - Being reviewed (active if pending; checked
                if a decision has landed). */}
            <Step
              n={2}
              done={isAccepted || isRejected}
              active={status === "pending"}
              title="Being reviewed"
              subtitle={
                isAccepted || isRejected
                  ? formatSubmittedAt(reviewedAt)
                  : "Usually under 24 hours"
              }
              theme={theme}
              styles={styles}
              icon={
                isAccepted || isRejected ? (
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <View style={styles.dotPending} />
                )
              }
              connectorActive={isAccepted || isRejected}
            />

            {/* Step 3 - decision */}
            <Step
              n={3}
              done={isAccepted}
              rejected={isRejected}
              active={false}
              title={
                isAccepted ? "Accepted" : isRejected ? "Declined" : "Decision"
              }
              subtitle={null}
              theme={theme}
              styles={styles}
              icon={thirdStepIcon}
              connectorActive={false}
              isLast
            />

            {/* Rejected: reviewer note (collapsible) + Update CTA */}
            {isRejected && (
              <View style={styles.rejectedBlock}>
                <Pressable
                  onPress={() => setNoteOpen((o) => !o)}
                  style={({ pressed }) => [
                    styles.noteBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.noteBtnText}>
                    {noteOpen ? "Hide reviewer note" : "Show reviewer note"}
                  </Text>
                  <ChevronDown
                    size={14}
                    color={theme.destructive}
                    style={{
                      transform: [{ rotate: noteOpen ? "180deg" : "0deg" }],
                    }}
                  />
                </Pressable>
                {noteOpen && (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteText}>
                      {reviewReason || "No reason provided."}
                    </Text>
                  </View>
                )}
                <Pressable
                  onPress={() =>
                    router.push("/edit-credentials" as never)
                  }
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Pencil size={14} color={theme.textOnPrimary} />
                  <Text style={styles.primaryBtnText}>
                    Update credentials
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Accepted: green Continue button. Tapping it dismisses
                the overlay for good (parent persists this so it
                doesn't reopen on next app launch). */}
            {isAccepted && onContinue && (
              <Pressable
                onPress={onContinue}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && { opacity: 0.85 },
                  { marginTop: 4 },
                ]}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
                <ArrowRight size={14} color={theme.textOnPrimary} />
              </Pressable>
            )}

            {/* Sign-out escape hatch. We don't otherwise dismiss the
                overlay for pending users - the whole point is to gate
                the app behind review. Hidden once accepted (the
                Continue button takes its slot). */}
            {!isAccepted && (
              <Pressable
                onPress={() => confirmSignOut(signOut)}
                style={({ pressed }) => [
                  styles.signOutBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <LogOut size={13} color={theme.textMuted} />
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

// ────────────────────────────────────────────────────────────────
// Single timeline step. Handles three states (done, active, idle)
// and an optional rejected-X variant for the final step.
// ────────────────────────────────────────────────────────────────
const Step = ({
  n,
  done,
  active,
  rejected,
  title,
  subtitle,
  icon,
  styles,
  theme,
  connectorActive,
  isLast,
}: {
  n: number;
  done?: boolean;
  active?: boolean;
  rejected?: boolean;
  title: string;
  subtitle: string | null;
  icon: React.ReactNode;
  styles: ReturnType<typeof makeStyles>;
  theme: ThemePalette;
  connectorActive: boolean;
  isLast?: boolean;
}) => (
  <View style={styles.stepRow}>
    <View style={styles.stepGutter}>
      <View
        style={[
          styles.stepDot,
          done
            ? styles.stepDotDone
            : rejected
              ? styles.stepDotRejected
              : active
                ? styles.stepDotActive
                : styles.stepDotIdle,
        ]}
      >
        {icon}
      </View>
      {!isLast && (
        <View
          style={[
            styles.stepConnector,
            connectorActive && { backgroundColor: theme.gold },
          ]}
        />
      )}
    </View>
    <View style={styles.stepBody}>
      <Text
        style={[
          styles.stepTitle,
          rejected && { color: theme.destructive },
          active && { color: theme.gold },
        ]}
      >
        {n}. {title}
      </Text>
      {subtitle ? <Text style={styles.stepSubtitle}>{subtitle}</Text> : null}
    </View>
  </View>
);

const makeStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    absoluteFill: { ...StyleSheet.absoluteFillObject },
    dim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        theme.bg === "#050505" ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.35)",
    },
    safe: { flex: 1 },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: theme.bgElev,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 22,
      padding: 22,
      shadowColor: "#000000",
      shadowOpacity: 0.45,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 16 },
      elevation: 18,
    },
    eyebrow: {
      color: theme.gold,
      fontFamily: fonts.mono,
      fontSize: 10,
      letterSpacing: 1.8,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    title: {
      color: theme.text,
      fontFamily: fonts.display,
      fontSize: 24,
      letterSpacing: -0.4,
      lineHeight: 28,
      marginBottom: 8,
    },
    body: {
      color: theme.textMuted,
      fontSize: 13.5,
      lineHeight: 19,
      marginBottom: 22,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 12,
    },
    stepGutter: {
      width: 26,
      alignItems: "center",
    },
    stepDot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    stepDotDone: {
      backgroundColor: theme.gold,
    },
    stepDotActive: {
      backgroundColor: theme.gold,
    },
    stepDotIdle: {
      backgroundColor: theme.bgAlt,
      borderWidth: 1,
      borderColor: theme.border,
    },
    stepDotRejected: {
      backgroundColor: theme.destructive,
    },
    stepConnector: {
      flex: 1,
      width: 2,
      backgroundColor: theme.border,
      marginVertical: 4,
    },
    stepBody: {
      flex: 1,
      paddingTop: 2,
      paddingBottom: 18,
    },
    stepTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: -0.1,
    },
    stepSubtitle: {
      color: theme.textMuted,
      fontFamily: fonts.mono,
      fontSize: 11,
      marginTop: 3,
      letterSpacing: 0.4,
    },
    dotPending: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#FFFFFF",
    },
    rejectedBlock: {
      marginTop: 4,
      gap: 12,
    },
    noteBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: `${theme.destructive}55`,
      backgroundColor: `${theme.destructive}10`,
      borderRadius: 10,
    },
    noteBtnText: {
      color: theme.destructive,
      fontSize: 13,
      fontWeight: "600",
    },
    noteBox: {
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bgAlt,
      borderRadius: 10,
    },
    noteText: {
      color: theme.text,
      fontSize: 13.5,
      lineHeight: 19,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 46,
      borderRadius: 12,
      backgroundColor: theme.gold,
    },
    primaryBtnText: {
      color: theme.textOnPrimary,
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    signOutBtn: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 18,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    signOutText: {
      color: theme.textMuted,
      fontSize: 12,
      fontFamily: fonts.mono,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
  });
