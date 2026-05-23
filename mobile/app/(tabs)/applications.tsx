/**
 * Applications tab — role-aware list of applications.
 *
 *   • Partner: applications you sent. Each row shows the project +
 *     status (Pending / Accepted / Declined). Once a row is resolved
 *     (accepted or declined), swipe left to dismiss it from your list.
 *
 *   • Founder: applications you received across every project you own.
 *     Pending rows expose Accept / Decline buttons inline. Resolved
 *     rows can be swiped left to dismiss.
 *
 * Dismissing only hides the row for the current user — the other
 * side still sees their copy. Backed by archive_application_for_*
 * RPCs in migration 0016.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  Briefcase,
  Check,
  Clock,
  Inbox,
  Send,
  User,
  X,
} from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import {
  archiveApplicationForCandidate,
  archiveApplicationForOwner,
  getAvatarUrl,
  listMyApplications,
  listProjects,
  listReceivedApplications,
  updateApplicationStatus,
  type ReceivedApplication,
} from "@/lib/api";
import type { ApplicationStatus, OutgoingApplication } from "@/lib/types";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { readMetadataRole, type Role } from "@/lib/userRole";
import { MothEmptyState } from "@/components/MothEmptyState";
import { MothLoader } from "@/components/MothLoader";

type Tone = "pending" | "accepted" | "rejected";

const statusTone = (s: ApplicationStatus): Tone => {
  if (s === "accepted") return "accepted";
  if (s === "rejected" || s === "withdrawn") return "rejected";
  return "pending";
};

const statusLabel = (s: ApplicationStatus): string => {
  if (s === "accepted") return "Accepted";
  if (s === "rejected") return "Declined";
  if (s === "withdrawn") return "Withdrawn";
  return "Pending";
};

// Resolved = candidate can dismiss it. Pending stays in the list
// because the other side hasn't acted yet.
const isResolved = (s: ApplicationStatus): boolean =>
  s === "accepted" || s === "rejected" || s === "withdrawn";

const formatRelative = (iso: string): string => {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(t).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export default function ApplicationsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { user } = useAuth();

  // Determine role: metadata first, projects-existence as fallback.
  const [hasProjects, setHasProjects] = useState(false);
  const role: Role = useMemo(
    () => readMetadataRole(user) ?? (hasProjects ? "founder" : "partner"),
    [user, hasProjects],
  );

  const [outgoing, setOutgoing] = useState<OutgoingApplication[]>([]);
  const [incoming, setIncoming] = useState<ReceivedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  // Tracks rows that are currently being mutated so we can disable
  // their action buttons and show a spinner.
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Cheap project lookup also tells us if the user has any
      // projects (the role fallback).
      const ps = await listProjects(user.id);
      setHasProjects(ps.length > 0);
      const isFounder =
        readMetadataRole(user) === "founder" || ps.length > 0;
      if (isFounder) {
        const rows = await listReceivedApplications();
        setIncoming(rows);
      } else {
        const rows = await listMyApplications();
        setOutgoing(rows);
      }
    } catch {
      // Silent — empty state will render. Toast surface handled in
      // mutation paths where it matters.
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  // Founder action: accept / decline a pending application.
  const reviewApplication = useCallback(
    async (id: string, status: "accepted" | "rejected") => {
      setBusyId(id);
      try {
        await updateApplicationStatus(id, status);
        void Haptics.notificationAsync(
          status === "accepted"
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
        setIncoming((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a)),
        );
      } catch (err) {
        Alert.alert(
          "Couldn't update",
          err instanceof Error ? err.message : "Try again in a moment.",
        );
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  // Either side: dismiss a resolved row from this user's view.
  const dismiss = useCallback(
    async (id: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Optimistic remove — the RPC is per-user so the other side is
      // unaffected. If it fails we reload to restore.
      if (role === "founder") {
        setIncoming((prev) => prev.filter((a) => a.id !== id));
      } else {
        setOutgoing((prev) => prev.filter((a) => a.id !== id));
      }
      try {
        if (role === "founder") {
          await archiveApplicationForOwner(id);
        } else {
          await archiveApplicationForCandidate(id);
        }
      } catch {
        void load();
      }
    },
    [role, load],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <MothLoader size={160} />
        </View>
      </SafeAreaView>
    );
  }

  const isFounder = role === "founder";
  const isEmpty = isFounder ? incoming.length === 0 : outgoing.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.eyebrow}>
          {isFounder ? (
            <Inbox size={12} color={theme.gold} />
          ) : (
            <Send size={12} color={theme.gold} />
          )}
          <Text style={styles.eyebrowText}>
            {isFounder ? "Received" : "Sent"}
          </Text>
        </View>
        <Text style={styles.h1}>
          {isFounder ? "Applications." : "Your applications."}
        </Text>
        <Text style={styles.sub}>
          {isFounder
            ? "Partners applying to your projects. Accept the ones you want to talk to."
            : "Projects you've applied to. Swipe left on a resolved one to clear it."}
        </Text>
      </View>

      {isEmpty ? (
        <EmptyState role={role} />
      ) : isFounder ? (
        <FlatList
          data={incoming}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ReceivedRow
              item={item}
              busy={busyId === item.id}
              onAccept={() => reviewApplication(item.id, "accepted")}
              onDecline={() => reviewApplication(item.id, "rejected")}
              onDismiss={() => dismiss(item.id)}
              styles={styles}
              theme={theme}
            />
          )}
        />
      ) : (
        <FlatList
          data={outgoing}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SentRow
              item={item}
              onDismiss={() => dismiss(item.id)}
              styles={styles}
              theme={theme}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────
// Partner row: outgoing application
// ────────────────────────────────────────────────────────────────

const SentRow = ({
  item,
  onDismiss,
  styles,
  theme,
}: {
  item: OutgoingApplication;
  onDismiss: () => void;
  styles: ReturnType<typeof makeStyles>;
  theme: ThemePalette;
}) => {
  const tone = statusTone(item.status);
  const resolved = isResolved(item.status);
  const headline = item.projectTitle || "Untitled project";
  const founderName =
    item.status === "accepted" && item.founderFullName
      ? item.founderFullName
      : null;
  return (
    <SwipeRow enabled={resolved} onDelete={onDismiss} theme={theme}>
      <View style={styles.cardOuter}>
        <View style={styles.row}>
          <View style={[styles.iconBox, styles.iconProject]}>
            <Briefcase size={18} color={theme.gold} strokeWidth={1.7} />
          </View>
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>
              {founderName ?? headline}
            </Text>
            <Text style={styles.sub2} numberOfLines={1}>
              {founderName
                ? headline
                : `Applied ${formatRelative(item.createdAt)}`}
            </Text>
          </View>
          <StatusPill
            tone={tone}
            label={statusLabel(item.status)}
            theme={theme}
          />
        </View>
      </View>
    </SwipeRow>
  );
};

// ────────────────────────────────────────────────────────────────
// Founder row: incoming application
// ────────────────────────────────────────────────────────────────

const ReceivedRow = ({
  item,
  busy,
  onAccept,
  onDecline,
  onDismiss,
  styles,
  theme,
}: {
  item: ReceivedApplication;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
  styles: ReturnType<typeof makeStyles>;
  theme: ThemePalette;
}) => {
  const tone = statusTone(item.status);
  const resolved = isResolved(item.status);
  const c = item.candidate;
  const url = c.avatarPath?.startsWith("http")
    ? c.avatarPath
    : getAvatarUrl(c.avatarPath);
  return (
    <SwipeRow enabled={resolved} onDelete={onDismiss} theme={theme}>
      <View style={styles.cardOuter}>
        <View style={styles.row}>
          <View style={styles.avatarBox}>
            {url ? (
              <Image source={{ uri: url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <User size={20} color={theme.textDim} strokeWidth={1.5} />
              </View>
            )}
          </View>
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>
              {c.fullName || "Unnamed"}
            </Text>
            <Text style={styles.sub2} numberOfLines={1}>
              {item.projectTitle} · {formatRelative(item.createdAt)}
            </Text>
          </View>
          <StatusPill tone={tone} label={statusLabel(item.status)} theme={theme} />
        </View>

        {item.status === "pending" && (
          <View style={styles.actions}>
            <Pressable
              onPress={onDecline}
              disabled={busy}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionDecline,
                pressed && { opacity: 0.6 },
                busy && { opacity: 0.4 },
              ]}
            >
              <X size={14} color={theme.textMuted} strokeWidth={2.2} />
              <Text style={[styles.actionText, { color: theme.textMuted }]}>
                Decline
              </Text>
            </Pressable>
            <Pressable
              onPress={onAccept}
              disabled={busy}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionAccept,
                pressed && { opacity: 0.85 },
                busy && { opacity: 0.5 },
              ]}
            >
              <Check size={14} color={theme.textOnPrimary} strokeWidth={2.4} />
              <Text style={[styles.actionText, { color: theme.textOnPrimary }]}>
                Accept
              </Text>
            </Pressable>
          </View>
        )}

        {item.message && item.status === "pending" && (
          <Text style={styles.pitch} numberOfLines={3}>
            "{item.message}"
          </Text>
        )}
      </View>
    </SwipeRow>
  );
};

// ────────────────────────────────────────────────────────────────
// Swipe-to-delete wrapper
// ────────────────────────────────────────────────────────────────

// Pixel distance the row must be dragged left of its resting
// position before letting go triggers a delete. Anything short
// of this threshold springs the row back closed.
const DELETE_THRESHOLD = 80;
const SCREEN_W = Dimensions.get("window").width;

const SwipeRow = ({
  children,
  enabled,
  onDelete,
  theme,
}: {
  children: React.ReactNode;
  enabled: boolean;
  onDelete: () => void;
  theme: ThemePalette;
}) => {
  const tx = useSharedValue(0);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  // The red "Delete?" panel fades and scales as the user drags. At
  // the threshold it's fully visible and reads as committed.
  const labelStyle = useAnimatedStyle(() => {
    const drag = -tx.value; // positive when dragging left
    const opacity = interpolate(
      drag,
      [0, 30, DELETE_THRESHOLD],
      [0, 0.5, 1],
      "clamp",
    );
    const scale = interpolate(
      drag,
      [0, DELETE_THRESHOLD],
      [0.7, 1],
      "clamp",
    );
    return { opacity, transform: [{ scale }] };
  });

  if (!enabled) {
    // Pending rows can't be dismissed.
    return <View>{children}</View>;
  }

  const pan = Gesture.Pan()
    // Require a clear horizontal motion before claiming the gesture
    // away from the FlatList's vertical scroll.
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      // Clamp so the user can only drag left from rest.
      tx.value = Math.min(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX < -DELETE_THRESHOLD) {
        // Animate off-screen then fire the delete on the JS thread.
        tx.value = withTiming(-SCREEN_W, { duration: 180 }, (finished) => {
          if (finished) runOnJS(onDelete)();
        });
      } else {
        tx.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });

  return (
    <View style={{ position: "relative" }}>
      {/* Red "Delete?" backdrop sits behind the row and reveals as the
          row slides left. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 6,
            bottom: 6,
            left: 0,
            right: 0,
            backgroundColor: theme.destructive,
            borderRadius: 14,
            justifyContent: "center",
            alignItems: "flex-end",
            paddingRight: 22,
          },
        ]}
      >
        <Animated.Text
          style={[
            {
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: "700",
              letterSpacing: 0.4,
            },
            labelStyle,
          ]}
        >
          Delete?
        </Animated.Text>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
};

// ────────────────────────────────────────────────────────────────
// Bits
// ────────────────────────────────────────────────────────────────

const StatusPill = ({
  tone,
  label,
  theme,
}: {
  tone: Tone;
  label: string;
  theme: ThemePalette;
}) => {
  const bg =
    tone === "accepted"
      ? theme.goldGlow
      : tone === "rejected"
        ? `${theme.destructive}20`
        : theme.bgAlt;
  const fg =
    tone === "accepted"
      ? theme.gold
      : tone === "rejected"
        ? theme.destructive
        : theme.textMuted;
  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: bg,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
      }}
    >
      {tone === "pending" && <Clock size={9} color={fg} strokeWidth={2.2} />}
      {tone === "accepted" && <Check size={10} color={fg} strokeWidth={2.4} />}
      {tone === "rejected" && <X size={10} color={fg} strokeWidth={2.4} />}
      <Text
        style={{
          color: fg,
          fontSize: 10.5,
          fontWeight: "600",
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const EmptyState = ({ role }: { role: Role }) => (
  <MothEmptyState
    variant="apps"
    title={role === "founder" ? "No applications yet." : "Nothing sent yet."}
    sub={
      role === "founder"
        ? "Once partners apply to your projects, you'll see them here."
        : "Open Browse to find a project that fits, then send your first pitch."
    }
  />
);

// ────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────

const makeStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
    eyebrow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: theme.goldSoft,
      backgroundColor: theme.goldGlow,
      borderRadius: 4,
      alignSelf: "flex-start",
      marginBottom: 12,
    },
    eyebrowText: {
      color: theme.gold,
      fontSize: 11,
      fontFamily: fonts.mono,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    h1: {
      color: theme.text,
      fontSize: 30,
      fontFamily: fonts.display,
      letterSpacing: -0.6,
      lineHeight: 34,
      marginBottom: 6,
    },
    sub: {
      color: theme.textDim,
      fontSize: 13.5,
      lineHeight: 19,
      maxWidth: 320,
    },
    list: {
      paddingHorizontal: 14,
      paddingTop: 6,
      paddingBottom: 120,
    },
    cardOuter: {
      backgroundColor: theme.bgElev,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      marginVertical: 6,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    iconProject: {
      backgroundColor: theme.goldGlow,
    },
    avatarBox: {
      width: 44,
      height: 44,
      borderRadius: 22,
      overflow: "hidden",
      backgroundColor: theme.bgAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: { width: 44, height: 44 },
    avatarFallback: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    body: { flex: 1, minWidth: 0 },
    name: {
      color: theme.text,
      fontSize: 15.5,
      fontWeight: "600",
      letterSpacing: -0.2,
    },
    sub2: {
      color: theme.textDim,
      fontSize: 12.5,
      marginTop: 2,
    },
    actions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 9,
      borderRadius: 10,
    },
    actionDecline: {
      backgroundColor: theme.bgAlt,
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionAccept: {
      backgroundColor: theme.gold,
    },
    actionText: {
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.1,
    },
    pitch: {
      color: theme.textMuted,
      fontSize: 12.5,
      lineHeight: 17,
      marginTop: 10,
      fontStyle: "italic",
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 36,
      gap: 10,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    emptyBody: {
      color: theme.textDim,
      fontSize: 13.5,
      textAlign: "center",
      lineHeight: 19,
    },
  });

