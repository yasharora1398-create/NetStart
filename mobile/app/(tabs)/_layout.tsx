import { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import {
  Dimensions,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import {
  Bookmark,
  Flame,
  MessageCircle,
  User,
} from "lucide-react-native";
import { fonts } from "@/lib/theme";
import { useTheme } from "@/lib/themeMode";
import { scrollProgress } from "@/lib/scrollProgress";
import { useSavedCount } from "@/lib/savedCount";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getProfile, markMessagesDelivered } from "@/lib/api";
import { emptyProfile, type Profile } from "@/lib/types";
import { ReviewStatusOverlay } from "@/components/ReviewStatusOverlay";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { bumpUnread, useUnread } from "@/lib/unread";

// Per-user key for "I've already seen the acceptance celebration".
// Once dismissed, the overlay won't pop again on subsequent launches.
const ACCEPT_DISMISSED_PREFIX = "polln8.accept_dismissed.";

const { width: SCREEN_W } = Dimensions.get("window");
const BAR_W = SCREEN_W - 32; // tab bar inner width (16 each side margin)
const SHEEN_W = 90;
// Reduced travel — only ~40% of the bar's width per full scroll, so
// the sheen drifts slowly and only travels a short distance.
const TRAVEL_FACTOR = 0.4;

// Frosted-glass tab bar background. Heavily transparent body + a thin
// white rim that holds two sheens which translate as the user scrolls
// within the active screen. Sheens map scroll position directly so
// they stop the moment scrolling stops.
const TabBarBackground = ({ mode }: { mode: "light" | "dark" }) => {
  const topSheenStyle = useAnimatedStyle(() => {
    const start = (BAR_W - SHEEN_W) / 2 - (BAR_W * TRAVEL_FACTOR) / 2;
    const end = start + BAR_W * TRAVEL_FACTOR;
    const x = interpolate(scrollProgress.value, [0, 1], [start, end]);
    return { transform: [{ translateX: x }] };
  });
  const bottomSheenStyle = useAnimatedStyle(() => {
    // Opposite direction so the bar feels alive on either edge.
    const start = (BAR_W - SHEEN_W) / 2 + (BAR_W * TRAVEL_FACTOR) / 2;
    const end = start - BAR_W * TRAVEL_FACTOR;
    const x = interpolate(scrollProgress.value, [0, 1], [start, end]);
    return { transform: [{ translateX: x }] };
  });

  const rimColor =
    mode === "dark"
      ? "rgba(255, 255, 255, 0.16)"
      : "rgba(15, 20, 16, 0.10)";

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: 22, overflow: "hidden" },
      ]}
    >
      <BlurView
        intensity={mode === "dark" ? 70 : 60}
        tint={mode === "dark" ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      {/* Whisper-thin tint — much more transparent than before */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor:
              mode === "dark"
                ? "rgba(15, 22, 20, 0.10)"
                : "rgba(250, 250, 247, 0.14)",
          },
        ]}
      />
      {/* Hairline rim around the entire perimeter */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: rimColor,
        }}
      />
      {/* Sheen — top edge (scroll-driven, near-transparent white) */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            width: SHEEN_W,
            height: 1,
            backgroundColor: "rgba(255, 255, 255, 0.30)",
            shadowColor: "#FFFFFF",
            shadowOpacity: 0.25,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
          },
          topSheenStyle,
        ]}
      />
      {/* Sheen — bottom edge, opposite direction (scroll-driven) */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            width: SHEEN_W,
            height: 1,
            backgroundColor: "rgba(255, 255, 255, 0.22)",
            shadowColor: "#FFFFFF",
            shadowOpacity: 0.20,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
          },
          bottomSheenStyle,
        ]}
      />
    </View>
  );
};

