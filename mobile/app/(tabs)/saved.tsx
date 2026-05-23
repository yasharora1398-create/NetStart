/**
 * Saved tab — role-aware list of bookmarked items.
 *
 * Founder POV → list of candidates the user saved while matching.
 * Source: local saved-people store + Supabase merge
 * from each project's savedPersonIds.
 * Partner POV → list of projects the user bookmarked from Search /
 * Project Detail. Source: local saved-projects store.
 * Partners can also star ONE project as their current
 * focus, which mirrors the founder-side active-project
 * picker semantically: it's the project they'd point
 * somebody at if asked "what are you working on?".
 *
 * Rows are compact horizontal rectangles with avatar, title, and pills.
 * Tab badge clears on focus via `clearUnread("saved")`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
 ActivityIndicator,
 Alert,
 FlatList,
 Image,
 Pressable,
 StyleSheet,
 Text,
 View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
 Bookmark,
 Briefcase,
 Clock,
 MapPin,
 Search as SearchIcon,
 Sparkles,
 Star,
 User,
 X,
} from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import {
 getAvatarUrl,
 getCandidatesByIds,
 listProjects,
 requestChat,
} from "@/lib/api";
import type { Candidate, PublicProject } from "@/lib/types";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { addSavedMany, useSavedItems } from "@/lib/savedCount";
import {
 removeSavedProject,
 setActiveSavedProject,
 useActiveSavedProjectId,
 useSavedProjects,
} from "@/lib/savedProjects";
import { clearUnread } from "@/lib/unread";
import { addSentRequest } from "@/lib/sentRequests";
import { CandidateDetail } from "@/components/CandidateDetail";
import { ApplyDialog } from "@/components/ApplyDialog";
import { MothEmptyState } from "@/components/MothEmptyState";
import { MothLoader } from "@/components/MothLoader";
import { readMetadataRole, type Role } from "@/lib/userRole";
import { confirm } from "@/lib/confirm";

type RankedCandidate = Candidate & { similarity: number };

export default function SavedScreen() {
 const { theme } = useTheme();
 // Clear the tab badge whenever the user lands on Saved.
 useFocusEffect(
 useCallback(() => {
 clearUnread("saved");
 }, []),
 );
 const styles = useMemo(() => makeStyles(theme), [theme]);
 const { user } = useAuth();
 // Viewer's role: read from user_metadata.role; for legacy users with
 // no role set, fall back to projects.length > 0 ⇒ founder.
 const [hasProjects, setHasProjects] = useState(false);
 const userRole: Role = useMemo(
 () => readMetadataRole(user) ?? (hasProjects ? "founder" : "partner"),
 [user, hasProjects],
 );

 // For founders, we still need to fetch their projects to merge
 // server-saved candidates into the local store. The fetch also
 // determines the legacy-fallback role for users with no metadata.
 const [loadingRemote, setLoadingRemote] = useState(false);
 useEffect(() => {
 if (!user) return;
 let cancelled = false;
 setLoadingRemote(true);
 (async () => {
 try {
 const ps = await listProjects(user.id);
 if (!cancelled) setHasProjects(ps.length > 0);
 const ids = new Set<string>();
 for (const p of ps) for (const id of p.savedPersonIds) ids.add(id);
 if (ids.size === 0) return;
 const candidates = await getCandidatesByIds(Array.from(ids));
 if (!cancelled) addSavedMany(candidates);
 } catch {
 // silent — local items still render
 } finally {
 if (!cancelled) setLoadingRemote(false);
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [user]);

 return userRole === "partner" ? (
 <PartnerSavedView styles={styles} theme={theme} />
 ) : (
 <FounderSavedView
 styles={styles}
 theme={theme}
 loadingRemote={loadingRemote}
 userRole={userRole}
 />
 );
}

// ────────────────────────────────────────────────────────────────
// Partner POV — saved projects.
// ────────────────────────────────────────────────────────────────

const PartnerSavedView = ({
 styles,
 theme,
}: {
 styles: ReturnType<typeof makeStyles>;
 theme: ThemePalette;
}) => {
 const router = useRouter();
 const projects = useSavedProjects();
 const activeId = useActiveSavedProjectId();

 const handleUnsave = (project: PublicProject) => {
 confirm({
 title: "Remove from saved?",
 message: `${project.title} won't appear in your shortlist anymore.`,
 confirmLabel: "Remove",
 destructive: true,
 onConfirm: () => removeSavedProject(project.id),
 });
 };

 return (
 <SafeAreaView style={styles.safe} edges={["top"]}>
 <View style={styles.header}>
 <View style={styles.eyebrow}>
 <Bookmark size={12} color={theme.gold} />
 <Text style={styles.eyebrowText}>Saved</Text>
 </View>
 <Text style={styles.h1}>Your shortlist.</Text>
 <Text style={styles.sub}>
 Projects you might want to join. Tap the star to mark one as your
 current focus.
 </Text>
 </View>

 {projects.length === 0 ? (
 <MothEmptyState
 variant="saves"
 title="No saved projects yet."
 sub="Open Search and tap the bookmark on any project to save it. Saved projects land here so you can revisit the ones worth a second look."
 />
 ) : (
 <FlatList
 data={projects}
 keyExtractor={(p) => p.id}
 contentContainerStyle={styles.list}
 renderItem={({ item }) => (
 <SavedProjectRow
 project={item}
 isActive={item.id === activeId}
 onPress={() => router.push(`/project/${item.id}` as never)}
 onToggleActive={() => setActiveSavedProject(item.id)}
 onUnsave={() => handleUnsave(item)}
 styles={styles}
 theme={theme}
 />
 )}
 />
 )}
 </SafeAreaView>
 );
};

const SavedProjectRow = ({
 project,
 isActive,
 onPress,
 onToggleActive,
 onUnsave,
 styles,
 theme,
}: {
 project: PublicProject;
 isActive: boolean;
 onPress: () => void;
 onToggleActive: () => void;
 onUnsave: () => void;
 styles: ReturnType<typeof makeStyles>;
 theme: ThemePalette;
}) => {
 const founderUrl = getAvatarUrl(project.founderAvatarPath);
 return (
 <Pressable
 onPress={onPress}
 style={({ pressed }) => [
 styles.row,
 isActive && styles.rowActive,
 pressed && { backgroundColor: theme.bgAlt },
 ]}
 >
 <View style={styles.avatarBox}>
 {founderUrl ? (
 <Image source={{ uri: founderUrl }} style={styles.avatar} />
 ) : (
 <View style={styles.avatarFallback}>
 <Sparkles size={18} color={theme.gold} />
 </View>
 )}
 </View>

 <View style={styles.body}>
 <View style={styles.titleRow}>
 <Text style={styles.name} numberOfLines={1}>
 {project.title}
 </Text>
 {isActive ? (
 <View style={styles.focusPill}>
 <Star size={9} color={theme.gold} fill={theme.gold} />
 <Text style={styles.focusPillText}>Focus</Text>
 </View>
 ) : null}
 </View>
 {project.founderFullName ? (
 <Text style={styles.subline} numberOfLines={1}>
 {project.founderFullName}
 </Text>
 ) : null}
 {project.description ? (
 <Text style={styles.desc} numberOfLines={2}>
 {project.description}
 </Text>
 ) : null}
 <View style={styles.pills}>
 {project.businessType ? (
 <View style={[styles.pill, styles.pillCommitment]}>
 <Briefcase size={9} color={theme.gold} strokeWidth={2} />
 <Text style={[styles.pillText, { color: theme.gold }]}>
 {project.businessType}
 </Text>
 </View>
 ) : null}
 {project.criteria.commitment ? (
 <View style={[styles.pill, styles.pillCommitment]}>
 <Clock size={9} color={theme.marigold} strokeWidth={2} />
 <Text style={[styles.pillText, { color: theme.marigold }]}>
 {project.criteria.commitment}
 </Text>
 </View>
 ) : null}
 {project.criteria.location ? (
 <View style={[styles.pill, styles.pillLocation]}>
 <MapPin size={9} color={theme.sageDeep} strokeWidth={2} />
 <Text style={[styles.pillText, { color: theme.sageDeep }]}>
 {project.criteria.location}
 </Text>
 </View>
 ) : null}
 {project.criteria.skills.slice(0, 2).map((s) => (
 <View key={s} style={[styles.pill, styles.pillSkill]}>
 <Text style={[styles.pillText, { color: theme.textMuted }]}>
 {s}
 </Text>
 </View>
 ))}
 </View>
 </View>

 <View style={styles.rowActions}>
 <Pressable
 onPress={onToggleActive}
 hitSlop={8}
 style={({ pressed }) => [
 styles.iconBtn,
 isActive && styles.iconBtnActive,
 pressed && { opacity: 0.7 },
 ]}
 >
 <Star
 size={14}
 color={isActive ? theme.gold : theme.textDim}
 fill={isActive ? theme.gold : "transparent"}
 strokeWidth={2}
 />
 </Pressable>
 <Pressable
 onPress={onUnsave}
 hitSlop={8}
 style={({ pressed }) => [
 styles.iconBtn,
 pressed && { opacity: 0.7 },
 ]}
 >
 <X size={14} color={theme.textDim} strokeWidth={2} />
 </Pressable>
 </View>
 </Pressable>
 );
};

// ────────────────────────────────────────────────────────────────
// Founder POV — saved candidates (existing behavior).
// ────────────────────────────────────────────────────────────────

const FounderSavedView = ({
 styles,
 theme,
 loadingRemote,
 userRole,
}: {
 styles: ReturnType<typeof makeStyles>;
 theme: ThemePalette;
 loadingRemote: boolean;
 userRole: Role;
}) => {
 const router = useRouter();
 const items = useSavedItems();
 const [selected, setSelected] = useState<Candidate | null>(null);
 const [applyTo, setApplyTo] = useState<Candidate | null>(null);

 return (
 <SafeAreaView style={styles.safe} edges={["top"]}>
 <View style={styles.header}>
 <View style={styles.eyebrow}>
 <Bookmark size={12} color={theme.gold} />
 <Text style={styles.eyebrowText}>Saved</Text>
 </View>
 <Text style={styles.h1}>Your shortlist.</Text>
 <Text style={styles.sub}>
 People you've saved while matching. Tap any to see the full profile.
 </Text>
 </View>

 {items.length === 0 ? (
 loadingRemote ? (
 <View style={styles.center}>
 <MothLoader size={160} />
 </View>
 ) : (
 <MothEmptyState
 variant="saves"
 title="No saves yet."
 sub="Open the Match tab and swipe left on candidates you want to come back to. They land here."
 />
 )
 ) : (
 <FlatList
 data={items}
 keyExtractor={(c) => c.userId}
 contentContainerStyle={styles.list}
 renderItem={({ item }) => (
 <SavedCandidateRow
 candidate={item}
 onPress={() => setSelected(item)}
 styles={styles}
 theme={theme}
 />
 )}
 />
 )}

 {selected && (
 <CandidateDetail
 candidate={{ ...selected, similarity: 0 } as RankedCandidate}
 role={userRole}
 onClose={() => setSelected(null)}
 onCtaPress={() => {
 const target = selected;
 if (userRole === "partner") {
 setSelected(null);
 setApplyTo(target);
 return;
 }
 addSentRequest(target, "chat");
 requestChat(target.userId, null).catch(() => {
 // Silent - local row still renders.
 });
 setSelected(null);
 router.push(`/chat/${target.userId}?intro=1` as never);
 }}
 />
 )}

 {applyTo && (
 <ApplyDialog
 candidate={applyTo}
 onClose={() => setApplyTo(null)}
 />
 )}
 </SafeAreaView>
 );
};

const SavedCandidateRow = ({
 candidate,
 onPress,
 styles,
 theme,
}: {
 candidate: Candidate;
 onPress: () => void;
 styles: ReturnType<typeof makeStyles>;
 theme: ThemePalette;
}) => {
 const url =
 candidate.avatarPath?.startsWith("http")
 ? candidate.avatarPath
 : getAvatarUrl(candidate.avatarPath);

 return (
 <Pressable
 onPress={onPress}
 style={({ pressed }) => [
 styles.row,
 pressed && { backgroundColor: theme.bgAlt },
 ]}
 >
 <View style={styles.avatarBox}>
 {url ? (
 <Image source={{ uri: url }} style={styles.avatar} />
 ) : (
 <View style={styles.avatarFallback}>
 <User size={22} color={theme.textDim} strokeWidth={1.5} />
 </View>
 )}
 </View>

 <View style={styles.body}>
 <Text style={styles.name} numberOfLines={1}>
 {candidate.fullName || "Unnamed"}
 </Text>
 <View style={styles.pills}>
 {candidate.commitment ? (
 <View style={[styles.pill, styles.pillCommitment]}>
 <Clock size={9} color={theme.marigold} strokeWidth={2} />
 <Text style={[styles.pillText, { color: theme.marigold }]}>
 {candidate.commitment}
 </Text>
 </View>
 ) : null}
 {candidate.location ? (
 <View style={[styles.pill, styles.pillLocation]}>
 <MapPin size={9} color={theme.sageDeep} strokeWidth={2} />
 <Text style={[styles.pillText, { color: theme.sageDeep }]}>
 {candidate.location}
 </Text>
 </View>
 ) : null}
 {candidate.skills.slice(0, 2).map((s) => (
 <View key={s} style={[styles.pill, styles.pillSkill]}>
 <Text style={[styles.pillText, { color: theme.textMuted }]}>
 {s}
 </Text>
 </View>
 ))}
 </View>
 </View>
 </Pressable>
 );
};

const makeStyles = (theme: ThemePalette) =>
 StyleSheet.create({
 safe: { flex: 1, backgroundColor: theme.bg },
 header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
 center: { flex: 1, alignItems: "center", justifyContent: "center" },

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
 letterSpacing: 2,
 textTransform: "uppercase",
 },
 h1: {
 color: theme.text,
 fontSize: 32,
 fontFamily: fonts.display,
 marginBottom: 6,
 letterSpacing: -0.5,
 },
 sub: { color: theme.textMuted, fontSize: 13, lineHeight: 19 },

 list: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 6 },

 // Compact horizontal row.
 row: {
 flexDirection: "row",
 alignItems: "center",
 gap: 12,
 padding: 10,
 backgroundColor: theme.bgElev,
 borderWidth: 1,
 borderColor: theme.border,
 borderRadius: 14,
 marginBottom: 8,
 },
 rowActive: {
 borderColor: theme.goldSoft,
 backgroundColor: theme.goldGlow,
 },
 avatarBox: {
 width: 56,
 height: 56,
 flexShrink: 0,
 },
 avatar: {
 width: 56,
 height: 56,
 borderRadius: 12,
 },
 avatarFallback: {
 width: 56,
 height: 56,
 borderRadius: 12,
 backgroundColor: theme.bgAlt,
 alignItems: "center",
 justifyContent: "center",
 },
 body: {
 flex: 1,
 gap: 4,
 },
 titleRow: {
 flexDirection: "row",
 alignItems: "center",
 gap: 8,
 },
 name: {
 color: theme.text,
 fontFamily: fonts.display,
 fontSize: 16,
 flexShrink: 1,
 },
 subline: {
 color: theme.textDim,
 fontSize: 11.5,
 fontFamily: fonts.mono,
 letterSpacing: 0.4,
 },
 desc: {
 color: theme.textMuted,
 fontSize: 12,
 lineHeight: 16,
 },

 focusPill: {
 flexDirection: "row",
 alignItems: "center",
 gap: 3,
 paddingHorizontal: 6,
 paddingVertical: 2,
 borderRadius: 999,
 borderWidth: 1,
 borderColor: theme.goldSoft,
 backgroundColor: theme.bg,
 },
 focusPillText: {
 color: theme.gold,
 fontSize: 9,
 fontFamily: fonts.mono,
 letterSpacing: 1.2,
 textTransform: "uppercase",
 },

 rowActions: {
 flexDirection: "column",
 alignItems: "center",
 gap: 6,
 paddingLeft: 4,
 },
 iconBtn: {
 width: 28,
 height: 28,
 borderRadius: 8,
 alignItems: "center",
 justifyContent: "center",
 borderWidth: 1,
 borderColor: theme.border,
 backgroundColor: theme.bg,
 },
 iconBtnActive: {
 borderColor: theme.goldSoft,
 backgroundColor: theme.goldGlow,
 },

 pills: {
 flexDirection: "row",
 flexWrap: "wrap",
 gap: 5,
 },
 pill: {
 flexDirection: "row",
 alignItems: "center",
 gap: 4,
 height: 22,
 paddingHorizontal: 8,
 borderRadius: 999,
 borderWidth: 1,
 },
 pillText: {
 fontSize: 10,
 fontWeight: "500",
 letterSpacing: 0.05,
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

 empty: {
 alignItems: "center",
 padding: 40,
 justifyContent: "center",
 flex: 1,
 },
 emptyTitle: {
 color: theme.text,
 fontFamily: fonts.display,
 fontSize: 22,
 marginTop: 12,
 marginBottom: 8,
 },
 emptyBody: {
 color: theme.textMuted,
 fontSize: 13,
 textAlign: "center",
 lineHeight: 19,
 maxWidth: 320,
 },
 });
