import { getSupabase } from "./supabase";
import {
  embedCandidateText,
  embedProjectText,
  embedText,
  formatVector,
  isAiConfigured,
} from "./ai";
import {
  emptyCandidate,
  emptyCriteria,
  emptyProfile,
  type AppNotification,
  type ApplicationStatus,
  type Candidate,
  type CandidateProfile,
  type IncomingApplication,
  type NotificationType,
  type OutgoingApplication,
  type Profile,
  type Project,
  type ProjectCriteria,
  type ProjectLifecycle,
  type PublicProject,
  type ResumeMeta,
  type ReviewStatus,
} from "./mynet-types";

const lifecycleFrom = (raw: string | null | undefined): ProjectLifecycle =>
  raw === "paused" || raw === "filled" || raw === "closed"
    ? raw
    : "active";

const RESUMES_BUCKET = "resumes";
const PROOFS_BUCKET = "proofs";
const AVATARS_BUCKET = "avatars";

const refreshCandidateEmbedding = async (
  userId: string,
  data: {
    fullName: string;
    headline: string;
    bio: string;
    skills: string[];
    location: string;
    commitment: string;
  },
): Promise<void> => {
  if (!isAiConfigured()) return;
  const text = embedCandidateText(data);
  const vec = await embedText(text);
  if (!vec) return;
  await getSupabase()
    .from("profiles")
    .update({ embedding: formatVector(vec) })
    .eq("user_id", userId);
};

const refreshProjectEmbedding = async (
  projectId: string,
  data: { title: string; description: string; criteria: ProjectCriteria },
): Promise<void> => {
  if (!isAiConfigured()) return;
  const text = embedProjectText(data);
  const vec = await embedText(text);
  if (!vec) return;
  await getSupabase()
    .from("projects")
    .update({ embedding: formatVector(vec) })
    .eq("id", projectId);
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  linkedin_url: string | null;
  resume_path: string | null;
  resume_name: string | null;
  resume_size: number | null;
  resume_uploaded_at: string | null;
  website_url: string | null;
  proof_path: string | null;
  proof_name: string | null;
  proof_size: number | null;
  proof_uploaded_at: string | null;
  review_status: ReviewStatus | null;
  review_reason: string | null;
  headline: string | null;
  bio: string | null;
  skills: unknown;
  candidate_location: string | null;
  candidate_commitment: string | null;
  is_open_to_work: boolean | null;
  avatar_path: string | null;
  active_project_id: string | null;
};

type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  criteria: Partial<ProjectCriteria> | null;
  business_type: string | null;
  lifecycle_state: string | null;
  is_published: boolean | null;
  created_at: string;
  updated_at: string;
};

type SavedPersonRow = {
  project_id: string;
  person_id: string;
  status: "saved" | "passed";
};

const skillsFromJson = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  return [];
};

const candidateFromRow = (row: ProfileRow): CandidateProfile => ({
  headline: row.headline ?? "",
  bio: row.bio ?? "",
  skills: skillsFromJson(row.skills),
  location: row.candidate_location ?? "",
  commitment: row.candidate_commitment ?? "",
  isOpenToWork: Boolean(row.is_open_to_work),
});

const profileFromRow = (row: ProfileRow): Profile => ({
  linkedinUrl: row.linkedin_url ?? "",
  resume:
    row.resume_path && row.resume_name
      ? {
          name: row.resume_name,
          size: row.resume_size ?? 0,
          uploadedAt: row.resume_uploaded_at ?? new Date().toISOString(),
        }
      : null,
  websiteUrl: row.website_url ?? "",
  proof:
    row.proof_path && row.proof_name
      ? {
          name: row.proof_name,
          size: row.proof_size ?? 0,
          uploadedAt: row.proof_uploaded_at ?? new Date().toISOString(),
        }
      : null,
  reviewStatus: row.review_status ?? "draft",
  reviewReason: row.review_reason ?? null,
  fullName: row.full_name ?? "",
  avatarPath: row.avatar_path ?? null,
  activeProjectId: row.active_project_id ?? null,
  candidate: candidateFromRow(row),
});

const criteriaFromJson = (raw: Partial<ProjectCriteria> | null): ProjectCriteria => {
  const base = emptyCriteria();
  if (!raw) return base;
  return {
    skills: Array.isArray(raw.skills) ? raw.skills : base.skills,
    commitment: typeof raw.commitment === "string" ? raw.commitment : base.commitment,
    location: typeof raw.location === "string" ? raw.location : base.location,
    keywords: typeof raw.keywords === "string" ? raw.keywords : base.keywords,
  };
};

// ---- Profile -------------------------------------------------------

export const getProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return emptyProfile();
  return profileFromRow(data as ProfileRow);
};

