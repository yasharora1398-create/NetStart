// Mobile API layer. Wraps the same Supabase tables and RPCs the web uses.
import { supabase } from "./supabase";
import {
  emptyCandidate,
  emptyProfile,
  type ApplicationStatus,
  type Candidate,
  type CandidateProfile,
  type OutgoingApplication,
  type Profile,
  type Project,
  type ProjectCriteria,
  type PublicProject,
  type ResumeMeta,
  type ReviewStatus,
} from "./types";

const AVATARS_BUCKET = "avatars";
const RESUMES_BUCKET = "resumes";

// ---- Helpers ------------------------------------------------------

const skillsFromJson = (raw: unknown): string[] =>
  Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === "string")
    : [];

const criteriaFromJson = (
  raw: Partial<ProjectCriteria> | null,
): ProjectCriteria => {
  const base = {
    skills: [] as string[],
    commitment: "",
    location: "",
    keywords: "",
  };
  if (!raw) return base;
  return {
    skills: Array.isArray(raw.skills) ? raw.skills : base.skills,
    commitment:
      typeof raw.commitment === "string" ? raw.commitment : base.commitment,
    location:
      typeof raw.location === "string" ? raw.location : base.location,
    keywords:
      typeof raw.keywords === "string" ? raw.keywords : base.keywords,
  };
};

export const getAvatarUrl = (path: string | null): string | null => {
  if (!path) return null;
  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  return data.publicUrl ?? null;
};

// ---- Profile ------------------------------------------------------

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  linkedin_url: string | null;
  resume_path: string | null;
  resume_name: string | null;
  resume_size: number | null;
  resume_uploaded_at: string | null;
  review_status: ReviewStatus | null;
  review_reason: string | null;
  headline: string | null;
  bio: string | null;
  skills: unknown;
  candidate_location: string | null;
  candidate_commitment: string | null;
  is_open_to_work: boolean | null;
  avatar_path: string | null;
};

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
  reviewStatus: row.review_status ?? "draft",
  reviewReason: row.review_reason ?? null,
  fullName: row.full_name ?? "",
  avatarPath: row.avatar_path ?? null,
  candidate: {
    headline: row.headline ?? "",
    bio: row.bio ?? "",
    skills: skillsFromJson(row.skills),
    location: row.candidate_location ?? "",
    commitment: row.candidate_commitment ?? "",
    isOpenToWork: Boolean(row.is_open_to_work),
  },
});

export const getProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return emptyProfile();
  return profileFromRow(data as ProfileRow);
};

export const setLinkedIn = async (
  userId: string,
  url: string,
): Promise<void> => {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { user_id: userId, linkedin_url: url || null },
      { onConflict: "user_id" },
    );
  if (error) throw error;
};

export const updateCandidate = async (
  userId: string,
  candidate: CandidateProfile,
  fullName: string,
): Promise<void> => {
  const { error } = await supabase.from("profiles").upsert(
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
};

export const setOpenToWork = async (
  userId: string,
  value: boolean,
): Promise<void> => {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { user_id: userId, is_open_to_work: value },
      { onConflict: "user_id" },
    );
  if (error) throw error;
};

export const submitProfile = async (): Promise<void> => {
  const { error } = await supabase.rpc("submit_profile");
  if (error) throw error;
};

// ---- Avatar upload (RN: takes a URI from expo-image-picker) -------

export const uploadAvatarFromUri = async (
  userId: string,
  fileUri: string,
  previousPath: string | null,
): Promise<string> => {
  const ext = (fileUri.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;
  const fileRes = await fetch(fileUri);
  const blob = await fileRes.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: blob.type || `image/${ext}`,
      upsert: false,
    });
  if (upErr) throw upErr;
  const { error: profErr } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, avatar_path: path }, { onConflict: "user_id" });
  if (profErr) {
    await supabase.storage.from(AVATARS_BUCKET).remove([path]);
    throw profErr;
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
  if (path) {
    await supabase.storage.from(AVATARS_BUCKET).remove([path]);
  }
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, avatar_path: null }, { onConflict: "user_id" });
  if (error) throw error;
};

// ---- Resume upload (RN: takes a URI from expo-document-picker) ----

export const getResumePath = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("resume_path")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.resume_path as string | null) ?? null;
};

