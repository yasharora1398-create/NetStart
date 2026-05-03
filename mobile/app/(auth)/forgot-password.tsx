import { useState } from "react";
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
import { ArrowLeft, MailCheck } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { fonts, theme } from "@/lib/theme";

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Enter the email on your account.");
      return;
    }
    setSubmitting(true);
    const { error } = await requestPasswordReset(email.trim());
    setSubmitting(false);
    if (error) Alert.alert("Could not send", error.message);
    else setSent(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <Link href="/(auth)/sign-in" style={styles.back}>
            <View style={styles.backRow}>
              <ArrowLeft size={14} color={theme.textMuted} />
              <Text style={styles.backText}>Back to sign in</Text>
            </View>
          </Link>

          {sent ? (
            <View style={styles.sentCard}>
              <View style={styles.sentIcon}>
                <MailCheck size={20} color={theme.gold} />
              </View>
              <Text style={styles.eyebrow}>Sent</Text>
              <Text style={styles.h1}>Check your inbox.</Text>
              <Text style={styles.body}>
                Reset link sent to {email}. The link expires in an hour.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.eyebrow}>Reset</Text>
              <Text style={styles.h1}>Forgot your password?</Text>
              <Text style={styles.body}>
                We'll email you a link to set a new one.
              </Text>

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
                  style={styles.input}
                />
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
                  <Text style={styles.primaryBtnText}>Send reset link</Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  back: { marginBottom: 24 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
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
    fontSize: 38,
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
  primaryBtnText: { color: theme.bg, fontSize: 15, fontWeight: "700" },
  sentCard: {
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.bgElev,
    borderRadius: 4,
    padding: 28,
    alignItems: "center",
  },
  sentIcon: {
    height: 44,
    width: 44,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
});
