import { useMemo, useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import {
 ActivityIndicator,
 Alert,
 Platform,
 Pressable,
 ScrollView,
 StyleSheet,
 Text,
 TextInput,
 View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
 ArrowLeft,
 LogOut,
 Mail,
 Save,
 ShieldCheck,
 Trash2,
} from "lucide-react-native";

import { Field } from "@/components/Field";
import { useAuth } from "@/lib/auth";
import { deleteMyAccount } from "@/lib/api";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";

export default function SettingsScreen() {
 const { theme } = useTheme();
 const styles = useMemo(() => makeStyles(theme), [theme]);
 const { user, updateEmail, updatePassword, signOut } = useAuth();
 const router = useRouter();
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [savingEmail, setSavingEmail] = useState(false);
 const [savingPassword, setSavingPassword] = useState(false);
 const [signingOutAll, setSigningOutAll] = useState(false);
 const [deleteConfirm, setDeleteConfirm] = useState("");
 const [deletingAccount, setDeletingAccount] = useState(false);

 useEffect(() => {
 if (user?.email) setEmail(user.email);
 }, [user?.email]);

 const handleEmail = async () => {
 if (!email.trim() || email === user?.email) return;
 setSavingEmail(true);
 try {
 const { error } = await updateEmail(email.trim());
 if (error) {
 Alert.alert("Could not update", error.message);
 } else {
 Alert.alert(
 "Confirm by email",
 "Click the link we sent to your new address to finalize the change.",
 );
 }
 } finally {
 setSavingEmail(false);
 }
 };

 const handlePassword = async () => {
 if (password.length < 8) {
 Alert.alert("Too short", "Password must be at least 8 characters.");
 return;
 }
 setSavingPassword(true);
 try {
 const { error } = await updatePassword(password);
 if (error) {
 Alert.alert("Could not update", error.message);
 } else {
 setPassword("");
 Alert.alert("Updated", "Your password has been changed.");
 }
 } finally {
 setSavingPassword(false);
 }
 };

 const handleSignOutAll = () => {
 const proceed = async () => {
 setSigningOutAll(true);
 try {
 await signOut("global");
 } finally {
 setSigningOutAll(false);
 }
 };
 // react-native-web's Alert.alert polyfill drops the button list
 // and never fires onPress -- so on web we fall back to a native
 // window.confirm() to actually run the sign-out callback.
 if (Platform.OS === "web") {
 const ok =
 typeof window !== "undefined" &&
 typeof window.confirm === "function" &&
 window.confirm(
 "Sign out everywhere?\n\nYou'll be signed out of every device.",
 );
 if (ok) void proceed();
 return;
 }
 Alert.alert(
 "Sign out everywhere?",
 "You'll be signed out of every device.",
 [
 { text: "Cancel", style: "cancel" },
 {
 text: "Sign out everywhere",
 style: "destructive",
 onPress: () => void proceed(),
 },
 ],
 );
 };

 const handleDeleteAccount = () => {
 if (deleteConfirm.trim().toLowerCase() !== "delete") {
 const msg = "Type DELETE in the confirm box to permanently delete your account.";
 if (Platform.OS === "web") {
 if (typeof window !== "undefined") window.alert(msg);
 } else {
 Alert.alert("Type DELETE", msg);
 }
 return;
 }
 const proceed = async () => {
 setDeletingAccount(true);
 try {
 await deleteMyAccount();
 // The auth user is gone; sign out locally to clear the cached
 // token before we navigate. Failure here doesn't matter -
 // the JWT is already invalid server-side.
 await signOut("local").catch(() => {});
 router.replace("/" as never);
 } catch (err) {
 const m = err instanceof Error ? err.message : "Could not delete.";
 if (Platform.OS === "web") {
 if (typeof window !== "undefined") window.alert(m);
 } else {
 Alert.alert("Could not delete account", m);
 }
 } finally {
 setDeletingAccount(false);
 }
 };
 // Same Alert / window.confirm split as sign-out: react-native-web
 // doesn't fire Alert.alert callbacks reliably.
 const warning =
 "Permanently delete your account?\n\nThis wipes your profile, projects, applications, and chat history. It cannot be undone.";
 if (Platform.OS === "web") {
 const ok =
 typeof window !== "undefined" &&
 typeof window.confirm === "function" &&
 window.confirm(warning);
 if (ok) void proceed();
 return;
 }
 Alert.alert(
 "Delete account?",
 "This wipes your profile, projects, applications, and chat history. It cannot be undone.",
 [
 { text: "Cancel", style: "cancel" },
 {
 text: "Delete forever",
 style: "destructive",
 onPress: () => void proceed(),
 },
 ],
 );
 };

 if (!user) {
 return (
 <SafeAreaView style={styles.safe}>
 <View style={styles.center}>
 <ActivityIndicator color={theme.gold} />
 </View>
 </SafeAreaView>
 );
 }

 const emailDirty = email.trim() !== "" && email.trim() !== user.email;

 return (
 <>
 <Stack.Screen options={{ headerShown: false }} />
 <SafeAreaView style={styles.safe} edges={["top"]}>
 <View style={styles.headerBar}>
 <Pressable onPress={() => router.back()} hitSlop={12}>
 <ArrowLeft size={20} color={theme.text} />
 </Pressable>
 <Text style={styles.headerTitle}>Settings</Text>
 <View style={{ width: 20 }} />
 </View>

 <ScrollView
 contentContainerStyle={styles.body}
 keyboardShouldPersistTaps="handled"
 >
 {/* Email */}
 <View style={styles.card}>
 <View style={styles.cardHead}>
 <Mail size={16} color={theme.gold} />
 <Text style={styles.cardTitle}>Email</Text>
 </View>
 <Text style={styles.cardHint}>
 Changes require confirmation from the new address.
 </Text>
 <Field label="Email">
 <TextInput
 value={email}
 onChangeText={setEmail}
 placeholder="you@example.com"
 placeholderTextColor={theme.textDim}
 autoCapitalize="none"
 autoCorrect={false}
 keyboardType="email-address"
 style={styles.input}
 />
 </Field>
 <Pressable
 onPress={handleEmail}
 disabled={savingEmail || !emailDirty}
 style={({ pressed }) => [
 styles.primaryBtn,
 pressed && { opacity: 0.85 },
 (savingEmail || !emailDirty) && { opacity: 0.5 },
 ]}
 >
 {savingEmail ? (
 <ActivityIndicator color={theme.bg} size="small" />
 ) : (
 <>
 <Save size={14} color={theme.bg} />
 <Text style={styles.primaryBtnText}>Update email</Text>
 </>
 )}
 </Pressable>
 </View>

 {/* Password */}
 <View style={styles.card}>
 <View style={styles.cardHead}>
 <ShieldCheck size={16} color={theme.gold} />
 <Text style={styles.cardTitle}>Password</Text>
 </View>
 <Text style={styles.cardHint}>At least 8 characters.</Text>
 <Field label="New password">
 <TextInput
 value={password}
 onChangeText={setPassword}
 placeholder="••••••••"
 placeholderTextColor={theme.textDim}
 secureTextEntry
 autoComplete="new-password"
 style={styles.input}
 />
 </Field>
 <Pressable
 onPress={handlePassword}
 disabled={savingPassword || password.length < 8}
 style={({ pressed }) => [
 styles.primaryBtn,
 pressed && { opacity: 0.85 },
 (savingPassword || password.length < 8) && { opacity: 0.5 },
 ]}
 >
 {savingPassword ? (
 <ActivityIndicator color={theme.bg} size="small" />
 ) : (
 <>
 <Save size={14} color={theme.bg} />
 <Text style={styles.primaryBtnText}>Update password</Text>
 </>
 )}
 </Pressable>
 </View>

 {/* Sign out everywhere */}
 <View style={[styles.card, styles.dangerCard]}>
 <View style={styles.cardHead}>
 <LogOut size={16} color={theme.destructive} />
 <Text style={[styles.cardTitle, { color: theme.destructive }]}>
 Sessions
 </Text>
 </View>
 <Text style={styles.cardHint}>
 Sign out everywhere kills every device session. Useful if you
 suspect your account was compromised.
 </Text>
 <Pressable
 onPress={handleSignOutAll}
 disabled={signingOutAll}
 style={({ pressed }) => [
 styles.dangerBtn,
 pressed && { opacity: 0.85 },
 signingOutAll && { opacity: 0.5 },
 ]}
 >
 {signingOutAll ? (
 <ActivityIndicator color={theme.destructive} size="small" />
 ) : (
 <>
 <LogOut size={14} color={theme.destructive} />
 <Text style={styles.dangerBtnText}>
 Sign out everywhere
 </Text>
 </>
 )}
 </Pressable>
 </View>

 {/* Delete account - permanent. Wipes profile, projects,
 applications, chat history, etc. Two-step gate: user
 must type DELETE then confirm in a native dialog. */}
 <View style={[styles.card, styles.dangerCard]}>
 <View style={styles.cardHead}>
 <Trash2 size={16} color={theme.destructive} />
 <Text style={[styles.cardTitle, { color: theme.destructive }]}>
 Delete account
 </Text>
 </View>
 <Text style={styles.cardHint}>
 Permanently removes your profile, projects, applications,
 and chat history. This cannot be undone.
 </Text>
 <Field label="Type DELETE to confirm">
 <TextInput
 value={deleteConfirm}
 onChangeText={setDeleteConfirm}
 placeholder="DELETE"
 placeholderTextColor={theme.textDim}
 autoCapitalize="characters"
 autoCorrect={false}
 style={styles.input}
 />
 </Field>
 <Pressable
 onPress={handleDeleteAccount}
 disabled={
 deletingAccount ||
 deleteConfirm.trim().toLowerCase() !== "delete"
 }
 style={({ pressed }) => [
 styles.dangerBtn,
 pressed && { opacity: 0.85 },
 (deletingAccount ||
 deleteConfirm.trim().toLowerCase() !== "delete") && {
 opacity: 0.5,
 },
 ]}
 >
 {deletingAccount ? (
 <ActivityIndicator color={theme.destructive} size="small" />
 ) : (
 <>
 <Trash2 size={14} color={theme.destructive} />
 <Text style={styles.dangerBtnText}>
 Delete my account
 </Text>
 </>
 )}
 </Pressable>
 </View>
 </ScrollView>
 </SafeAreaView>
 </>
 );
}

const makeStyles = (theme: ThemePalette) => StyleSheet.create({
 safe: { flex: 1, backgroundColor: theme.bg },
 center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
 card: {
 backgroundColor: theme.bgElev,
 borderWidth: 1,
 borderColor: theme.border,
 borderRadius: 4,
 padding: 16,
 marginBottom: 16,
 },
 dangerCard: {
 borderColor: "rgba(239,68,68,0.3)",
 },
 cardHead: {
 flexDirection: "row",
 alignItems: "center",
 gap: 8,
 marginBottom: 6,
 },
 cardTitle: {
 color: theme.text,
 fontFamily: fonts.display,
 fontSize: 18,
 },
 cardHint: {
 color: theme.textMuted,
 fontSize: 12,
 lineHeight: 17,
 marginBottom: 14,
 },
 input: {
 backgroundColor: theme.bg,
 borderWidth: 1,
 borderColor: theme.border,
 borderRadius: 4,
 paddingHorizontal: 14,
 paddingVertical: 12,
 color: theme.text,
 fontSize: 15,
 },
 primaryBtn: {
 flexDirection: "row",
 alignItems: "center",
 justifyContent: "center",
 gap: 6,
 backgroundColor: theme.gold,
 paddingVertical: 12,
 borderRadius: 4,
 },
 primaryBtnText: {
 color: theme.bg,
 fontSize: 14,
 fontWeight: "700",
 },
 dangerBtn: {
 flexDirection: "row",
 alignItems: "center",
 justifyContent: "center",
 gap: 6,
 borderWidth: 1,
 borderColor: theme.destructive,
 paddingVertical: 12,
 borderRadius: 4,
 backgroundColor: "transparent",
 },
 dangerBtnText: {
 color: theme.destructive,
 fontSize: 14,
 fontWeight: "600",
 },
});
