import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Camera, Save, Trash2 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import { Field } from "@/components/Field";
import { OptionPicker } from "@/components/OptionPicker";
import { TagInput } from "@/components/TagInput";
import { useAuth } from "@/lib/auth";
import {
  getAvatarUrl,
  getProfile,
  removeAvatar,
  setOpenToWork,
  updateCandidate,
  uploadAvatarFromUri,
} from "@/lib/api";
import {
  emptyProfile,
  type CandidateProfile,
  type Profile,
} from "@/lib/types";
import {
  COMMITMENT_OPTIONS,
  HEADLINE_OPTIONS,
  LOCATION_OPTIONS,
} from "@/lib/options";
import { fonts, theme } from "@/lib/theme";

const BIO_MIN = 60;
const SKILLS_MIN = 2;

export default function EditCandidateScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile>(emptyProfile());
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [commitment, setCommitment] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getProfile(user.id)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setFullName(p.fullName);
        setHeadline(p.candidate.headline);
        setBio(p.candidate.bio);
        setSkills(p.candidate.skills);
        setLocation(p.candidate.location);
        setCommitment(p.candidate.commitment);
        setOpen(p.candidate.isOpenToWork);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isAccepted = profile.reviewStatus === "accepted";
  const bioLen = bio.trim().length;
  const missing: string[] = [];
  if (!headline.trim()) missing.push("headline");
  if (bioLen < BIO_MIN) missing.push(`pitch/bio (${bioLen}/${BIO_MIN})`);
  if (skills.length < SKILLS_MIN)
    missing.push(`${SKILLS_MIN - skills.length} more skill`);
  if (!location.trim()) missing.push("location");
  if (!commitment.trim()) missing.push("commitment");
  const profileComplete = missing.length === 0;

  const handlePickAvatar = async () => {
    if (!user) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access in Settings to upload an avatar.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const newPath = await uploadAvatarFromUri(
        user.id,
        asset.uri,
        profile.avatarPath,
      );
      setProfile((p) => ({ ...p, avatarPath: newPath }));
    } catch (err) {
      Alert.alert(
        "Upload failed",
        err instanceof Error ? err.message : "Could not upload.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setUploading(true);
    try {
      await removeAvatar(user.id, profile.avatarPath);
      setProfile((p) => ({ ...p, avatarPath: null }));
    } catch (err) {
      Alert.alert(
        "Could not remove",
        err instanceof Error ? err.message : "Try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleToggleOpen = async (next: boolean) => {
    if (!user) return;
    if (!isAccepted) {
      Alert.alert(
        "Locked",
        "Get accepted first before going live as a candidate.",
      );
      return;
    }
    if (next && !profileComplete) {
      Alert.alert(
        "Almost there",
        `Fill in: ${missing.join(", ")}. Founders skip thin profiles.`,
      );
      return;
    }
    const previous = open;
    setOpen(next);
    try {
      await setOpenToWork(user.id, next);
    } catch (err) {
      setOpen(previous);
      Alert.alert(
        "Could not update",
        err instanceof Error ? err.message : "Try again.",
      );
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const candidate: CandidateProfile = {
        headline: headline.trim(),
        bio: bio.trim(),
        skills,
        location: location.trim(),
        commitment: commitment.trim(),
        isOpenToWork: open && isAccepted && profileComplete,
      };
      await updateCandidate(user.id, candidate, fullName.trim());
      router.back();
    } catch (err) {
      Alert.alert(
        "Save failed",
        err instanceof Error ? err.message : "Try again.",
      );
    } finally {
      setSaving(false);
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

  const avatarUrl = getAvatarUrl(profile.avatarPath);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit profile</Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            hitSlop={12}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && { opacity: 0.85 },
              saving && { opacity: 0.5 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color={theme.bg} size="small" />
            ) : (
              <>
                <Save size={14} color={theme.bg} />
                <Text style={styles.saveText}>Save</Text>
              </>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {/* Open to work */}
          <View style={styles.openCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.openLabel}>
                {open ? "Open to work" : "Closed"}
              </Text>
              <Text style={styles.openHint}>
                {isAccepted
                  ? profileComplete
                    ? "Founders running Find People will see you."
                    : `Need: ${missing.join(", ")}.`
                  : "Get accepted before flipping this on."}
              </Text>
            </View>
            <Switch
              value={open}
              onValueChange={handleToggleOpen}
              disabled={!isAccepted}
              trackColor={{ false: theme.border, true: theme.gold }}
              thumbColor={theme.bg}
            />
          </View>

          {/* Avatar */}
          <View style={styles.avatarRow}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {(fullName[0] ?? "?").toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1, gap: 8 }}>
              <Pressable
                onPress={handlePickAvatar}
                disabled={uploading}
                style={({ pressed }) => [
                  styles.avatarBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={theme.gold} />
                ) : (
                  <>
                    <Camera size={14} color={theme.gold} />
                    <Text style={styles.avatarBtnText}>
                      {avatarUrl ? "Change photo" : "Upload photo"}
                    </Text>
                  </>
                )}
              </Pressable>
              {avatarUrl && (
                <Pressable
                  onPress={handleRemoveAvatar}
                  disabled={uploading}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.avatarRemove,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Trash2 size={12} color={theme.destructive} />
                  <Text style={styles.avatarRemoveText}>Remove</Text>
                </Pressable>
              )}
            </View>
          </View>

          <Field label="Full name">
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor={theme.textDim}
              style={styles.input}
              autoCapitalize="words"
            />
          </Field>

          <Field label="Headline">
            <OptionPicker
              value={headline}
              onChange={setHeadline}
              options={HEADLINE_OPTIONS}
              placeholder="Pick the role you fit best"
              searchable
            />
          </Field>

          <Field
            label="Pitch / Bio"
            rightLabel={`${bioLen}/${BIO_MIN}`}
          >
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="What you've shipped. Where you want to focus next. Why a founder should reach out."
              placeholderTextColor={theme.textDim}
              multiline
              numberOfLines={5}
              style={[styles.input, styles.textarea]}
            />
          </Field>

          <Field label="Commitment">
            <OptionPicker
              value={commitment}
              onChange={setCommitment}
              options={COMMITMENT_OPTIONS}
              placeholder="How much can you give?"
              searchable={false}
            />
          </Field>

          <Field label="Location">
            <OptionPicker
              value={location}
              onChange={setLocation}
              options={LOCATION_OPTIONS}
              placeholder="Pick a city or remote"
              searchable
            />
          </Field>

          <Field
            label="Skills"
            rightLabel={`${skills.length}/${SKILLS_MIN} min`}
          >
            <TagInput
              value={skills}
              onChange={setSkills}
              placeholder="React, Solidity, Go..."
            />
          </Field>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

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
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  saveText: { color: theme.bg, fontWeight: "700", fontSize: 13 },
  body: { padding: 20, paddingBottom: 60 },
  openCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    marginBottom: 16,
  },
  openLabel: { color: theme.text, fontSize: 14, fontWeight: "600" },
  openHint: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.goldSoft,
  },
  avatarFallback: {
    width: 80,
    height: 80,
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
  avatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.gold,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  avatarBtnText: {
    color: theme.gold,
    fontSize: 12,
    fontWeight: "600",
  },
  avatarRemove: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  avatarRemoveText: { color: theme.destructive, fontSize: 11 },
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
  textarea: {
    minHeight: 110,
    textAlignVertical: "top",
    paddingTop: 12,
  },
});
