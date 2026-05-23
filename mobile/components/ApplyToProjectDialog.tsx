/**
 * Partner-side application modal. Replaces the native Alert.prompt
 * that the Browse tab used to fall back on - that surface had no
 * project context, no character counter, and looked like a system
 * dialog instead of part of the app.
 *
 * Props:
 * project - the public project being applied to. The header pulls
 * title, founder name, commitment, and location from it
 * so the partner can see what they're committing to as
 * they write the pitch.
 * onClose - dismiss the modal (Cancel button or backdrop tap).
 * onSent - called after createApplication() succeeds. Parent
 * should update its local "applied" state so the row
 * flips to a Pending pill.
 *
 * Submission goes through createApplication(), which writes to the
 * applications table and is filtered by the backend RLS so duplicates
 * are caught (a friendly error pops up if the user tries to re-apply).
 */
import { useMemo, useState } from "react";
import {
 ActivityIndicator,
 Alert,
 Image,
 KeyboardAvoidingView,
 Platform,
 Pressable,
 StyleSheet,
 Text,
 TextInput,
 View,
} from "react-native";
import { BlurView } from "expo-blur";
import { Briefcase, MapPin, Send, User, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useRouter } from "expo-router";

import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { createApplication, getAvatarUrl, getProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { PublicProject } from "@/lib/types";

const MIN_PITCH = 10;
const MAX_PITCH = 500;

export const ApplyToProjectDialog = ({
 project,
 onClose,
 onSent,
}: {
 project: PublicProject | null;
 onClose: () => void;
 onSent: () => void;
}) => {
 const { theme, mode } = useTheme();
 const { user } = useAuth();
 const router = useRouter();
 const styles = useMemo(() => makeStyles(theme), [theme]);
 const [message, setMessage] = useState("");
 const [submitting, setSubmitting] = useState(false);

 if (!project) return null;

 const founderUrl = getAvatarUrl(project.founderAvatarPath);

 const submit = async () => {
 const note = message.trim();
 if (note.length < MIN_PITCH) {
 Alert.alert(
 "Pitch is too short",
 `At least ${MIN_PITCH} characters. Tell them why you want in.`,
 );
 return;
 }
 if (!user) {
 Alert.alert("Sign in required", "Sign in to apply to projects.");
 return;
 }
 setSubmitting(true);
 try {
 // Gate apply on a minimally-complete candidate profile. Founders
 // shouldn't see applications from people with empty bios + no
 // skills + no LinkedIn or resume - it's a bad first impression
 // and wastes their time.
 const profile = await getProfile(user.id);
 const hasName = Boolean(profile.fullName.trim());
 const hasHeadline = Boolean(profile.candidate.headline.trim());
 const hasSkills = profile.candidate.skills.length > 0;
 const hasCredential =
 Boolean(profile.linkedinUrl.trim()) || Boolean(profile.resume);
 if (!hasName || !hasHeadline || !hasSkills || !hasCredential) {
 setSubmitting(false);
 Alert.alert(
 "Finish your profile first",
 "Founders need your name, a headline, at least one skill, and either a LinkedIn or resume to consider you. Takes a couple minutes.",
 [
 { text: "Cancel", style: "cancel" },
 {
 text: "Edit profile",
 onPress: () => {
 onClose();
 router.push("/edit-candidate" as never);
 },
 },
 ],
 );
 return;
 }
 await createApplication(project.id, note);
 void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
 onSent();
 onClose();
 setMessage("");
 } catch (err) {
 const m =
 err instanceof Error ? err.message : "Could not send.";
 Alert.alert(
 "Couldn't send",
 m.toLowerCase().includes("duplicate")
 ? "You've already applied to this project."
 : m,
 );
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <View style={[StyleSheet.absoluteFill, { zIndex: 70, elevation: 70 }]}>
 <BlurView
 intensity={mode === "dark" ? 50 : 40}
 tint={mode === "dark" ? "dark" : "light"}
 style={StyleSheet.absoluteFill}
 />
 <Pressable
 style={[
 StyleSheet.absoluteFill,
 { backgroundColor: "rgba(0,0,0,0.45)" },
 ]}
 onPress={submitting ? undefined : onClose}
 />

 <KeyboardAvoidingView
 behavior={Platform.OS === "ios" ? "padding" : undefined}
 style={styles.center}
 >
 <View style={styles.card}>
 <Pressable
 onPress={onClose}
 disabled={submitting}
 hitSlop={12}
 style={({ pressed }) => [
 styles.closeBtn,
 pressed && { opacity: 0.6 },
 ]}
 >
 <X size={18} color={theme.textMuted} />
 </Pressable>

 {/* Project context — partner sees what they're applying to. */}
 <Text style={styles.eyebrow}>Apply to</Text>
 <Text style={styles.title} numberOfLines={2}>
 {project.title}
 </Text>

 <View style={styles.founderRow}>
 {founderUrl ? (
 <Image source={{ uri: founderUrl }} style={styles.avatar} />
 ) : (
 <View style={styles.avatarFallback}>
 <User size={16} color={theme.textDim} strokeWidth={1.5} />
 </View>
 )}
 <View style={{ flex: 1 }}>
 <Text style={styles.founderName} numberOfLines={1}>
 {project.founderFullName || "Anonymous founder"}
 </Text>
 {project.founderHeadline ? (
 <Text style={styles.founderHeadline} numberOfLines={1}>
 {project.founderHeadline}
 </Text>
 ) : null}
 </View>
 </View>

 {(project.criteria.commitment || project.criteria.location) && (
 <View style={styles.metaRow}>
 {project.criteria.commitment ? (
 <View style={styles.metaChip}>
 <Briefcase size={10} color={theme.gold} />
 <Text style={styles.metaText}>
 {project.criteria.commitment}
 </Text>
 </View>
 ) : null}
 {project.criteria.location ? (
 <View style={styles.metaChip}>
 <MapPin size={10} color={theme.gold} />
 <Text style={styles.metaText}>
 {project.criteria.location}
 </Text>
 </View>
 ) : null}
 </View>
 )}

 <Text style={styles.body}>
 One pitch. Why you, why this project. They'll see it with your
 profile.
 </Text>

 <TextInput
 value={message}
 onChangeText={(t) => setMessage(t.slice(0, MAX_PITCH))}
 placeholder="Shipped X at Y. I want to focus on Z. Here's why I'd be a fit..."
 placeholderTextColor={theme.textDim}
 multiline
 textAlignVertical="top"
 style={styles.textarea}
 editable={!submitting}
 autoFocus
 />
 <Text style={styles.counter}>
 {message.length} / {MAX_PITCH}
 </Text>

 <View style={styles.footer}>
 <Pressable
 onPress={onClose}
 disabled={submitting}
 style={({ pressed }) => [
 styles.cancelBtn,
 pressed && { backgroundColor: theme.bgAlt },
 ]}
 >
 <Text style={styles.cancelText}>Cancel</Text>
 </Pressable>
 <Pressable
 onPress={submit}
 disabled={submitting}
 style={({ pressed }) => [
 styles.sendBtn,
 pressed && { opacity: 0.85 },
 submitting && { opacity: 0.5 },
 ]}
 >
 {submitting ? (
 <ActivityIndicator size="small" color={theme.textOnPrimary} />
 ) : (
 <>
 <Send
 size={14}
 color={theme.textOnPrimary}
 strokeWidth={2.2}
 />
 <Text style={styles.sendText}>Send application</Text>
 </>
 )}
 </Pressable>
 </View>
 </View>
 </KeyboardAvoidingView>
 </View>
 );
};

const makeStyles = (theme: ThemePalette) =>
 StyleSheet.create({
 center: {
 flex: 1,
 alignItems: "center",
 justifyContent: "center",
 paddingHorizontal: 20,
 },
 card: {
 width: "100%",
 maxWidth: 400,
 backgroundColor: theme.bgElev,
 borderWidth: 1,
 borderColor: theme.border,
 borderRadius: 20,
 paddingHorizontal: 22,
 paddingTop: 22,
 paddingBottom: 18,
 shadowColor: "#000000",
 shadowOpacity: 0.4,
 shadowRadius: 30,
 shadowOffset: { width: 0, height: 14 },
 elevation: 18,
 },
 closeBtn: {
 position: "absolute",
 top: 14,
 right: 14,
 width: 28,
 height: 28,
 alignItems: "center",
 justifyContent: "center",
 },
 eyebrow: {
 color: theme.gold,
 fontFamily: fonts.mono,
 fontSize: 10,
 letterSpacing: 1.8,
 textTransform: "uppercase",
 marginBottom: 6,
 },
 title: {
 color: theme.text,
 fontFamily: fonts.display,
 fontSize: 22,
 letterSpacing: -0.4,
 lineHeight: 26,
 paddingRight: 28,
 marginBottom: 14,
 },
 founderRow: {
 flexDirection: "row",
 alignItems: "center",
 gap: 10,
 paddingVertical: 10,
 paddingHorizontal: 12,
 borderWidth: 1,
 borderColor: theme.border,
 backgroundColor: theme.bgAlt,
 borderRadius: 12,
 marginBottom: 10,
 },
 avatar: {
 width: 32,
 height: 32,
 borderRadius: 8,
 borderWidth: 1,
 borderColor: theme.goldSoft,
 },
 avatarFallback: {
 width: 32,
 height: 32,
 borderRadius: 8,
 borderWidth: 1,
 borderColor: theme.border,
 backgroundColor: theme.bgElev,
 alignItems: "center",
 justifyContent: "center",
 },
 founderName: {
 color: theme.text,
 fontSize: 13.5,
 fontWeight: "600",
 },
 founderHeadline: {
 color: theme.textMuted,
 fontSize: 11,
 marginTop: 1,
 },
 metaRow: {
 flexDirection: "row",
 flexWrap: "wrap",
 gap: 6,
 marginBottom: 12,
 },
 metaChip: {
 flexDirection: "row",
 alignItems: "center",
 gap: 4,
 paddingHorizontal: 8,
 paddingVertical: 4,
 borderWidth: 1,
 borderColor: theme.border,
 borderRadius: 999,
 },
 metaText: {
 color: theme.textMuted,
 fontFamily: fonts.mono,
 fontSize: 10,
 letterSpacing: 1.2,
 textTransform: "uppercase",
 },
 body: {
 color: theme.textMuted,
 fontSize: 13,
 lineHeight: 18,
 marginBottom: 12,
 },
 textarea: {
 minHeight: 120,
 maxHeight: 200,
 backgroundColor: theme.bg,
 borderWidth: 1,
 borderColor: theme.border,
 borderRadius: 12,
 paddingHorizontal: 14,
 paddingTop: 12,
 paddingBottom: 12,
 color: theme.text,
 fontSize: 14,
 lineHeight: 19,
 },
 counter: {
 alignSelf: "flex-end",
 color: theme.textDim,
 fontFamily: fonts.mono,
 fontSize: 10,
 letterSpacing: 0.5,
 marginTop: 4,
 marginBottom: 14,
 },
 footer: {
 flexDirection: "row",
 gap: 10,
 },
 cancelBtn: {
 flex: 1,
 height: 44,
 borderRadius: 12,
 borderWidth: 1,
 borderColor: theme.border,
 alignItems: "center",
 justifyContent: "center",
 },
 cancelText: {
 color: theme.textMuted,
 fontSize: 14,
 fontWeight: "500",
 },
 sendBtn: {
 flex: 1.6,
 height: 44,
 borderRadius: 12,
 backgroundColor: theme.gold,
 flexDirection: "row",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 },
 sendText: {
 color: theme.textOnPrimary,
 fontSize: 14,
 fontWeight: "700",
 letterSpacing: 0.1,
 },
 });