export const setLinkedIn = async (userId: string, url: string): Promise<void> => {
  const { error } = await getSupabase()
    .from("profiles")
    .upsert(
      { user_id: userId, linkedin_url: url || null },
      { onConflict: "user_id" },
    );
  if (error) throw error;
};

// ---- Resume --------------------------------------------------------

export const uploadResume = async (
  userId: string,
  file: File,
  previousPath: string | null,
): Promise<ResumeMeta & { path: string }> => {
  const supabase = getSupabase();
  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "_");
  const path = `${userId}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(RESUMES_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
  if (uploadError) throw uploadError;

  const uploadedAt = new Date().toISOString();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      resume_path: path,
      resume_name: file.name,
      resume_size: file.size,
      resume_uploaded_at: uploadedAt,
    },
    { onConflict: "user_id" },
  );
  if (profileError) {
    await supabase.storage.from(RESUMES_BUCKET).remove([path]);
    throw profileError;
  }

  if (previousPath) {
    await supabase.storage.from(RESUMES_BUCKET).remove([previousPath]);
  }

  return { name: file.name, size: file.size, uploadedAt, path };
};

export const submitProfile = async (): Promise<void> => {
  const { error } = await getSupabase().rpc("submit_profile");
  if (error) throw error;
};

export const removeResume = async (
  userId: string,
  path: string | null,
): Promise<void> => {
  const supabase = getSupabase();
  if (path) {
    await supabase.storage.from(RESUMES_BUCKET).remove([path]);
  }
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        resume_path: null,
        resume_name: null,
        resume_size: null,
        resume_uploaded_at: null,
      },
      { onConflict: "user_id" },
    );
  if (error) throw error;
};

export const getResumePath = async (userId: string): Promise<string | null> => {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("resume_path")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.resume_path as string | null) ?? null;
};

// ---- Founder website + proof --------------------------------------

export const setWebsite = async (
  userId: string,
  url: string,
): Promise<void> => {
  // website_url is NOT NULL DEFAULT '' (migration 0017), so an empty
  // string clears it cleanly without violating the constraint.
  const { error } = await getSupabase()
    .from("profiles")
    .upsert(
      { user_id: userId, website_url: url.trim() },
      { onConflict: "user_id" },
    );
  if (error) throw error;
};

// Upload a founder's proof-of-work file to the `proofs` bucket. Same
// shape as uploadResume — replaces the previous file, writes the
// metadata onto the profiles row, rolls back the storage write if
// the profiles update fails.
export const uploadProof = async (
  userId: string,
  file: File,
  previousPath: string | null,
): Promise<import("@/lib/mynet-types").ProofMeta & { path: string }> => {
  const supabase = getSupabase();
  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "_");
  const path = `${userId}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(PROOFS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
  if (uploadError) throw uploadError;

  const uploadedAt = new Date().toISOString();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      proof_path: path,
      proof_name: file.name,
      proof_size: file.size,
      proof_mime_type: file.type || null,
      proof_uploaded_at: uploadedAt,
    },
    { onConflict: "user_id" },
  );
  if (profileError) {
    await supabase.storage.from(PROOFS_BUCKET).remove([path]);
    throw profileError;
  }

  if (previousPath) {
    await supabase.storage.from(PROOFS_BUCKET).remove([previousPath]);
  }

  return { name: file.name, size: file.size, uploadedAt, path };
};

export const removeProof = async (
  userId: string,
  path: string | null,
): Promise<void> => {
  const supabase = getSupabase();
  if (path) {
    await supabase.storage.from(PROOFS_BUCKET).remove([path]);
  }
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        proof_path: null,
        proof_name: null,
        proof_size: null,
        proof_mime_type: null,
        proof_uploaded_at: null,
      },
      { onConflict: "user_id" },
    );
  if (error) throw error;
};

export const getProofPath = async (userId: string): Promise<string | null> => {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("proof_path")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.proof_path as string | null) ?? null;
};

export const getProofSignedUrl = async (
  path: string,
  expiresInSeconds = 60 * 60,
): Promise<string | null> => {
  const { data, error } = await getSupabase()
    .storage.from(PROOFS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
};

// ---- Admin --------------------------------------------------------

export type AdminProfile = {
  userId: string;
  email: string;
  fullName: string;
  linkedinUrl: string;
  resume:
    | { name: string; size: number; uploadedAt: string; path: string }
    | null;
  createdAt: string;
  reviewStatus: ReviewStatus;
  reviewReason: string | null;
  reviewedAt: string | null;
};

type AdminProfileRow = ProfileRow & {
  email: string | null;
  is_admin: boolean | null;
  created_at: string;
  reviewed_at: string | null;
};

export const isAdminUser = async (userId: string): Promise<boolean> => {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("is_admin")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data?.is_admin);
};