export default function TabLayout() {
  const { theme, mode } = useTheme();
  const { user } = useAuth();
  const savedCount = useSavedCount();
  // Per-tab unread badges. Saved bumps when a swipe lands; Threads
  // bumps on every inbound chat_message INSERT. Both clear the moment
  // the user opens that tab (handled in the saved.tsx / threads.tsx
  // useFocusEffect).
  const savedUnread = useUnread("saved");
  const threadsUnread = useUnread("threads");

  // Profile review status drives the blocking overlay below. We poll
  // every 25s while pending so an admin acceptance auto-clears the
  // overlay without the user needing to leave + return.
  const [profile, setProfile] = useState<Profile>(emptyProfile());
  // True once the user has seen + dismissed the "Accepted" overlay.
  // Hydrated from AsyncStorage so the overlay never pops again.
  const [acceptDismissed, setAcceptDismissed] = useState(false);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const refresh = () => {
      getProfile(user.id)
        .then((p) => {
          if (!cancelled) setProfile(p);
        })
        .catch(() => {});
    };
    refresh();
    // Hydrate dismissal flag for this user.
    AsyncStorage.getItem(ACCEPT_DISMISSED_PREFIX + user.id)
      .then((v) => {
        if (!cancelled && v === "1") setAcceptDismissed(true);
      })
      .catch(() => {});
    const interval = window.setInterval(() => {
      if (
        profile.reviewStatus === "pending" ||
        profile.reviewStatus === "rejected"
      ) {
        refresh();
      }
    }, 25_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user, profile.reviewStatus]);

  const handleContinueAfterAccept = () => {
    setAcceptDismissed(true);
    if (user) {
      void AsyncStorage.setItem(ACCEPT_DISMISSED_PREFIX + user.id, "1");
    }
  };

  // Global "I'm online" subscription. Two jobs:
  //   1. Mark each new inbound message delivered, so the sender's
  //      grey-tick flips even if I never open that specific chat.
  //   2. Fire a local notification (Stage 5) so the device pings
  //      the user when a message arrives. In Expo Go this only
  //      fires while the app is foregrounded / just-backgrounded;
  //      a real dev build picks up full closed-app behaviour.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`presence:delivered:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const r = payload.new as {
            sender_id: string;
            recipient_id: string;
            body: string;
          };
          if (r.recipient_id !== user.id) return;
          void markMessagesDelivered(r.sender_id).catch(() => {});
          // Bump the Threads unread badge unless we're already on
          // that tab (covered when the user focuses Threads and
          // clearUnread runs).
          bumpUnread("threads");

          // Fire a local notification. Body is the actual message
          // text, capped so the system banner doesn't overflow. The
          // `link` data field is read by the response handler in
          // app/_layout.tsx to deep-link into the chat thread.
          const preview =
            r.body.length > 140 ? r.body.slice(0, 137) + "..." : r.body;
          void Notifications.scheduleNotificationAsync({
            content: {
              title: "New message",
              body: preview,
              data: { link: `/chat/${r.sender_id}` },
            },
            trigger: null,
          }).catch(() => {});
        },
      )
      .subscribe();

    // Stage 5 also surfaces non-message events (chat accepted,
    // future review-decision pushes) by listening for inserts on
    // `notifications` with our user_id. The accept_chat_thread RPC
    // writes one of these, so the requester gets a banner the
    // moment the recipient taps Accept.
    const notifChannel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const n = payload.new as {
            user_id: string;
            title: string;
            body: string;
            link: string | null;
          };
          if (n.user_id !== user.id) return;
          void Notifications.scheduleNotificationAsync({
            content: {
              title: n.title || "Polln8",
              body: n.body || "",
              data: n.link ? { link: n.link } : {},
            },
            trigger: null,
          }).catch(() => {});
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      void supabase.removeChannel(notifChannel);
    };
  }, [user]);

  const showOverlay =
    profile.reviewStatus === "pending" ||
    profile.reviewStatus === "rejected" ||
    (profile.reviewStatus === "accepted" && !acceptDismissed);

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.gold,
        tabBarInactiveTintColor: theme.textDim,
        tabBarBackground: () => <TabBarBackground mode={mode} />,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 24,
          height: 68,
          borderRadius: 22,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          borderWidth: 0,
          paddingTop: 10,
          paddingBottom: 10,
          shadowColor: "#000000",
          shadowOpacity: 0.18,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
          overflow: Platform.OS === "ios" ? "visible" : "hidden",
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: fonts.mono,
          letterSpacing: 1.2,
          textTransform: "uppercase",
        },
      }}
    >
      {/* Match (the swipe deck) is the discovery tab. Search is
          accessible via the magnifying-glass icon in Match's header,
          not as its own tab. Browse stays as a route but is hidden
          from the bar - we keep the file so old links don't break. */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Match",
          tabBarIcon: ({ color, size }) => <Flame size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen name="browse" options={{ href: null }} />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => (
            <Bookmark size={size - 4} color={color} />
          ),
          tabBarBadge: savedUnread > 0 ? savedUnread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.gold,
            color: theme.textOnPrimary,
            fontSize: 10,
            fontWeight: "700",
            minWidth: 16,
            height: 16,
            lineHeight: 16,
            paddingHorizontal: 4,
          },
        }}
      />
      <Tabs.Screen
        name="threads"
        options={{
          title: "Threads",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size - 4} color={color} />
          ),
          tabBarBadge: threadsUnread > 0 ? threadsUnread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.gold,
            color: theme.textOnPrimary,
            fontSize: 10,
            fontWeight: "700",
            minWidth: 16,
            height: 16,
            lineHeight: 16,
            paddingHorizontal: 4,
          },
        }}
      />
      {/* Stage 4 removed Apps. Chat requests live in Threads now. */}
      <Tabs.Screen name="applications" options={{ href: null }} />
      <Tabs.Screen
        name="mynet"
        options={{
          title: "MyNet",
          tabBarIcon: ({ color, size }) => <User size={size - 4} color={color} />,
        }}
      />
    </Tabs>
    {showOverlay && (
      <ReviewStatusOverlay
        status={profile.reviewStatus}
        submittedAt={profile.submittedAt}
        reviewedAt={profile.reviewedAt}
        reviewReason={profile.reviewReason}
        onContinue={handleContinueAfterAccept}
      />
    )}
    </>
  );
}
