import { useMemo, useState } from "react";
import { Link } from "expo-router";
import {
 ActivityIndicator,
 Alert,
 KeyboardAvoidingView,
 Platform,
 Pressable,
 StyleSheet,
 Text,
 TextInput,
 View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, Rocket, Users } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import type { Role } from "@/lib/userRole";

export default function SignUp() {
 const { theme } = useTheme();
 const styles = useMemo(() => makeStyles(theme), [theme]);
 const { signUp } = useAuth();
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 // Founder = has a startup, looking for people to join.
 // Partner = looking for a startup to join.
 const [role, setRole] = useState<Role>("partner");
 const [submitting, setSubmitting] = useState(false);

 const onSubmit = async () => {
 if (!name.trim() || !email.trim() || password.length < 8) {
 Alert.alert(
 "Check your inputs",
 "Name, email, and a password of at least 8 characters.",
 );
 return;
 }
 setSubmitting(true);
 const { error, duplicate } = await signUp(
 email.trim(),
 password,
 name.trim(),
 role,
 );
 setSubmitting(false);
 if (error) {
 Alert.alert("Sign up failed", error.message);
 return;
 }
 if (duplicate) {
 // Supabase's email-enumeration protection returns success
 // with no identities when the email already exists. It does
 // NOT send a confirmation email in that case, so we can't
 // promise one to the user. Route them to sign in instead.
 Alert.alert(
 "Email already registered",
 "An account with this email already exists. Sign in instead.",
 );
 return;
 }
 Alert.alert(
 "Check your email",
 "We sent a verification link. Confirm to finish signing up.",
 );
 };

 return (
 <SafeAreaView style={styles.safe}>
 <KeyboardAvoidingView
 behavior={Platform.OS === "ios" ? "padding" : undefined}
 style={styles.flex}
 >
 <View style={styles.container}>
 <Text style={styles.eyebrow}>Create account</Text>
 <Text style={styles.h1}>Join Polln8.</Text>
 <Text style={styles.body}>
 Founders and partners who actually ship.
 </Text>

 <View style={styles.field}>
 <Text style={styles.label}>Name</Text>
 <TextInput
 value={name}
 onChangeText={setName}
 placeholder="Your name"
 placeholderTextColor={theme.textDim}
 autoCapitalize="words"
 autoComplete="name"
 style={styles.input}
 />
 </View>

 <View style={styles.field}>
 <Text style={styles.label}>Email</Text>
 <TextInput
 value={email}
 onChangeText={setEmail}
 placeholder="you@example.com"
 placeholderTextColor={theme.textDim}
 autoCapitalize="none"
 autoCorrect={false}
 keyboardType="email-address"
 autoComplete="email"
 style={styles.input}
 />
 </View>

 <View style={styles.field}>
 <Text style={styles.label}>Password</Text>
 <TextInput
 value={password}
 onChangeText={setPassword}
 placeholder="At least 8 characters"
 placeholderTextColor={theme.textDim}
 secureTextEntry
 autoComplete="new-password"
 style={styles.input}
 />
 </View>

 {/* Role picker — founder vs partner. Drives Match filtering
 and the Apply / Request-chat CTA semantics throughout the
 app. Stored on the auth user's user_metadata.role. */}
 <View style={styles.field}>
 <Text style={styles.label}>I am a…</Text>
 <View style={styles.roleRow}>
 <Pressable
 onPress={() => setRole("founder")}
 style={({ pressed }) => [
 styles.roleBtn,
 role === "founder" && styles.roleBtnActive,
 pressed && { opacity: 0.85 },
 ]}
 >
 <Rocket
 size={16}
 color={role === "founder" ? theme.gold : theme.textMuted}
 />
 <View style={{ flex: 1 }}>
 <Text
 style={[
 styles.roleTitle,
 role === "founder" && { color: theme.gold },
 ]}
 >
 Founder
 </Text>
 <Text style={styles.roleHint}>
 I have a startup, looking for people to join.
 </Text>
 </View>
 </Pressable>
 <Pressable
 onPress={() => setRole("partner")}
 style={({ pressed }) => [
 styles.roleBtn,
 role === "partner" && styles.roleBtnActive,
 pressed && { opacity: 0.85 },
 ]}
 >
 <Users
 size={16}
 color={role === "partner" ? theme.gold : theme.textMuted}
 />
 <View style={{ flex: 1 }}>
 <Text
 style={[
 styles.roleTitle,
 role === "partner" && { color: theme.gold },
 ]}
 >
 Partner
 </Text>
 <Text style={styles.roleHint}>
 I'm looking for a startup to join.
 </Text>
 </View>
 </Pressable>
 </View>
 </View>

 <Pressable
 style={({ pressed }) => [
 styles.primaryBtn,
 pressed && { opacity: 0.85 },
 submitting && { opacity: 0.5 },
 ]}
 onPress={onSubmit}
 disabled={submitting}
 >
 {submitting ? (
 <ActivityIndicator color={theme.bg} />
 ) : (
 <>
 <Text style={styles.primaryBtnText}>Create account</Text>
 <ArrowRight size={16} color={theme.bg} />
 </>
 )}
 </Pressable>

 <View style={styles.footer}>
 <Text style={styles.footerText}>Already have an account?</Text>
 <Link href="/(auth)/sign-in" style={styles.footerLink}>
 Sign in
 </Link>
 </View>
 </View>
 </KeyboardAvoidingView>
 </SafeAreaView>
 );
}