export const listAllProfiles = async (): Promise<AdminProfile[]> => {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select(
      "user_id, full_name, email, linkedin_url, resume_path, resume_name, resume_size, resume_uploaded_at, created_at, is_admin, review_status, review_reason, reviewed_at",
    )
    .neq("review_status", "draft")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as AdminProfileRow[]).map((row) => ({
    userId: row.user_id,
    email: row.email ?? "",
    fullName: row.full_name ?? "",
    linkedinUrl: row.linkedin_url ?? "",
    resume:
      row.resume_path && row.resume_name
        ? {
            name: row.resume_name,
            size: row.resume_size ?? 0,
            uploadedAt: row.resume_uploaded_at ?? new Date().toISOString(),
            path: row.resume_path,
          }
        : null,
    createdAt: row.created_at,
    reviewStatus: row.review_status ?? "pending",
    reviewReason: row.review_reason ?? null,
    reviewedAt: row.reviewed_at ?? null,
  }));
};

export const reviewProfile = async (
  targetUserId: string,
  status: ReviewStatus,
  reason: string | null = null,
): Promise<void> => {
  const { error } = await getSupabase().rpc("review_profile", {
    target_user_id: targetUserId,
    new_status: status,
    new_reason: reason,
  });
  if (error) throw error;
};

