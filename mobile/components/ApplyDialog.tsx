/**
 * Apply dialog — mirrors the web's ApplyDialog. A founder taps "Apply"
 * on a partner's card; this modal pops over a dimmed/blurred backdrop
 * with the partner summary at the top and a multi-line textarea for
 * the pitch ("why I'm reaching out, why this person is a fit"). On
 * submit, the application is recorded in the sentRequests store with
 * kind = "application" and shows up in Threads with an "Application
 * sent" pill.
 *
 * For real (non-fake) candidates we *also* leave room to call into
 * Supabase — but for now there's no founder→partner application table
 * on the schema, so the local store is the source of truth. Real
 * partner→founder applications still go through createApplication()
 * in api.ts on the website side.
 */
import { useMemo, useState } from "react";
import {
 ActivityIndicator,
 Alert,
 Image,
 Pressable,
 StyleSheet,
 Text,
 TextInput,
 View,
} from "react-native";
import { BlurView } from "expo-";
import { Send, User, X } from "lucide-react-native";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { getAvatarUrl } from "@/lib/api";
import { addSentRequest } from "@/lib/sentRequests";
import type { Candidate } from "@/lib/types";

const MIN_PITCH_CHARS = 10;

export const ApplyDialog = ({
 candidate,
 onClose,
 onSent,
}: {
 candidate: Candidate | null;
 onClose: () => void;
 onSent?: () => void;
}) => {
 const { theme, mode } = useTheme();
 const styles = useMemo(() => makeStyles(theme), [theme]);
 const [message, setMessage] = useState("");
 const [submitting, setSubmitting] = useState(false);

 if (!candidate) return null;

 const url =
 candidate.avatarPath?.startsWith("http")
 ? candidate.avatarPath
 : getAvatarUrl(candidate.avatarPath);

 const handleSubmit = async () => {
 const trimmed = message.trim();
 if (trimmed.length < MIN_PITCH_CHARS) {
 Alert.alert(
 "Pitch is too short",
 `Tell them at least ${MIN_PITCH_CHARS} characters about why you're reaching out.`,
 );
 return;
 }
 setSubmitting(true);
 try {
 addSentRequest(candidate, "application", trimmed);
 onSent?.();
 onClose();
 setMessage("");
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <View style={[StyleSheet.absoluteFill, { zIndex: 60, elevation: 60 }]}>
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
 onPress={onClose}
 />

 <View style={styles.center}>
 <View style={styles.card}>
 {/* Close button */}
 <Pressable
 onPress={onClose}
 hitSlop={12}
 style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
 >
 <X size={18} color={theme.textMuted} />
 </Pressable>

 <Text style={styles.title}>Apply to {candidate.fullName || "them"}</Text>
 <Text style={styles.body}>
 One short pitch. Why you, why this person. They'll see this with your
 profile.
 </Text>

 {/* Candidate summary card */}
 <View style={styles.summary}>
 {url ? (
 <Image source={{ uri: url }} style={styles.avatar} />
 ) : (
 <View style={styles.avatarFallback}>
 <User size={20} color={theme.textDim} strokeWidth={1.5} />
 </View>
 )}
 <View style={{ flex: 1 }}>
 <Text style={styles.summaryLabel}>To</Text>
 <Text style={styles.summaryName} numberOfLines={1}>
 {candidate.fullName || "Unnamed"}
 </Text>
 {candidate.headline ? (
 <Text style={styles.summaryHeadline} numberOfLines={1}>
 {candidate.headline}
 </Text>
 ) : null}
 </View>
 </View>

 {/* Pitch textarea */}
 <TextInput
 value={message}
 onChangeText={setMessage}
 placeholder="I shipped X, I want to focus on Y, here's why I'm a fit..."
 placeholderTextColor={theme.textDim}
 multiline
 textAlignVertical="top"
 style={styles.textarea}
 editable={!submitting}
 />

 {/* Footer */}
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
 onPress={handleSubmit}
 disabled={submitting}
 style={({ pressed }) => [
 styles.sendBtn,
 pressed && { backgroundColor: theme.goldDeep },
 submitting && { opacity: 0.7 },
 ]}
 >
 {submitting ? (
 <ActivityIndicator size="small" color={theme.textOnPrimary} />
 ) : (
 <>
 <Send size={14} color={theme.textOnPrimary} strokeWidth={2.2} />
 <Text style={styles.sendText}>Send application</Text>
 </>
 )}
 </Pressable>
 </View>
 </View>
 </View>
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
 maxWidth: 380,
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
 title: {
 color: theme.text,
 fontFamily: fonts.display,
 fontSize: 20,
 letterSpacing: -0.3,
 marginBottom: 6,
 paddingRight: 28,
 },
 body: {
 color: theme.textMuted,
 fontSize: 13,
 lineHeight: 18,
 marginBottom: 14,
 },
 summary: {
 flexDirection: "row",
 alignItems: "center",
 gap: 12,
 paddingHorizontal: 12,
 paddingVertical: 10,
 borderWidth: 1,
 borderColor: theme.border,
 backgroundColor: theme.bgAlt,
 borderRadius: 12,
 marginBottom: 14,
 },
 avatar: {
 width: 40,
 height: 40,
 borderRadius: 8,
 borderWidth: 1,
 borderColor: theme.goldSoft,
 },
 avatarFallback: {
 width: 40,
 height: 40,
 borderRadius: 8,
 borderWidth: 1,
 borderColor: theme.border,
 backgroundColor: theme.bgElev,
 alignItems: "center",
 justifyContent: "center",
 },
 summaryLabel: {
 color: theme.textMuted,
 fontFamily: fonts.mono,
 fontSize: 9,
 textTransform: "uppercase",
 letterSpacing: 1.5,
 },
 summaryName: {
 color: theme.text,
 fontSize: 14,
 fontWeight: "600",
 marginTop: 1,
 },
 summaryHeadline: {
 color: theme.textMuted,
 fontSize: 11,
 marginTop: 1,
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
 marginBottom: 16,
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
 flex: 1.4,
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