export const uploadResumeFromUri = async (
  userId: string,
  fileUri: string,
  fileName: string,
  fileSize: number,
  mimeType: string | null,
  previousPath: string | null,
): Promise<{ name: string; size: number; uploadedAt: string; path: string }> => {
  const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, "_");
  const path = `${userId}/${Date.now()}_${safeName}`;
  const fileRes = await fetch(fileUri);
  const blob = await fileRes.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from(RESUMES_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: mimeType || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });
  if (upErr) throw upErr;
  const uploadedAt = new Date().toISOString();
  const { error: profErr } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      resume_path: path,
      resume_name: fileName,
      resume_size: fileSize,
      resume_uploaded_at: uploadedAt,
    },
    { onConflict: "user_id" },
  );
  if (profErr) {
    await supabase.storage.from(RESUMES_BUCKET).remove([path]);
    throw profErr;
  }
  if (previousPath) {
    await supabase.storage.from(RESUMES_BUCKET).remove([previousPath]);
  }
  return { name: fileName, size: fileSize, uploadedAt, path };
};

export const removeResume = async (
  userId: string,
  path: string | null,
): Promise<void> => {
  if (path) {
    await supabase.storage.from(RESUMES_BUCKET).remove([path]);
  }
  const { error } = await supabase.from("profiles").upsert(
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

// ---- Projects -----------------------------------------------------

type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  criteria: Partial<ProjectCriteria> | null;
  is_published: boolean | null;
  created_at: string;
  updated_at: string;
};

type SavedPersonRow = {
  project_id: string;
  person_id: string;
  status: "saved" | "passed";
};

export const listProjects = async (userId: string): Promise<Project[]> => {
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
      title: p.title,
      description: p.description,
      criteria: criteriaFromJson(p.criteria),
      savedPersonIds: people.saved,
      passedPersonIds: people.passed,
      isPublished: Boolean(p.is_published),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  });
};

// ---- Project create / update / publish toggle --------------------

export const createProject = async (
  userId: string,
  data: { title: string; description: string; criteria: ProjectCriteria },
): Promise<Project> => {
  const { data: row, error } = await supabase
    .from("projects")
    .insert({
      owner_id: userId,
      title: data.title,
      description: data.description,
      criteria: data.criteria,
    })
    .select("*")
    .single();
  if (error) throw error;
  const r = row as ProjectRow;
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    criteria: criteriaFromJson(r.criteria),
    savedPersonIds: [],
    passedPersonIds: [],
    isPublished: Boolean(r.is_published),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
};

export const updateProjectMeta = async (
  projectId: string,
  data: { title: string; description: string; criteria: ProjectCriteria },
): Promise<void> => {
  const { error } = await supabase
    .from("projects")
    .update({
      title: data.title,
      description: data.description,
      criteria: data.criteria,
    })
    .eq("id", projectId);
  if (error) throw error;
};

export const setProjectPublished = async (
  projectId: string,
  isPublished: boolean,
): Promise<void> => {
  const { error } = await supabase
    .from("projects")
    .update({ is_published: isPublished })
    .eq("id", projectId);
  if (error) throw error;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);
  if (error) throw error;
};

// ---- Public projects (Browse) -------------------------------------

type PublishedRpcRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  criteria: Partial<ProjectCriteria> | null;
  created_at: string;
  founder_full_name: string;
  founder_headline: string;
  founder_avatar: string | null;
};

export const listPublishedProjects = async (): Promise<PublicProject[]> => {
  const { data, error } = await supabase.rpc(
    "list_published_projects_with_founder",
  );
  if (error) throw error;
  return ((data ?? []) as PublishedRpcRow[]).map((p) => ({
    id: p.id,
    ownerId: p.owner_id,
    title: p.title,
    description: p.description,
    criteria: criteriaFromJson(p.criteria),
    createdAt: p.created_at,
    founderFullName: p.founder_full_name ?? "",
    founderHeadline: p.founder_headline ?? "",
    founderAvatarPath: p.founder_avatar ?? null,
  }));
};

// ---- Applications -------------------------------------------------

export const createApplication = async (
  projectId: string,
  message: string,
): Promise<void> => {
  const { data: userResp } = await supabase.auth.getUser();
  const candidateId = userResp.user?.id;
  if (!candidateId) throw new Error("Sign in required.");
  const { error } = await supabase.from("applications").insert({
    project_id: projectId,
    candidate_user_id: candidateId,
    message,
  });
  if (error) throw error;
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
  const { data, error } = await supabase.rpc("list_my_applications");
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

// ---- Notifications (used for chat requests) -----------------------

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
  fromUserId: string | null;
};

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
  from_user_id?: string | null;
};