export const getResumeSignedUrl = async (
  path: string,
  expiresInSeconds = 3600,
): Promise<string> => {
  const { data, error } = await getSupabase()
    .storage.from(RESUMES_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
};

// ---- Projects ------------------------------------------------------

export const listProjects = async (userId: string): Promise<Project[]> => {
  const supabase = getSupabase();

  const { data: projectRows, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (projectsError) throw projectsError;
  if (!projectRows || projectRows.length === 0) return [];

  const ids = (projectRows as ProjectRow[]).map((p) => p.id);
  const { data: peopleRows, error: peopleError } = await supabase
    .from("saved_people")
    .select("project_id, person_id, status")
    .in("project_id", ids);
  if (peopleError) throw peopleError;

  const byProject = new Map<string, { saved: string[]; passed: string[] }>();
  for (const id of ids) byProject.set(id, { saved: [], passed: [] });
  for (const row of (peopleRows ?? []) as SavedPersonRow[]) {
    const bucket = byProject.get(row.project_id);
    if (!bucket) continue;
    if (row.status === "saved") bucket.saved.push(row.person_id);
    else bucket.passed.push(row.person_id);
  }

  return (projectRows as ProjectRow[]).map((p) => {
    const people = byProject.get(p.id) ?? { saved: [], passed: [] };
    return {
      id: p.id,
      ownerId: p.owner_id,
      title: p.title,
      description: p.description,
      criteria: criteriaFromJson(p.criteria),
      businessType: p.business_type ?? "",
      lifecycleState: lifecycleFrom(p.lifecycle_state),
      savedPersonIds: people.saved,
      passedPersonIds: people.passed,
      isPublished: Boolean(p.is_published),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  });
};

export const createProject = async (
  userId: string,
  data: {
    title: string;
    description: string;
    criteria: ProjectCriteria;
    businessType?: string;
  },
): Promise<Project> => {
  const { data: row, error } = await getSupabase()
    .from("projects")
    .insert({
      owner_id: userId,
      title: data.title,
      description: data.description,
      criteria: data.criteria,
      // business_type is NOT NULL with a default of '' (migration
      // 0018). Send "" when no value was passed so the insert
      // doesn't trip the not-null check on older Supabase rows.
      business_type: data.businessType ?? "",
    })
    .select("*")
    .single();
  if (error) throw error;

  const r = row as ProjectRow;
  void refreshProjectEmbedding(r.id, {
    title: r.title,
    description: r.description,
    criteria: criteriaFromJson(r.criteria),
  });
  return {
    id: r.id,
    ownerId: r.owner_id,
    title: r.title,
    description: r.description,
    criteria: criteriaFromJson(r.criteria),
    businessType: r.business_type ?? "",
    lifecycleState: lifecycleFrom(r.lifecycle_state),
    savedPersonIds: [],
    passedPersonIds: [],
    isPublished: Boolean(r.is_published),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
};

// Founder picks which of their projects drives Match's ranking
// (and where Saves land). Pass null to clear the focus. RLS allows
// updating only your own profile row.
export const setActiveProject = async (
  userId: string,
  projectId: string | null,
): Promise<void> => {
  const { error } = await getSupabase()
    .from("profiles")
    .update({ active_project_id: projectId })
    .eq("user_id", userId);
  if (error) throw error;
};

// Founder-only: change the lifecycle state on one of their
// projects. Browse / Search hide non-active projects so this is
// how they signal "filled" / "paused" without deleting.
export const setProjectLifecycle = async (
  projectId: string,
  state: ProjectLifecycle,
): Promise<void> => {
  const { error } = await getSupabase().rpc("set_project_lifecycle", {
    project_id: projectId,
    new_state: state,
  });
  if (error) throw error;
};

export const updateProject = async (
  projectId: string,
  data: {
    title: string;
    description: string;
    criteria: ProjectCriteria;
    businessType?: string;
  },
): Promise<void> => {
  const { error } = await getSupabase()
    .from("projects")
    .update({
      title: data.title,
      description: data.description,
      criteria: data.criteria,
      ...(data.businessType !== undefined
        ? { business_type: data.businessType }
        : {}),
    })
    .eq("id", projectId);
  if (error) throw error;
  void refreshProjectEmbedding(projectId, data);
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const { error } = await getSupabase()
    .from("projects")
    .delete()
    .eq("id", projectId);
  if (error) throw error;
};

// ---- Saved / Passed people ----------------------------------------

export const setPersonStatus = async (
  projectId: string,
  personId: string,
  status: "saved" | "passed",
): Promise<void> => {
  const { error } = await getSupabase()
    .from("saved_people")
    .upsert(
      { project_id: projectId, person_id: personId, status },
      { onConflict: "project_id,person_id" },
    );
  if (error) throw error;
};

export const removePerson = async (
  projectId: string,
  personId: string,
): Promise<void> => {
  const { error } = await getSupabase()
    .from("saved_people")
    .delete()
    .eq("project_id", projectId)
    .eq("person_id", personId);
  if (error) throw error;
};

// ---- Candidate side ------------------------------------------------

export const updateCandidate = async (
  userId: string,
  candidate: CandidateProfile,
  fullName: string,
): Promise<void> => {
  const { error } = await getSupabase()
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        full_name: fullName,
        headline: candidate.headline,
        bio: candidate.bio,
        skills: candidate.skills,
        candidate_location: candidate.location,
        candidate_commitment: candidate.commitment,
        is_open_to_work: candidate.isOpenToWork,
      },
      { onConflict: "user_id" },
    );
  if (error) throw error;
  void refreshCandidateEmbedding(userId, {
    fullName,
    headline: candidate.headline,
    bio: candidate.bio,
    skills: candidate.skills,
    location: candidate.location,
    commitment: candidate.commitment,
  });
};

export const setOpenToWork = async (
  userId: string,
  value: boolean,
): Promise<void> => {
  const { error } = await getSupabase()
    .from("profiles")
    .upsert(
      { user_id: userId, is_open_to_work: value },
      { onConflict: "user_id" },
    );
  if (error) throw error;
};

type CandidateRpcRow = {
  user_id: string;
  full_name: string;
  linkedin_url: string;
  headline: string;
  bio: string;
  skills: unknown;
  candidate_location: string;
  candidate_commitment: string;
  resume_name: string | null;
  resume_path: string | null;
  avatar_path: string | null;
};

const candidateFromRpc = (row: CandidateRpcRow): Candidate => ({
  userId: row.user_id,
  fullName: row.full_name ?? "",
  linkedinUrl: row.linkedin_url ?? "",
  headline: row.headline ?? "",
  bio: row.bio ?? "",
  skills: skillsFromJson(row.skills),
  location: row.candidate_location ?? "",
  commitment: row.candidate_commitment ?? "",
  resumeName: row.resume_name ?? null,
  resumePath: row.resume_path ?? null,
  avatarPath: row.avatar_path ?? null,
});

export const listOpenCandidates = async (): Promise<Candidate[]> => {
  const { data, error } = await getSupabase().rpc("list_open_candidates");
  if (error) throw error;
  return ((data ?? []) as CandidateRpcRow[]).map(candidateFromRpc);
};

type CandidateMatchRow = CandidateRpcRow & { similarity: number };

export const matchCandidatesForProject = async (
  projectId: string,
): Promise<Array<Candidate & { similarity: number }>> => {
  const { data, error } = await getSupabase().rpc(
    "match_candidates_for_project",
    { p_id: projectId },
  );
  if (error) throw error;
  return ((data ?? []) as CandidateMatchRow[]).map((row) => ({
    ...candidateFromRpc(row),
    similarity: row.similarity ?? 0,
  }));
};

type ProjectMatchRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  criteria: Partial<ProjectCriteria> | null;
  business_type: string | null;
  lifecycle_state: string | null;
  created_at: string;
  similarity: number;
  founder_full_name: string;
  founder_headline: string;
  founder_avatar: string | null;
};

export const matchProjectsForMe = async (): Promise<
  Array<PublicProject & { similarity: number }>
> => {
  const { data, error } = await getSupabase().rpc("match_projects_for_me");
  if (error) throw error;
  return ((data ?? []) as ProjectMatchRow[]).map((p) => ({
    id: p.id,
    ownerId: p.owner_id,
    title: p.title,
    description: p.description,
    criteria: criteriaFromJson(p.criteria),
    businessType: p.business_type ?? "",
    lifecycleState: lifecycleFrom(p.lifecycle_state),
    createdAt: p.created_at,
    similarity: p.similarity ?? 0,
    founderFullName: p.founder_full_name ?? "",
    founderHeadline: p.founder_headline ?? "",
    founderAvatarPath: p.founder_avatar ?? null,
  }));
};

export const getCandidatesByIds = async (
  ids: string[],
): Promise<Candidate[]> => {
  if (ids.length === 0) return [];
  const { data, error } = await getSupabase().rpc("get_candidates_by_ids", {
    ids,
  });
  if (error) throw error;
  return ((data ?? []) as CandidateRpcRow[]).map(candidateFromRpc);
};

// ---- Public projects (candidate browsing) -------------------------

type PublishedRpcRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  criteria: Partial<ProjectCriteria> | null;
  business_type: string | null;
  lifecycle_state: string | null;
  created_at: string;
  founder_full_name: string;
  founder_headline: string;
  founder_avatar: string | null;
};

