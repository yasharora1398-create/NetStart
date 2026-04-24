import { getSupabase } from "./supabase";
import {
  emptyCriteria,
  emptyProfile,
  type Profile,
  type Project,
  type ProjectCriteria,
  type ResumeMeta,
  type ReviewStatus,
} from "./mynet-types";

const RESUMES_BUCKET = "resumes";

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
};

type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  criteria: Partial<ProjectCriteria> | null;
  created_at: string;
  updated_at: string;
};

type SavedPersonRow = {
  project_id: string;
  person_id: string;
  status: "saved" | "passed";
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
  reviewStatus: row.review_status ?? "pending",
  reviewReason: row.review_reason ?? null,
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
      title: p.title,
      description: p.description,
      criteria: criteriaFromJson(p.criteria),
      savedPersonIds: people.saved,
      passedPersonIds: people.passed,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  });
};

export const createProject = async (
  userId: string,
  data: { title: string; description: string; criteria: ProjectCriteria },
): Promise<Project> => {
  const { data: row, error } = await getSupabase()
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
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
};

export const updateProject = async (
  projectId: string,
  data: { title: string; description: string; criteria: ProjectCriteria },
): Promise<void> => {
  const { error } = await getSupabase()
    .from("projects")
    .update({
      title: data.title,
      description: data.description,
      criteria: data.criteria,
    })
    .eq("id", projectId);
  if (error) throw error;
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
