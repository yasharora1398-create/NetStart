import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
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
  FileText,
  Save,
  Send,
  Trash2,
  Upload,
} from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";

import { Field } from "@/components/Field";
import { useAuth } from "@/lib/auth";
import {
  getProfile,
  getResumePath,
  removeResume,
  setLinkedIn,
  submitProfile,
  uploadResumeFromUri,
} from "@/lib/api";
import { emptyProfile, type Profile } from "@/lib/types";
import { fonts, theme } from "@/lib/theme";

const MAX_RESUME_BYTES = 4 * 1024 * 1024;

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isValidLinkedIn = (url: string): boolean => {
  if (!url.trim()) return true;
  try {
    const u = new URL(url);
    return u.hostname.endsWith("linkedin.com");
  } catch {
    return false;
  }
};

export default function EditCredentialsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(emptyProfile());
  const [linkedin, setLinkedin] = useState("");
  const [savingLinkedin, setSavingLinkedin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getProfile(user.id)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setLinkedin(p.linkedinUrl);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const linkedinDirty = linkedin.trim() !== profile.linkedinUrl.trim();

  const handleSaveLinkedIn = async () => {
    if (!user) return;
    if (!isValidLinkedIn(linkedin)) {
      Alert.alert("Invalid LinkedIn", "URL must be a linkedin.com link.");
      return;
    }
    setSavingLinkedin(true);
    try {
      await setLinkedIn(user.id, linkedin.trim());
      setProfile((p) => ({ ...p, linkedinUrl: linkedin.trim() }));
    } catch (err) {
      Alert.alert(
        "Could not save",
        err instanceof Error ? err.message : "Try again.",
      );
    } finally {
      setSavingLinkedin(false);
    }
  };

  const handlePickResume = async () => {
    if (!user) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_RESUME_BYTES) {
      Alert.alert(
        "File too large",
        `Max ${formatBytes(MAX_RESUME_BYTES)}. Yours is ${formatBytes(asset.size)}.`,
      );
      return;
    }
    setUploading(true);
    try {
      const previousPath = await getResumePath(user.id);
      const meta = await uploadResumeFromUri(
        user.id,
        asset.uri,
        asset.name,
        asset.size ?? 0,
        asset.mimeType ?? null,
        previousPath,
      );
      setProfile((p) => ({
        ...p,
        resume: { name: meta.name, size: meta.size, uploadedAt: meta.uploadedAt },
      }));
    } catch (err) {
      Alert.alert(
        "Upload failed",
        err instanceof Error ? err.message : "Try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveResume = async () => {
    if (!user) return;
    Alert.alert("Remove resume?", "You can re-upload anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setUploading(true);
          try {
            const path = await getResumePath(user.id);
            await removeResume(user.id, path);
            setProfile((p) => ({ ...p, resume: null }));
          } catch (err) {
            Alert.alert(
              "Could not remove",
              err instanceof Error ? err.message : "Try again.",
            );
          } finally {
            setUploading(false);
          }
        },
      },
    ]);
  };

  const handleSubmitForReview = async () => {
    if (!user) return;
    if (!profile.linkedinUrl && !profile.resume && !linkedinDirty) {
      Alert.alert(
        "Add something first",
        "Add LinkedIn or upload a resume before submitting.",
      );
      return;
    }
    setSubmitting(true);
    try {
      // Save linkedin if dirty
      if (linkedinDirty) {
        if (!isValidLinkedIn(linkedin)) {
          Alert.alert("Invalid LinkedIn", "URL must be a linkedin.com link.");
          setSubmitting(false);
          return;
        }
        await setLinkedIn(user.id, linkedin.trim());
        setProfile((p) => ({ ...p, linkedinUrl: linkedin.trim() }));
      }
      await submitProfile();
      Alert.alert("Submitted", "We'll review your credentials soon.");
      router.back();
    } catch (err) {
      Alert.alert(
        "Could not submit",
        err instanceof Error ? err.message : "Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.gold} />
        </View>
      </SafeAreaView>
    );
  }

  const status = profile.reviewStatus;
  const submitLabel =
    status === "draft"
      ? "Submit for review"
      : status === "rejected"
        ? "Resubmit for review"
        : status === "pending"
          ? "Under review"
          : "Update submission";
  const submitDisabled =
    submitting || status === "pending" || status === "accepted";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Credentials</Text>
          <View style={{ width: 20 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {status === "rejected" && profile.reviewReason ? (
            <View style={styles.rejectCard}>
              <Text style={styles.rejectLabel}>Reviewer note</Text>
              <Text style={styles.rejectBody}>{profile.reviewReason}</Text>
              <Text style={styles.rejectFix}>
                Update what's needed and resubmit.
              </Text>
            </View>
          ) : null}

          {/* LinkedIn */}
          <Field label="LinkedIn URL">
            <TextInput
              value={linkedin}
              onChangeText={setLinkedin}
              placeholder="https://linkedin.com/in/your-handle"
              placeholderTextColor={theme.textDim}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.input}
            />
            {linkedinDirty ? (
              <Pressable
                onPress={handleSaveLinkedIn}
                disabled={savingLinkedin}
                style={({ pressed }) => [
                  styles.savePill,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {savingLinkedin ? (
                  <ActivityIndicator size="small" color={theme.bg} />
                ) : (
                  <>
                    <Save size={12} color={theme.bg} />
                    <Text style={styles.savePillText}>Save LinkedIn</Text>
                  </>
                )}
              </Pressable>
            ) : profile.linkedinUrl ? (
              <Text style={styles.savedHint}>Saved</Text>
            ) : null}
          </Field>

          {/* Resume */}
          <Field label="Resume" hint="PDF or DOC, max 4 MB.">
            {profile.resume ? (
              <View style={styles.resumeCard}>
                <View style={styles.resumeIcon}>
                  <FileText size={16} color={theme.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resumeName} numberOfLines={1}>
                    {profile.resume.name}
                  </Text>
                  <Text style={styles.resumeMeta}>
                    {formatBytes(profile.resume.size)}
                  </Text>
                </View>
                <Pressable
                  onPress={handlePickResume}
                  disabled={uploading}
                  hitSlop={6}
                >
                  <Text style={styles.resumeAction}>Replace</Text>
                </Pressable>
                <Pressable
                  onPress={handleRemoveResume}
                  disabled={uploading}
                  hitSlop={6}
                  style={{ marginLeft: 6 }}
                >
                  <Trash2 size={16} color={theme.destructive} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handlePickResume}
                disabled={uploading}
                style={({ pressed }) => [
                  styles.uploadBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={theme.gold} />
                ) : (
                  <>
                    <Upload size={14} color={theme.gold} />
                    <Text style={styles.uploadText}>Upload resume</Text>
                  </>
                )}
              </Pressable>
            )}
          </Field>

          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Current status</Text>
            <Text style={[styles.statusValue, statusValueColor(status)]}>
              {statusLabel(status)}
            </Text>
          </View>

          <Pressable
            onPress={handleSubmitForReview}
            disabled={submitDisabled}
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && { opacity: 0.85 },
              submitDisabled && { opacity: 0.5 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={theme.bg} />
            ) : (
              <>
                <Send size={16} color={theme.bg} />
                <Text style={styles.submitText}>{submitLabel}</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const statusLabel = (s: string) =>
  s === "draft"
    ? "Draft (not submitted)"
    : s === "pending"
      ? "Under review"
      : s === "accepted"
        ? "Accepted"
        : s === "rejected"
          ? "Rejected"
          : s;

const statusValueColor = (s: string) => ({
  color:
    s === "accepted"
      ? theme.emerald
      : s === "rejected"
        ? theme.destructive
        : s === "pending"
          ? theme.gold
          : theme.textMuted,
});

const styles = StyleSheet.create({
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
  rejectCard: {
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
    backgroundColor: "rgba(239,68,68,0.05)",
    padding: 14,
    borderRadius: 4,
    marginBottom: 18,
  },
  rejectLabel: {
    color: theme.destructive,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 6,
  },
  rejectBody: { color: theme.text, fontSize: 13, lineHeight: 18 },
  rejectFix: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 15,
  },
  savePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.gold,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  savePillText: { color: theme.bg, fontSize: 11, fontWeight: "700" },
  savedHint: {
    color: theme.textMuted,
    fontSize: 11,
    fontFamily: fonts.mono,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 6,
  },
  resumeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    padding: 12,
  },
  resumeIcon: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  resumeName: { color: theme.text, fontSize: 13 },
  resumeMeta: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  resumeAction: {
    color: theme.gold,
    fontSize: 12,
    fontFamily: fonts.mono,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.gold,
    paddingVertical: 14,
    borderRadius: 4,
  },
  uploadText: { color: theme.gold, fontSize: 14, fontWeight: "600" },
  statusBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 14,
  },
  statusLabel: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  statusValue: {
    fontFamily: fonts.mono,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.gold,
    paddingVertical: 16,
    borderRadius: 4,
  },
  submitText: { color: theme.bg, fontSize: 15, fontWeight: "700" },
});