export const listPublishedProjects = async (): Promise<PublicProject[]> => {
  const { data, error } = await getSupabase().rpc(
    "list_published_projects_with_founder",
  );
  if (error) throw error;
  return ((data ?? []) as PublishedRpcRow[]).map((p) => ({
    id: p.id,
    ownerId: p.owner_id,
    title: p.title,
    description: p.description,
    criteria: criteriaFromJson(p.criteria),
    businessType: p.business_type ?? "",
    lifecycleState: lifecycleFrom(p.lifecycle_state),
    createdAt: p.created_at,
    founderFullName: p.founder_full_name ?? "",
    founderHeadline: p.founder_headline ?? "",
    founderAvatarPath: p.founder_avatar ?? null,
  }));
};

export const setProjectPublished = async (
  projectId: string,
  isPublished: boolean,
): Promise<void> => {
  const { error } = await getSupabase()
    .from("projects")
    .update({ is_published: isPublished })
    .eq("id", projectId);
  if (error) throw error;
};

// ---- Applications -------------------------------------------------

export const createApplication = async (
  projectId: string,
  message: string,
): Promise<void> => {
  const { data: userResp } = await getSupabase().auth.getUser();
  const candidateId = userResp.user?.id;
  if (!candidateId) throw new Error("Sign in required to apply.");
  const { error } = await getSupabase()
    .from("applications")
    .insert({
      project_id: projectId,
      candidate_user_id: candidateId,
      message,
    });
  if (error) throw error;
};

type IncomingAppRow = {
  application_id: string;
  message: string;
  status: ApplicationStatus;
  created_at: string;
  candidate_user_id: string;
  candidate_full_name: string;
  candidate_linkedin: string;
  candidate_headline: string;
  candidate_skills: unknown;
  candidate_location: string;
  candidate_commitment: string;
  candidate_resume_name: string | null;
  candidate_resume_path: string | null;
  candidate_avatar_path: string | null;
};

export const listApplicationsForProject = async (
  projectId: string,
): Promise<IncomingApplication[]> => {
  const { data, error } = await getSupabase().rpc(
    "list_applications_for_project",
    { p_id: projectId },
  );
  if (error) throw error;
  return ((data ?? []) as IncomingAppRow[]).map((r) => ({
    id: r.application_id,
    message: r.message ?? "",
    status: r.status,
    createdAt: r.created_at,
    candidate: {
      userId: r.candidate_user_id,
      fullName: r.candidate_full_name ?? "",
      linkedinUrl: r.candidate_linkedin ?? "",
      headline: r.candidate_headline ?? "",
      bio: "",
      skills: skillsFromJson(r.candidate_skills),
      location: r.candidate_location ?? "",
      commitment: r.candidate_commitment ?? "",
      resumeName: r.candidate_resume_name ?? null,
      resumePath: r.candidate_resume_path ?? null,
      avatarPath: r.candidate_avatar_path ?? null,
    },
  }));
};

type OutgoingAppRow = {
  application_id: string;
  message: string;
  status: ApplicationStatus;
  created_at: string;
  project_id: string;
  project_title: string;
  project_description: string;
  founder_full_name: string | null;
  founder_linkedin: string | null;
};

export const listMyApplications = async (): Promise<OutgoingApplication[]> => {
  const { data, error } = await getSupabase().rpc("list_my_applications");
  if (error) throw error;
  return ((data ?? []) as OutgoingAppRow[]).map((r) => ({
    id: r.application_id,
    message: r.message ?? "",
    status: r.status,
    createdAt: r.created_at,
    projectId: r.project_id,
    projectTitle: r.project_title,
    projectDescription: r.project_description ?? "",
    founderFullName: r.founder_full_name ?? null,
    founderLinkedin: r.founder_linkedin ?? null,
  }));
};

