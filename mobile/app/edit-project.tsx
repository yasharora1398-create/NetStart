import { useEffect, useState } from "react";
import {
  Stack,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
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
import { ArrowLeft, Save, Trash2 } from "lucide-react-native";

import { Field } from "@/components/Field";
import { OptionPicker } from "@/components/OptionPicker";
import { TagInput } from "@/components/TagInput";
import { useAuth } from "@/lib/auth";
import {
  createProject,
  deleteProject,
  getProjectById,
  updateProjectMeta,
} from "@/lib/api";
import type { ProjectCriteria } from "@/lib/types";
import { COMMITMENT_OPTIONS, LOCATION_OPTIONS } from "@/lib/options";
import { fonts, theme } from "@/lib/theme";

const TITLE_MAX = 80;
const DESC_MAX = 280;

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const editing = Boolean(id);

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [commitment, setCommitment] = useState("");
  const [location, setLocation] = useState("");
  const [keywords, setKeywords] = useState("");

  useEffect(() => {
    if (!editing || !id) return;
    let cancelled = false;
    setLoading(true);
    getProjectById(id)
      .then((p) => {
        if (cancelled || !p) return;
        setTitle(p.title);
        setDescription(p.description);
        setSkills(p.criteria.skills);
        setCommitment(p.criteria.commitment);
        setLocation(p.criteria.location);
        setKeywords(p.criteria.keywords);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editing, id]);

  const handleSave = async () => {
    if (!user) return;
    if (title.trim().length < 2) {
      Alert.alert("Name required", "Give your project a short name.");
      return;
    }
    setSaving(true);
    try {
      const criteria: ProjectCriteria = {
        skills,
        commitment: commitment.trim(),
        location: location.trim(),
        keywords: keywords.trim(),
      };
      if (editing && id) {
        await updateProjectMeta(id, {
          title: title.trim(),
          description: description.trim(),
          criteria,
        });
      } else {
        await createProject(user.id, {
          title: title.trim(),
          description: description.trim(),
          criteria,
        });
      }
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

  const handleDelete = () => {
    if (!editing || !id) return;
    Alert.alert(
      "Delete this project?",
      "This will remove all saved candidates and applications attached to it. Can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteProject(id);
              router.back();
            } catch (err) {
              Alert.alert(
                "Could not delete",
                err instanceof Error ? err.message : "Try again.",
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {editing ? "Edit project" : "New project"}
          </Text>
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
          <Field label="Project name" rightLabel={`${title.length}/${TITLE_MAX}`}>
            <TextInput
              value={title}
              onChangeText={(t) => setTitle(t.slice(0, TITLE_MAX))}
              placeholder="e.g. Vertical AI for logistics"
              placeholderTextColor={theme.textDim}
              style={styles.input}
              autoCapitalize="sentences"
            />
          </Field>

          <Field
            label="What you're building"
            rightLabel={`${description.length}/${DESC_MAX}`}
          >
            <TextInput
              value={description}
              onChangeText={(t) => setDescription(t.slice(0, DESC_MAX))}
              placeholder="Stage, market, what's already shipped."
              placeholderTextColor={theme.textDim}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textarea]}
            />
          </Field>

          <Text style={styles.criteriaHeader}>Criteria</Text>
          <Text style={styles.criteriaHint}>
            Used by Match and Find People to surface candidates that fit.
          </Text>

          <Field label="Skills">
            <TagInput
              value={skills}
              onChange={setSkills}
              placeholder="e.g. Rust, Marketplaces, B2B GTM"
            />
          </Field>

          <Field label="Commitment">
            <OptionPicker
              value={commitment}
              onChange={setCommitment}
              options={COMMITMENT_OPTIONS}
              placeholder="What you need from them"
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

          <Field label="Keywords" hint="Free-text terms to nudge matching.">
            <TextInput
              value={keywords}
              onChangeText={setKeywords}
              placeholder="payments, fintech, ex-Stripe"
              placeholderTextColor={theme.textDim}
              style={styles.input}
              autoCapitalize="none"
            />
          </Field>

          {editing ? (
            <Pressable
              onPress={handleDelete}
              disabled={deleting}
              style={({ pressed }) => [
                styles.deleteBtn,
                pressed && { opacity: 0.85 },
                deleting && { opacity: 0.5 },
              ]}
            >
              {deleting ? (
                <ActivityIndicator color={theme.destructive} size="small" />
              ) : (
                <>
                  <Trash2 size={14} color={theme.destructive} />
                  <Text style={styles.deleteText}>Delete project</Text>
                </>
              )}
            </Pressable>
          ) : null}
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
  textarea: { minHeight: 96, textAlignVertical: "top", paddingTop: 12 },
  criteriaHeader: {
    color: theme.gold,
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 6,
    marginBottom: 4,
  },
  criteriaHint: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.destructive,
    paddingVertical: 12,
    borderRadius: 4,
    marginTop: 24,
  },
  deleteText: {
    color: theme.destructive,
    fontSize: 14,
    fontWeight: "600",
  },
});