export const listNotifications = async (): Promise<AppNotification[]> => {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read_at, created_at, from_user_id")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    // Older schema (pre-0011) doesn't have from_user_id; retry without it
    const fallback = await supabase
      .from("notifications")
      .select("id, type, title, body, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (fallback.error) throw fallback.error;
    return ((fallback.data ?? []) as NotificationRow[]).map(notifFromRow);
  }
  return ((data ?? []) as NotificationRow[]).map(notifFromRow);
};

const notifFromRow = (r: NotificationRow): AppNotification => ({
  id: r.id,
  type: r.type,
  title: r.title,
  body: r.body ?? "",
  link: r.link ?? null,
  readAt: r.read_at ?? null,
  createdAt: r.created_at,
  fromUserId: r.from_user_id ?? null,
});

// ---- Candidates by id (for resolving chat senders) ---------------

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

// ---- Applications received per project ----------------------------

export type IncomingApplication = {
  id: string;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
  candidate: Candidate;
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
  const { data, error } = await supabase.rpc(
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

export const updateApplicationStatus = async (
  applicationId: string,
  status: "accepted" | "rejected" | "pending",
): Promise<void> => {
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId);
  if (error) throw error;
};

// ---- Single project + saved people ------------------------------

export const getProjectById = async (
  projectId: string,
): Promise<Project | null> => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const p = data as ProjectRow;
  const { data: peopleRows } = await supabase
    .from("saved_people")
    .select("project_id, person_id, status")
    .eq("project_id", projectId);
  const saved: string[] = [];
  const passed: string[] = [];
  for (const row of (peopleRows ?? []) as SavedPersonRow[]) {
    if (row.status === "saved") saved.push(row.person_id);
    else passed.push(row.person_id);
  }
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    criteria: criteriaFromJson(p.criteria),
    savedPersonIds: saved,
    passedPersonIds: passed,
    isPublished: Boolean(p.is_published),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
};

export const removePerson = async (
  projectId: string,
  personId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("saved_people")
    .delete()
    .eq("project_id", projectId)
    .eq("person_id", personId);
  if (error) throw error;
};

// ---- Public founder profile -------------------------------------

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
};

export const getPublicFounder = async (
  userId: string,
): Promise<PublicFounder | null> => {
  const { data, error } = await supabase.rpc("get_public_founder", {
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
  };
};

type PublicProjectByOwnerRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  criteria: Partial<ProjectCriteria> | null;
  created_at: string;
};

export const listPublishedProjectsForOwner = async (
  userId: string,
): Promise<PublicProject[]> => {
  const { data, error } = await supabase.rpc(
    "list_published_projects_for_owner",
    { target_user_id: userId },
  );
  if (error) throw error;
  return ((data ?? []) as PublicProjectByOwnerRow[]).map((p) => ({
    id: p.id,
    ownerId: p.owner_id,
    title: p.title,
    description: p.description,
    criteria: criteriaFromJson(p.criteria),
    createdAt: p.created_at,
    founderFullName: "",
    founderHeadline: "",
    founderAvatarPath: null,
  }));
};

// ---- Match (AI-ranked candidates for a project) -------------------

type CandidateMatchRow = CandidateRpcRow & { similarity: number };

export const matchCandidatesForProject = async (
  projectId: string,
): Promise<Array<Candidate & { similarity: number }>> => {
  const { data, error } = await supabase.rpc(
    "match_candidates_for_project",
    { p_id: projectId },
  );
  if (error) throw error;
  return ((data ?? []) as CandidateMatchRow[]).map((row) => ({
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
    similarity: row.similarity ?? 0,
  }));
};

export const setPersonStatus = async (
  projectId: string,
  personId: string,
  status: "saved" | "passed",
): Promise<void> => {
  const { error } = await supabase
    .from("saved_people")
    .upsert(
      { project_id: projectId, person_id: personId, status },
      { onConflict: "project_id,person_id" },
    );
  if (error) throw error;
};

export const getCandidatesByIds = async (
  ids: string[],
): Promise<Candidate[]> => {
  if (ids.length === 0) return [];
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const valid = ids.filter((id) => uuidRe.test(id));
  if (valid.length === 0) return [];
  const { data, error } = await supabase.rpc("get_candidates_by_ids", {
    ids: valid,
  });
  if (error) throw error;
  return ((data ?? []) as CandidateRpcRow[]).map((row) => ({
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
  }));
};

export { emptyCandidate, emptyProfile };