export const updateApplicationStatus = async (
  applicationId: string,
  status: "accepted" | "rejected" | "pending",
): Promise<void> => {
  const { error } = await getSupabase()
    .from("applications")
    .update({ status })
    .eq("id", applicationId);
  if (error) throw error;
};

export const withdrawApplication = async (
  applicationId: string,
): Promise<void> => {
  const { error } = await getSupabase()
    .from("applications")
    .update({ status: "withdrawn" })
    .eq("id", applicationId);
  if (error) throw error;
};

// ---- Founder outreach ---------------------------------------------

export const notifyCandidates = async (
  projectId: string,
  candidateIds: string[],
  message: string | null = null,
): Promise<number> => {
  if (candidateIds.length === 0) return 0;
  const { data, error } = await getSupabase().rpc("notify_candidates", {
    p_id: projectId,
    candidate_ids: candidateIds,
    outreach_message: message,
  });
  if (error) throw error;
  return typeof data === "number" ? data : candidateIds.length;
};

// ---- Lightweight requests (chat / review) -------------------------

// Founder pings an operator asking to chat. Lands in their notifications.
export const requestChat = async (
  targetUserId: string,
  projectId: string | null = null,
): Promise<void> => {
  const { error } = await getSupabase().rpc("request_chat", {
    target_user_id: targetUserId,
    project_id: projectId,
  });
  if (error) throw error;
};

// Operator pings a founder asking them to look at their profile.
export const requestReview = async (projectId: string): Promise<void> => {
  const { error } = await getSupabase().rpc("request_review", {
    p_id: projectId,
  });
  if (error) throw error;
};

// ---- Public founder profile --------------------------------------

export type PublicFounder = {
  userId: string;
  fullName: string;
  headline: string;
  bio: string;
  skills: string[];
  location: string;
  commitment: string;
  linkedinUrl: string;
  avatarPath: string | null;
  isOpenToWork: boolean;
  websiteUrl: string;
};

type PublicFounderRow = {
  user_id: string;
  full_name: string;
  headline: string;
  bio: string;
  skills: unknown;
  candidate_location: string;
  candidate_commitment: string;
  linkedin_url: string;
  avatar_path: string | null;
  is_open_to_work: boolean;
  website_url: string | null;
};

export const getPublicFounder = async (
  userId: string,
): Promise<PublicFounder | null> => {
  const { data, error } = await getSupabase().rpc("get_public_founder", {
    target_user_id: userId,
  });
  if (error) throw error;
  const rows = (data ?? []) as PublicFounderRow[];
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    userId: r.user_id,
    fullName: r.full_name ?? "",
    headline: r.headline ?? "",
    bio: r.bio ?? "",
    skills: skillsFromJson(r.skills),
    location: r.candidate_location ?? "",
    commitment: r.candidate_commitment ?? "",
    linkedinUrl: r.linkedin_url ?? "",
    avatarPath: r.avatar_path ?? null,
    isOpenToWork: Boolean(r.is_open_to_work),
    websiteUrl: r.website_url ?? "",
  };
};

type FounderProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  criteria: Partial<ProjectCriteria> | null;
  business_type: string | null;
  lifecycle_state: string | null;
  created_at: string;
};

export const listPublishedProjectsForOwner = async (
  userId: string,
): Promise<PublicProject[]> => {
  const { data, error } = await getSupabase().rpc(
    "list_published_projects_for_owner",
    { target_user_id: userId },
  );
  if (error) throw error;
  return ((data ?? []) as FounderProjectRow[]).map((p) => ({
    id: p.id,
    ownerId: p.owner_id,
    title: p.title,
    description: p.description,
    criteria: criteriaFromJson(p.criteria),
    businessType: p.business_type ?? "",
    lifecycleState: lifecycleFrom(p.lifecycle_state),
    createdAt: p.created_at,
    founderFullName: "",
    founderHeadline: "",
    founderAvatarPath: null,
  }));
};

// ---- Avatars ------------------------------------------------------

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const uploadAvatar = async (
  userId: string,
  file: File,
  previousPath: string | null,
): Promise<string> => {
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error("Avatar too large. Max 2 MB.");
  }
  const supabase = getSupabase();
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
  if (uploadError) throw uploadError;

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { user_id: userId, avatar_path: path },
      { onConflict: "user_id" },
    );
  if (profileError) {
    await supabase.storage.from(AVATARS_BUCKET).remove([path]);
    throw profileError;
  }

  if (previousPath) {
    await supabase.storage.from(AVATARS_BUCKET).remove([previousPath]);
  }

  return path;
};

export const removeAvatar = async (
  userId: string,
  path: string | null,
): Promise<void> => {
  const supabase = getSupabase();
  if (path) {
    await supabase.storage.from(AVATARS_BUCKET).remove([path]);
  }
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { user_id: userId, avatar_path: null },
      { onConflict: "user_id" },
    );
  if (error) throw error;
};