const makeStyles = (theme: ThemePalette) => StyleSheet.create({
 safe: { flex: 1, backgroundColor: theme.bg },
 flex: { flex: 1 },
 container: { flex: 1, padding: 24, justifyContent: "center" },
 eyebrow: {
 color: theme.gold,
 fontFamily: fonts.mono,
 fontSize: 11,
 textTransform: "uppercase",
 letterSpacing: 3,
 marginBottom: 12,
 },
 h1: {
 color: theme.text,
 fontSize: 44,
 fontFamily: fonts.display,
 letterSpacing: -0.8,
 },
 body: {
 color: theme.textMuted,
 fontSize: 15,
 marginTop: 8,
 marginBottom: 28,
 },
 field: { marginBottom: 16 },
 label: {
 color: theme.textMuted,
 fontFamily: fonts.mono,
 fontSize: 11,
 textTransform: "uppercase",
 letterSpacing: 2,
 marginBottom: 6,
 },
 input: {
 backgroundColor: theme.bgElev,
 borderWidth: 1,
 borderColor: theme.border,
 borderRadius: 4,
 paddingHorizontal: 14,
 paddingVertical: 14,
 color: theme.text,
 fontSize: 15,
 },
 primaryBtn: {
 flexDirection: "row",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 backgroundColor: theme.gold,
 borderRadius: 4,
 paddingVertical: 16,
 marginTop: 6,
 },
 primaryBtnText: {
 color: theme.bg,
 fontSize: 15,
 fontWeight: "700",
 },
 footer: {
 flexDirection: "row",
 justifyContent: "center",
 gap: 6,
 marginTop: 22,
 },
 footerText: {
 color: theme.textMuted,
 fontSize: 14,
 },
 footerLink: {
 color: theme.gold,
 fontSize: 14,
 fontWeight: "600",
 },
 roleRow: {
 gap: 8,
 },
 roleBtn: {
 flexDirection: "row",
 alignItems: "center",
 gap: 12,
 backgroundColor: theme.bgElev,
 borderWidth: 1,
 borderColor: theme.border,
 borderRadius: 4,
 paddingHorizontal: 14,
 paddingVertical: 12,
 },
 roleBtnActive: {
 borderColor: theme.gold,
 backgroundColor: theme.goldGlow,
 },
 roleTitle: {
 color: theme.text,
 fontSize: 14,
 fontWeight: "700",
 marginBottom: 2,
 },
 roleHint: {
 color: theme.textMuted,
 fontSize: 12,
 lineHeight: 16,
 },
});
