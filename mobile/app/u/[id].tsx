import { useEffect, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Briefcase,
  ExternalLink,
  MapPin,
  Sparkles,
} from "lucide-react-native";

import {
  getAvatarUrl,
  getPublicFounder,
  listPublishedProjectsForOwner,
  type PublicFounder,
} from "@/lib/api";
import type { PublicProject } from "@/lib/types";
import { fonts, theme } from "@/lib/theme";

export default function FounderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [founder, setFounder] = useState<PublicFounder | null>(null);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getPublicFounder(id),
      listPublishedProjectsForOwner(id),
    ])
      .then(([f, ps]) => {
        if (cancelled) return;
        setFounder(f);
        setProjects(ps);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (!founder) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 20 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.empty}>This profile couldn't be loaded.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const url = getAvatarUrl(founder.avatarPath);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 20 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.hero}>
            {url ? (
              <Image source={{ uri: url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {(founder.fullName[0] ?? "?").toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Profile</Text>
              <Text style={styles.h1}>{founder.fullName || "Unnamed"}</Text>
              {founder.headline ? (
                <Text style={styles.headline}>{founder.headline}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.metaRow}>
            {founder.commitment ? (
              <View style={styles.metaChip}>
                <Briefcase size={11} color={theme.gold} />
                <Text style={styles.metaText}>{founder.commitment}</Text>
              </View>
            ) : null}
            {founder.location ? (
              <View style={styles.metaChip}>
                <MapPin size={11} color={theme.gold} />
                <Text style={styles.metaText}>{founder.location}</Text>
              </View>
            ) : null}
            {founder.isOpenToWork ? (
              <View style={styles.openChip}>
                <Text style={styles.openText}>Open to work</Text>
              </View>
            ) : null}
          </View>

          {founder.bio ? (
            <Section title="Pitch / Bio">
              <Text style={styles.bio}>{founder.bio}</Text>
            </Section>
          ) : null}

          {founder.skills.length > 0 ? (
            <Section title="Skills">
              <View style={styles.skillRow}>
                {founder.skills.map((s) => (
                  <View key={s} style={styles.skillChip}>
                    <Text style={styles.skillText}>{s}</Text>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          {founder.linkedinUrl ? (
            <Section title="Contact">
              <Pressable
                onPress={() => Linking.openURL(founder.linkedinUrl)}
                style={styles.linkRow}
              >
                <ExternalLink size={14} color={theme.gold} />
                <Text style={styles.linkText} numberOfLines={1}>
                  {founder.linkedinUrl}
                </Text>
                <ExternalLink size={12} color={theme.textDim} />
              </Pressable>
            </Section>
          ) : null}

          <Section
            title={`Active projects (${projects.length})`}
          >
            {projects.length === 0 ? (
              <Text style={styles.empty}>No published projects yet.</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {projects.map((p) => (
                  <View key={p.id} style={styles.projectRow}>
                    <Sparkles size={11} color={theme.gold} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.projectTitle}>{p.title}</Text>
                      {p.description ? (
                        <Text
                          style={styles.projectDesc}
                          numberOfLines={2}
                        >
                          {p.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Section>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={{ marginBottom: 22 }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  empty: { color: theme.textMuted, textAlign: "center", lineHeight: 20 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  body: { padding: 20, paddingBottom: 60 },
  hero: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.goldSoft,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: theme.gold,
    fontFamily: fonts.display,
    fontSize: 28,
  },
  eyebrow: {
    color: theme.gold,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  h1: { color: theme.text, fontFamily: fonts.display, fontSize: 26 },
  headline: { color: theme.textMuted, fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 18 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 2,
  },
  metaText: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  openChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.4)",
    backgroundColor: "rgba(52,211,153,0.1)",
    borderRadius: 2,
  },
  openText: {
    color: theme.emerald,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: theme.gold,
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  sectionBody: {
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    padding: 14,
  },
  bio: { color: theme.text, fontSize: 13, lineHeight: 19 },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  skillChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    borderRadius: 2,
  },
  skillText: { color: theme.text, fontSize: 11 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  linkText: { color: theme.gold, fontSize: 13, flex: 1 },
  projectRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 4,
  },
  projectTitle: {
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 16,
    marginBottom: 2,
  },
  projectDesc: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
});