export const getAvatarUrl = (path: string | null): string | null => {
  if (!path) return null;
  const { data } = getSupabase().storage.from(AVATARS_BUCKET).getPublicUrl(path);
  return data.publicUrl ?? null;
};

// ---- Notifications ------------------------------------------------

type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  from_user_id: string | null;
  read_at: string | null;
  created_at: string;
};

export const listNotifications = async (
  limit = 30,
): Promise<AppNotification[]> => {
  const supabase = getSupabase();

  // Try the new schema first (with from_user_id from migration 0011).
  let rows: NotificationRow[] | null = null;
  let useFromUserId = true;
  {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, link, from_user_id, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      // Migration 0011 hasn't been applied yet - fall back to the
      // pre-migration schema so the page still loads.
      useFromUserId = false;
    } else {
      rows = (data ?? []) as NotificationRow[];
    }
  }

  if (!useFromUserId) {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    rows = (data ?? []).map((r) => ({
      ...(r as Omit<NotificationRow, "from_user_id">),
      from_user_id: null,
    })) as NotificationRow[];
  }

  return (rows ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body ?? "",
    link: r.link ?? null,
    fromUserId: r.from_user_id ?? null,
    readAt: r.read_at ?? null,
    createdAt: r.created_at,
  }));
};

// ---- Chat contacts ------------------------------------------------

type ChatContactRow = {
  contact_id: string;
  full_name: string;
  linkedin_url: string;
  avatar_path: string | null;
  connected_at: string;
};

export const acceptChatRequest = async (
  notificationId: string,
): Promise<void> => {
  const { error } = await getSupabase().rpc("accept_chat_request", {
    notification_id: notificationId,
  });
  if (error) throw error;
};

export const listChatContacts = async (): Promise<
  import("@/lib/mynet-types").ChatContact[]
> => {
  const { data, error } = await getSupabase().rpc("list_chat_contacts");
  if (error) throw error;
  return ((data ?? []) as ChatContactRow[]).map((r) => ({
    contactId: r.contact_id,
    fullName: r.full_name ?? "",
    linkedinUrl: r.linkedin_url ?? "",
    avatarPath: r.avatar_path ?? null,
    connectedAt: r.connected_at,
  }));
};

// ---- Role -----------------------------------------------------------

// Founder vs builder is stored on auth user_metadata so it rides with
// the account across devices. Switching doesn't touch the profile row,
// so a builder's headline / bio / skills survive a round-trip through
// the founder role and come back intact on switch-back.
export const setRole = async (
  role: "founder" | "builder",
): Promise<void> => {
  const { error } = await getSupabase().auth.updateUser({
    data: { role },
  });
  if (error) throw error;
};

// ---- Account deletion ---------------------------------------------

// Wipes the caller's auth user + all owned/visible-to-them rows in
// the public schema. Backed by migration 0022. After this resolves,
// the client should sign out (the JWT is already invalid).
export const deleteMyAccount = async (): Promise<void> => {
  const { error } = await getSupabase().rpc("delete_my_account");
  if (error) throw error;
};

// ---- Chat / DMs (Stage 4 unified flow) ----------------------------
//
// Backend in migrations 0011 (chat_contacts) → 0013 (chat_messages) →
// 0014 (delivered/read ticks) → 0019 (unified pending-thread send +
// 2/48h throttle) → 0020 (decline + delete + lifecycle). Flow:
//   1. Sender calls request_or_send_chat_message — first message
//      creates a pending row, subsequent messages within 48h get
//      throttled to 2 (raises 'limit_reached').
//   2. Recipient sees the inbound thread with state="inbound" and
//      can Accept (creates the mutual contact rows and unlocks
//      unlimited messaging) or Decline (state→"declined", thread
//      stays so both sides can choose to delete).
//   3. Either side can deleteChatThread to drop the thread from
//      their own list (removes the chat_contacts row).
//   4. Realtime: subscribe to INSERT/UPDATE on chat_messages to
//      render new messages and read-receipt ticks live.

export type ChatMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
};

type ChatThreadRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
};

export type ThreadState =
  | "outbound"
  | "inbound"
  | "accepted"
  | "declined"
  | "none";

export type ChatThreadState = {
  state: ThreadState;
  acceptedAt: string | null;
  pendingCount: number;
  pendingWindowStartAt: string | null;
};

export type ChatThreadSummary = {
  contactId: string;
  lastBody: string;
  lastAt: string | null;
  lastSender: string | null;
  state: ThreadState;
  acceptedAt: string | null;
};

type ChatThreadsRpcRow = {
  contact_id: string;
  last_body: string | null;
  last_at: string | null;
  last_sender: string | null;
  state: ThreadState;
  accepted_at: string | null;
};

