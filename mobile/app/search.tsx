/**
 * Search page. Reached from the magnifying-glass icon on the Browse
 * tab. Filters tighten criteria for THIS search only - they don't
 * persist to the user's profile or affect Browse defaults.
 *
 *   Founder POV  - searches builders (open candidates).
 *                  Filters: commitment, location, skills.
 *   Builder POV  - searches projects (published projects).
 *                  Filters: business type, commitment, location, skills.
 *
 * Skills are multi-select via TagInput; a result must include at least
 * one of the selected skills. All other filters are exact-match
 * single-select via OptionPicker. Free-text search runs across the
 * relevant fields (title/headline/description/etc).
 */
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  RotateCcw,
  Search as SearchIcon,
  Sparkles,
  User,
} from "lucide-react-native";

import { Field } from "@/components/Field";
import { OptionPicker } from "@/components/OptionPicker";
import { TagInput } from "@/components/TagInput";
import { useAuth } from "@/lib/auth";
import {
  getAvatarUrl,
  listOpenCandidates,
  listPublishedProjects,
} from "@/lib/api";
import type { Candidate, PublicProject } from "@/lib/types";
import {
  BUSINESS_TYPE_OPTIONS,
  COMMITMENT_OPTIONS,
  LOCATION_OPTIONS,
} from "@/lib/options";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { readMetadataRole, type Role } from "@/lib/userRole";
import {
  addSavedProject,
  removeSavedProject,
  useIsProjectSaved,
} from "@/lib/savedProjects";
import { MothEmptyState } from "@/components/MothEmptyState";
import { MothLoader } from "@/components/MothLoader";