// Load the full message thread between the current user and another.
export const listChatThread = async (
  otherUserId: string,
  limit = 200,
): Promise<ChatMessage[]> => {
  const { data, error } = await getSupabase().rpc("list_chat_thread", {
    other_user_id: otherUserId,
    msg_limit: limit,
  });
  if (error) throw error;
  return ((data ?? []) as ChatThreadRow[]).map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    recipientId: r.recipient_id,
    body: r.body,
    createdAt: r.created_at,
    deliveredAt: r.delivered_at,
    readAt: r.read_at,
  }));
};

// Threads list with pending state baked in. One row per known
// counterparty (someone I've sent or received from, or someone
// who's pending acceptance from me).
export const listChatThreads = async (): Promise<ChatThreadSummary[]> => {
  const { data, error } = await getSupabase().rpc("list_chat_threads");
  if (error) throw error;
  return ((data ?? []) as ChatThreadsRpcRow[]).map((r) => ({
    contactId: r.contact_id,
    lastBody: r.last_body ?? "",
    lastAt: r.last_at ?? null,
    lastSender: r.last_sender ?? null,
    state: r.state ?? "none",
    acceptedAt: r.accepted_at ?? null,
  }));
};

export const getChatThreadState = async (
  otherUserId: string,
): Promise<ChatThreadState> => {
  const { data, error } = await getSupabase().rpc("get_chat_thread_state", {
    other_user_id: otherUserId,
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as
    | {
        state: ThreadState;
        accepted_at: string | null;
        request_message_count: number;
        request_window_start_at: string | null;
      }
    | null;
  return {
    state: row?.state ?? "none",
    acceptedAt: row?.accepted_at ?? null,
    pendingCount: row?.request_message_count ?? 0,
    pendingWindowStartAt: row?.request_window_start_at ?? null,
  };
};

// Unified send. First message creates the pending row, the 2-per-48h
// window throttles unaccepted threads, accepted threads pass through.
// Throws "limit_reached" when the pending window is full so the UI
// can render a wait state.
export const requestOrSendChatMessage = async (
  recipientUserId: string,
  body: string,
): Promise<{
  messageId: string;
  pendingCount: number;
  pendingWindowStartAt: string | null;
}> => {
  const { data, error } = await getSupabase().rpc(
    "request_or_send_chat_message",
    {
      recipient_user_id: recipientUserId,
      message_body: body,
    },
  );
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as
    | {
        message_id: string;
        pending_count: number;
        pending_window_start_at: string | null;
      }
    | null;
  return {
    messageId: row?.message_id ?? "",
    pendingCount: row?.pending_count ?? 0,
    pendingWindowStartAt: row?.pending_window_start_at ?? null,
  };
};

export const acceptChatThread = async (
  requesterUserId: string,
): Promise<void> => {
  const { error } = await getSupabase().rpc("accept_chat_thread", {
    requester_user_id: requesterUserId,
  });
  if (error) throw error;
};

export const declineChatThread = async (
  requesterUserId: string,
): Promise<void> => {
  const { error } = await getSupabase().rpc("decline_chat_thread", {
    requester_user_id: requesterUserId,
  });
  if (error) throw error;
};

export const deleteChatThread = async (
  otherUserId: string,
): Promise<void> => {
  const { error } = await getSupabase().rpc("delete_chat_thread", {
    other_user_id: otherUserId,
  });
  if (error) throw error;
};

export const markMessagesDelivered = async (
  otherUserId: string,
): Promise<void> => {
  const { error } = await getSupabase().rpc("mark_messages_delivered", {
    other_user_id: otherUserId,
  });
  if (error) throw error;
};

export const markMessagesRead = async (
  otherUserId: string,
): Promise<void> => {
  const { error } = await getSupabase().rpc("mark_messages_read", {
    other_user_id: otherUserId,
  });
  if (error) throw error;
};

export const markNotificationsRead = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  const { error } = await getSupabase()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .in("id", ids)
    .is("read_at", null);
  if (error) throw error;
};

// Mark every notification I have from a specific sender as read.
// Used when the user opens a chat thread — clears the bell badge
// for chat_request / accept / decline notifications tied to that
// conversation. RLS already constrains updates to my own row, so a
// generic update is safe.
export const markNotificationsReadForSender = async (
  fromUserId: string,
): Promise<void> => {
  const { data: userResp } = await getSupabase().auth.getUser();
  const uid = userResp.user?.id;
  if (!uid) return;
  const { error } = await getSupabase()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", uid)
    .eq("from_user_id", fromUserId)
    .is("read_at", null);
  if (error) throw error;
};

export const markAllNotificationsRead = async (): Promise<void> => {
  const { data: userResp } = await getSupabase().auth.getUser();
  const uid = userResp.user?.id;
  if (!uid) return;
  const { error } = await getSupabase()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", uid)
    .is("read_at", null);
  if (error) throw error;
};

// Re-export shared types so consumers can import from one module
export { emptyCandidate };