export default function SearchScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const { user } = useAuth();

  const role: Role = readMetadataRole(user) ?? "builder";
  const isFounder = role === "founder";

  const [query, setQuery] = useState("");
  const [commitment, setCommitment] = useState("");
  const [location, setLocation] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const run = isFounder
      ? listOpenCandidates().then((rows) => {
          if (!cancelled) setCandidates(rows);
        })
      : listPublishedProjects().then((rows) => {
          if (!cancelled) setProjects(rows);
        });
    run.catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isFounder]);

  const resetFilters = () => {
    setQuery("");
    setCommitment("");
    setLocation("");
    setBusinessType("");
    setSkills([]);
  };

  const hasFilters =
    Boolean(query.trim()) ||
    Boolean(commitment) ||
    Boolean(location) ||
    Boolean(businessType) ||
    skills.length > 0;

  // ── Filtering logic ─────────────────────────────────────────────
  const skillsLower = useMemo(
    () => skills.map((s) => s.toLowerCase()),
    [skills],
  );
  const q = query.trim().toLowerCase();

  const filteredCandidates = useMemo(() => {
    if (!isFounder) return [];
    return candidates.filter((c) => {
      if (commitment && c.commitment !== commitment) return false;
      if (location && c.location !== location) return false;
      if (skillsLower.length > 0) {
        const candSkills = new Set(c.skills.map((s) => s.toLowerCase()));
        if (!skillsLower.some((s) => candSkills.has(s))) return false;
      }
      if (q) {
        const haystack = `${c.fullName} ${c.headline} ${c.bio} ${c.location} ${c.commitment} ${c.skills.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [isFounder, candidates, commitment, location, skillsLower, q]);

  const filteredProjects = useMemo(() => {
    if (isFounder) return [];
    return projects.filter((p) => {
      if (businessType && p.businessType !== businessType) return false;
      if (commitment && p.criteria.commitment !== commitment) return false;
      if (location && p.criteria.location !== location) return false;
      if (skillsLower.length > 0) {
        const projSkills = new Set(
          p.criteria.skills.map((s) => s.toLowerCase()),
        );
        if (!skillsLower.some((s) => projSkills.has(s))) return false;
      }
      if (q) {
        const haystack = `${p.title} ${p.description} ${p.businessType} ${p.criteria.skills.join(" ")} ${p.criteria.commitment} ${p.criteria.location} ${p.founderFullName} ${p.founderHeadline}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [isFounder, projects, businessType, commitment, location, skillsLower, q]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isFounder ? "Find people" : "Find projects"}
          </Text>
          {hasFilters ? (
            <Pressable onPress={resetFilters} hitSlop={12}>
              <RotateCcw size={16} color={theme.textMuted} />
            </Pressable>
          ) : (
            <View style={{ width: 16 }} />
          )}
        </View>

        <View style={styles.searchWrap}>
          <SearchIcon size={14} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={
              isFounder
                ? "Name, skill, headline..."
                : "Title, founder, skill..."
            }
            placeholderTextColor={theme.textDim}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Pressable
          onPress={() => setFiltersOpen((o) => !o)}
          style={({ pressed }) => [
            styles.filtersToggle,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.filtersToggleLabel}>
            {filtersOpen ? "Hide filters" : "Show filters"}
          </Text>
          <ChevronDown
            size={14}
            color={theme.textMuted}
            style={{
              transform: [{ rotate: filtersOpen ? "180deg" : "0deg" }],
            }}
          />
        </Pressable>

        {filtersOpen && (
          <View style={styles.filters}>
            {!isFounder && (
              <Field label="Business type">
                <OptionPicker
                  value={businessType}
                  onChange={setBusinessType}
                  options={BUSINESS_TYPE_OPTIONS}
                  placeholder="Any business type"
                  searchable
                />
              </Field>
            )}
            <Field label="Commitment">
              <OptionPicker
                value={commitment}
                onChange={setCommitment}
                options={COMMITMENT_OPTIONS}
                placeholder="Any commitment"
                searchable={false}
              />
            </Field>
            <Field label="Location">
              <OptionPicker
                value={location}
                onChange={setLocation}
                options={LOCATION_OPTIONS}
                placeholder="Anywhere"
                searchable
              />
            </Field>
            <Field
              label="Skills"
              hint="Match if any one skill applies."
            >
              <TagInput
                value={skills}
                onChange={setSkills}
                placeholder="Type a skill, press Enter"
              />
            </Field>
          </View>
        )}

        {loading ? (
          <View style={styles.center}>
            <MothLoader size={160} />
          </View>
        ) : isFounder ? (
          <FlatList
            data={filteredCandidates}
            keyExtractor={(c) => c.userId}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              <MothEmptyState
                variant={hasFilters ? "filters" : "platform"}
                title={hasFilters ? "No matches." : "No people yet."}
                sub={
                  hasFilters
                    ? "Hawk-moths home in by scent, and your filters narrow the bouquet. Loosen a few and the field opens up."
                    : "Builders are still finishing their profiles. Check back soon."
                }
              />
            }
            renderItem={({ item: c }) => (
              <CandidateRow candidate={c} styles={styles} theme={theme} onPress={() => router.push(`/u/${c.userId}` as never)} />
            )}
          />
        ) : (
          <FlatList
            data={filteredProjects}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              <MothEmptyState
                variant={hasFilters ? "filters" : "platform"}
                title={hasFilters ? "No matches." : "No projects yet."}
                sub={
                  hasFilters
                    ? "Hawk-moths home in by scent, and your filters narrow the bouquet. Loosen a few and the field opens up."
                    : "Founders are still spinning things up. Check back soon."
                }
              />
            }
            renderItem={({ item: p }) => (
              <ProjectRow project={p} styles={styles} theme={theme} onPress={() => router.push(`/project/${p.id}` as never)} />
            )}
          />
        )}
      </SafeAreaView>
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// Result rows
// ────────────────────────────────────────────────────────────────

const CandidateRow = ({
  candidate,
  styles,
  theme,
  onPress,
}: {
  candidate: Candidate;
  styles: ReturnType<typeof makeStyles>;
  theme: ThemePalette;
  onPress: () => void;
}) => {
  const url =
    candidate.avatarPath?.startsWith("http")
      ? candidate.avatarPath
      : getAvatarUrl(candidate.avatarPath);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.avatarBox}>
        {url ? (
          <Image source={{ uri: url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <User size={20} color={theme.textDim} strokeWidth={1.5} />
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName} numberOfLines={1}>
          {candidate.fullName || "Unnamed"}
        </Text>
        {candidate.headline ? (
          <Text style={styles.rowSub} numberOfLines={2}>
            {candidate.headline}
          </Text>
        ) : null}
        <View style={styles.pillRow}>
          {candidate.commitment ? <Pill text={candidate.commitment} theme={theme} /> : null}
          {candidate.location ? <Pill text={candidate.location} theme={theme} /> : null}
          {candidate.skills.slice(0, 2).map((s) => (
            <Pill key={s} text={s} theme={theme} muted />
          ))}
        </View>
      </View>
    </Pressable>
  );
};

const ProjectRow = ({
  project,
  styles,
  theme,
  onPress,
}: {
  project: PublicProject;
  styles: ReturnType<typeof makeStyles>;
  theme: ThemePalette;
  onPress: () => void;
}) => {
  const founderUrl = getAvatarUrl(project.founderAvatarPath);
  const isSaved = useIsProjectSaved(project.id);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
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
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName} numberOfLines={1}>
          {project.title}
        </Text>
        {project.description ? (
          <Text style={styles.rowSub} numberOfLines={2}>
            {project.description}
          </Text>
        ) : null}
        <View style={styles.pillRow}>
          {project.businessType ? <Pill text={project.businessType} theme={theme} /> : null}
          {project.criteria.commitment ? (
            <Pill text={project.criteria.commitment} theme={theme} />
          ) : null}
          {project.criteria.location ? (
            <Pill text={project.criteria.location} theme={theme} />
          ) : null}
          {project.criteria.skills.slice(0, 2).map((s) => (
            <Pill key={s} text={s} theme={theme} muted />
          ))}
        </View>
      </View>
      {/* Bookmark toggle. Stops the row press from firing so tapping
          the icon saves/unsaves without navigating. */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          if (isSaved) {
            removeSavedProject(project.id);
          } else {
            addSavedProject(project);
          }
        }}
        hitSlop={10}
        accessibilityLabel={isSaved ? "Remove from saved" : "Save project"}
        style={styles.rowBookmark}
      >
        {isSaved ? (
          <BookmarkCheck size={18} color={theme.gold} fill={theme.gold} />
        ) : (
          <Bookmark size={18} color={theme.textDim} />
        )}
      </Pressable>
    </Pressable>
  );
};

const Pill = ({
  text,
  theme,
  muted,
}: {
  text: string;
  theme: ThemePalette;
  muted?: boolean;
}) => (
  <View
    style={{
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: muted ? theme.border : theme.goldSoft,
      backgroundColor: muted ? theme.bgAlt : theme.goldGlow,
    }}
  >
    <Text
      style={{
        color: muted ? theme.textMuted : theme.gold,
        fontSize: 10.5,
        fontWeight: "600",
        letterSpacing: 0.2,
      }}
    >
      {text}
    </Text>
  </View>
);

const makeStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    headerBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      color: theme.text,
      fontFamily: fonts.display,
      fontSize: 18,
    },
    searchWrap: {
      position: "relative",
      justifyContent: "center",
      paddingHorizontal: 16,
      marginBottom: 6,
    },
    searchIcon: {
      position: "absolute",
      left: 28,
      zIndex: 1,
    },
    searchInput: {
      backgroundColor: theme.bgElev,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingLeft: 36,
      paddingRight: 14,
      paddingVertical: 12,
      color: theme.text,
      fontSize: 14.5,
    },
    filtersToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
    },
    filtersToggleLabel: {
      color: theme.textMuted,
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 1.4,
      textTransform: "uppercase",
    },
    filters: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    list: {
      padding: 16,
      paddingBottom: 120,
    },
    empty: {
      padding: 40,
      alignItems: "center",
      gap: 10,
    },
    emptyTitle: {
      color: theme.text,
      fontFamily: fonts.display,
      fontSize: 18,
    },
    emptyBody: {
      color: theme.textMuted,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
      maxWidth: 280,
    },
    row: {
      flexDirection: "row",
      gap: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bgElev,
      borderRadius: 12,
    },
    avatarBox: {
      width: 48,
      height: 48,
      borderRadius: 10,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.goldGlow,
    },
    avatar: { width: 48, height: 48 },
    avatarFallback: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    rowName: {
      color: theme.text,
      fontSize: 15.5,
      fontWeight: "600",
      letterSpacing: -0.2,
    },
    rowSub: {
      color: theme.textMuted,
      fontSize: 12.5,
      lineHeight: 17,
      marginTop: 3,
    },
    pillRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 8,
    },
    rowBookmark: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 4,
    },
  });
