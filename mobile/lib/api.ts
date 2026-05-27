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
 type ProjectLifecycle,
 type PublicProject,
 type ResumeMeta,
 type ReviewStatus,
} from "./types";

const AVATARS_BUCKET = "avatars";
const RESUMES_BUCKET = "resumes";
const PROOFS_BUCKET = "proofs";

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

// Resumes live in a private bucket, so we mint a short-lived signed
// URL on demand. Returns null if the path is missing or the bucket
// rejects the request.
export const getResumeUrl = async (
 path: string | null,
): Promise<string | null> => {
 if (!path) return null;
 const { data, error } = await supabase.storage
 .from(RESUMES_BUCKET)
 .createSignedUrl(path, 60 * 5);
 if (error) return null;
 return data?.signedUrl ?? null;
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
 // Founder-only fields (added in migrations 0017 / 0018)
 website_url: string | null;
 proof_path: string | null;
 proof_name: string | null;
 proof_size: number | null;
 proof_uploaded_at: string | null;
 active_project_id: string | null;
 review_status: ReviewStatus | null;
 review_reason: string | null;
 reviewed_at: string | null;
 submitted_at: string | null;
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
 websiteUrl: row.website_url ?? "",
 proof:
 row.proof_path && row.proof_name
 ? {
 name: row.proof_name,
 size: row.proof_size ?? 0,
 uploadedAt: row.proof_uploaded_at ?? new Date().toISOString(),
 }
 : null,
 activeProjectId: row.active_project_id ?? null,
 reviewStatus: row.review_status ?? "draft",
 reviewReason: row.review_reason ?? null,
 reviewedAt: row.reviewed_at ?? null,
 submittedAt: row.submitted_at ?? null,
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

// ---- Founder website + proof-of-work --------------------------------
// Founders use these instead of resume_*. The `proofs` storage bucket
// (migration 0017) holds the file, structured `<user_id>/<filename>`.

export const setWebsite = async (
 userId: string,
 url: string,
): Promise<void> => {
 const { error } = await supabase.from("profiles").upsert(
 { user_id: userId, website_url: url ?? "" },
 { onConflict: "user_id" },
 );
 if (error) throw error;
};

export const getProofPath = async (
 userId: string,
): Promise<string | null> => {
 const { data, error } = await supabase
 .from("profiles")
 .select("proof_path")
 .eq("user_id", userId)
 .maybeSingle();
 if (error) throw error;
 return (data?.proof_path as string | null) ?? null;
};

export const uploadProofFromUri = async (
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
 .from(PROOFS_BUCKET)
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
 proof_path: path,
 proof_name: fileName,
 proof_size: fileSize,
 proof_mime_type: mimeType,
 proof_uploaded_at: uploadedAt,
 },
 { onConflict: "user_id" },
 );
 if (profErr) {
 await supabase.storage.from(PROOFS_BUCKET).remove([path]);
 throw profErr;
 }
 if (previousPath) {
 await supabase.storage.from(PROOFS_BUCKET).remove([previousPath]);
 }
 return { name: fileName, size: fileSize, uploadedAt, path };
};

export const removeProof = async (
 userId: string,
 path: string | null,
): Promise<void> => {
 if (path) {
 await supabase.storage.from(PROOFS_BUCKET).remove([path]);
 }
 const { error } = await supabase.from("profiles").upsert(
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

// ---- Projects -----------------------------------------------------

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

export const listProjects = async (userId: string): Promise<Project[]> => {
 // Polln8-recommended posts (created via the admin web Recommend
 // form) have owner_id = admin's uid but aren't the admin's "own"
 // project - they're featured cards posted on behalf of someone
 // else. Filter them out of everything that asks for "my projects"
 // (MyNet, Match active-project picker, Saved, Applications). The
 // admin can still manage them from the web /admin My Posts tab.
 const { data: projectRows, error: projectsError } = await supabase
 .from("projects")
 .select("*")
 .eq("owner_id", userId)
 .eq("is_polln8_recommended", false)
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
 businessType: p.business_type ?? "",
 lifecycleState: (p.lifecycle_state ?? "active") as ProjectLifecycle,
 savedPersonIds: people.saved,
 passedPersonIds: people.passed,
 isPublished: Boolean(p.is_published),
 createdAt: p.created_at,
 updatedAt: p.updated_at,
 ownerId: p.owner_id,
 };
 });
};

// ---- Project create / update / publish toggle --------------------

export const createProject = async (
 userId: string,
 data: {
 title: string;
 description: string;
 criteria: ProjectCriteria;
 businessType?: string;
 },
): Promise<Project> => {
 const { data: row, error } = await supabase
 .from("projects")
 .insert({
 owner_id: userId,
 title: data.title,
 description: data.description,
 criteria: data.criteria,
 business_type: data.businessType ?? "",
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
 businessType: r.business_type ?? "",
 lifecycleState: (r.lifecycle_state ?? "active") as ProjectLifecycle,
 savedPersonIds: [],
 passedPersonIds: [],
 isPublished: Boolean(r.is_published),
 createdAt: r.created_at,
 updatedAt: r.updated_at,
 ownerId: r.owner_id,
 };
};

export const updateProjectMeta = async (
 projectId: string,
 data: {
 title: string;
 description: string;
 criteria: ProjectCriteria;
 businessType?: string;
 },
): Promise<void> => {
 const { error } = await supabase
 .from("projects")
 .update({
 title: data.title,
 description: data.description,
 criteria: data.criteria,
 business_type: data.businessType ?? "",
 })
 .eq("id", projectId);
 if (error) throw error;
};

// Set or clear the founder's "currently focused" project. Drives
// Browse / Search ranking on mobile. Pass null to clear.
export const setActiveProject = async (
 userId: string,
 projectId: string | null,
): Promise<void> => {
 const { error } = await supabase.from("profiles").upsert(
 { user_id: userId, active_project_id: projectId },
 { onConflict: "user_id" },
 );
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
 business_type?: string | null;
 lifecycle_state?: string | null;
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
 businessType: p.business_type ?? "",
 lifecycleState: (p.lifecycle_state ?? "active") as ProjectLifecycle,
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

// Founder-side: every application across every project the caller
// owns, with the candidate fields needed to render the row.
export type ReceivedApplication = {
 id: string;
 message: string;
 status: ApplicationStatus;
 createdAt: string;
 projectId: string;
 projectTitle: string;
 candidate: Candidate;
};

type ReceivedAppRow = {
 application_id: string;
 message: string;
 status: ApplicationStatus;
 created_at: string;
 project_id: string;
 project_title: string;
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

export const listReceivedApplications = async (): Promise<
 ReceivedApplication[]
> => {
 const { data, error } = await supabase.rpc("list_received_applications");
 if (error) throw error;
 return ((data ?? []) as ReceivedAppRow[]).map((r) => ({
 id: r.application_id,
 message: r.message ?? "",
 status: r.status,
 createdAt: r.created_at,
 projectId: r.project_id,
 projectTitle: r.project_title,
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

// Per-side archive. Partners archive their own view (the founder
// still sees the application on theirs, and vice-versa).
export const archiveApplicationForCandidate = async (
 applicationId: string,
): Promise<void> => {
 const { error } = await supabase.rpc("archive_application_for_candidate", {
 app_id: applicationId,
 });
 if (error) throw error;
};

export const archiveApplicationForOwner = async (
 applicationId: string,
): Promise<void> => {
 const { error } = await supabase.rpc("archive_application_for_owner", {
 app_id: applicationId,
 });
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
 businessType: p.business_type ?? "",
 lifecycleState: (p.lifecycle_state ?? "active") as ProjectLifecycle,
 savedPersonIds: saved,
 passedPersonIds: passed,
 isPublished: Boolean(p.is_published),
 createdAt: p.created_at,
 updatedAt: p.updated_at,
 ownerId: p.owner_id,
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
 businessType: "",
 lifecycleState: "active" as ProjectLifecycle,
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

// Search-tab use: list every accepted, open-to-work partner. Founders
// filter the results client-side. The SECURITY DEFINER RPC scrubs
// fields so we only get safe public columns.
type OpenCandidateRow = {
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
};

export const listOpenCandidates = async (): Promise<Candidate[]> => {
 const { data, error } = await supabase.rpc("list_open_candidates");
 if (error) throw error;
 return ((data ?? []) as OpenCandidateRow[]).map((row) => ({
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
 avatarPath: null,
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

// ---- Chat / DMs ---------------------------------------------------
//
// Backend lives in migrations 0011 (chat_contacts + request/accept) and
// 0013 (chat_messages + list_chat_thread + send_chat_message). The
// flow is:
// 1. Sender calls request_chat(target) → recipient gets a
// chat_request notification.
// 2. Recipient taps Accept in Threads → accept_chat_request promotes
// both sides into chat_contacts.
// 3. Either side calls send_chat_message - RLS requires both users
// to be in chat_contacts together.
// 4. UI subscribes to realtime inserts on chat_messages to render
// incoming DMs live.

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

// Send a chat request notification. The target's notification feed
// gets a "wants to chat" entry; until they accept, no messages can be
// sent (RLS on send_chat_message blocks it).
export const requestChat = async (
 targetUserId: string,
 projectId: string | null = null,
): Promise<void> => {
 const { error } = await supabase.rpc("request_chat", {
 target_user_id: targetUserId,
 project_id: projectId,
 });
 if (error) throw error;
};

// Accept an inbound chat_request notification. Promotes both users
// into chat_contacts and notifies the sender.
export const acceptChatRequest = async (
 notificationId: string,
): Promise<void> => {
 const { error } = await supabase.rpc("accept_chat_request", {
 notification_id: notificationId,
 });
 if (error) throw error;
};

// Load the full message thread between the current user and another.
export const listChatThread = async (
 otherUserId: string,
 limit = 200,
): Promise<ChatMessage[]> => {
 const { data, error } = await supabase.rpc("list_chat_thread", {
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

// Bulk-mark every undelivered message from `otherUserId` to me as
// delivered. Called by the global "I'm online" subscription when an
// inbound message lands.
export const markMessagesDelivered = async (
 otherUserId: string,
): Promise<void> => {
 const { error } = await supabase.rpc("mark_messages_delivered", {
 other_user_id: otherUserId,
 });
 if (error) throw error;
};

// Bulk-mark every unread message from `otherUserId` to me as read.
// Called when the chat screen with this sender is opened (and on
// every new INSERT while it's in the foreground).
export const markMessagesRead = async (
 otherUserId: string,
): Promise<void> => {
 const { error } = await supabase.rpc("mark_messages_read", {
 other_user_id: otherUserId,
 });
 if (error) throw error;
};

// Send a chat message. Throws if the two users aren't chat_contacts
// (the recipient hasn't accepted yet).
export const sendChatMessage = async (
 recipientUserId: string,
 body: string,
): Promise<string> => {
 const { data, error } = await supabase.rpc("send_chat_message", {
 recipient_user_id: recipientUserId,
 message_body: body,
 });
 if (error) throw error;
 return data as string;
};

// Stage 4 unified send. First message creates the pending row, the
// 2-per-48h window throttles unaccepted threads, and accepted
// threads pass straight through. The error message "limit_reached"
// signals the UI to render a wait state.
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

// Fetch the polln8 alias fields for a project id. Used by the chat
// detail page when the URL carries ?via=<id> from a recommendation
// card - the contact row may not exist yet (first visit before any
// message has been sent), so we can't rely on list_chat_contacts for
// the override. Returns null when the project isn't a polln8
// recommendation or doesn't exist.
export const getPolln8ProjectAlias = async (
 projectId: string,
): Promise<{ name: string; avatarPath: string | null } | null> => {
 const { data, error } = await supabase
 .from("projects")
 .select(
 "polln8_founder_name, polln8_founder_avatar_path, is_polln8_recommended",
 )
 .eq("id", projectId)
 .single();
 if (error || !data) return null;
 const row = data as {
 polln8_founder_name: string | null;
 polln8_founder_avatar_path: string | null;
 is_polln8_recommended: boolean | null;
 };
 if (!row.is_polln8_recommended) return null;
 const name = (row.polln8_founder_name ?? "").trim();
 if (!name) return null;
 return {
 name,
 avatarPath: (row.polln8_founder_avatar_path ?? "").trim() || null,
 };
};

export const requestOrSendChatMessage = async (
 recipientUserId: string,
 body: string,
 // Polln8-recommended project id. Stamped on chat_contacts so the
 // requester sees the recommendation's branded founder name + photo
 // instead of the admin owner. Null for normal chats.
 viaProjectId: string | null = null,
): Promise<{
 messageId: string;
 pendingCount: number;
 pendingWindowStartAt: string | null;
}> => {
 const { data, error } = await supabase.rpc(
 "request_or_send_chat_message",
 {
 recipient_user_id: recipientUserId,
 message_body: body,
 via_project_id: viaProjectId,
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

// Recipient accepts an inbound chat. Creates the mutual rows and
// drops the pending limit. Idempotent: safe if already accepted.
export const acceptChatThread = async (
 requesterUserId: string,
): Promise<void> => {
 const { error } = await supabase.rpc("accept_chat_thread", {
 requester_user_id: requesterUserId,
 });
 if (error) throw error;
};

// Recipient declines an inbound chat. The thread remains in the
// list with state="declined" so both sides can choose to delete.
export const declineChatThread = async (
 requesterUserId: string,
): Promise<void> => {
 const { error } = await supabase.rpc("decline_chat_thread", {
 requester_user_id: requesterUserId,
 });
 if (error) throw error;
};

// Either side calls this to drop the thread from their own list.
// Removes both chat_contacts rows so the row doesn't pop back in
// next time the other party messages.
export const deleteChatThread = async (
 otherUserId: string,
): Promise<void> => {
 const { error } = await supabase.rpc("delete_chat_thread", {
 other_user_id: otherUserId,
 });
 if (error) throw error;
};

// Per-contact mute. When true, the chat_message email/in-app
// notification trigger skips this sender (migration 0029).
// One-sided - the other person isn't told.
export const getChatMute = async (
 otherUserId: string,
): Promise<boolean> => {
 const { data, error } = await supabase.rpc("get_chat_mute", {
 other_user_id: otherUserId,
 });
 if (error) throw error;
 return Boolean(data);
};

export const setChatMute = async (
 otherUserId: string,
 muted: boolean,
): Promise<void> => {
 const { error } = await supabase.rpc("set_chat_mute", {
 other_user_id: otherUserId,
 next_muted: muted,
 });
 if (error) throw error;
};

// Founder-only: change the lifecycle state on one of their
// projects. Browse / Search hide non-active projects.
export const setProjectLifecycle = async (
 projectId: string,
 state: ProjectLifecycle,
): Promise<void> => {
 const { error } = await supabase.rpc("set_project_lifecycle", {
 project_id: projectId,
 new_state: state,
 });
 if (error) throw error;
};

// Read the current pending state for one thread. Mobile uses this
// to decide whether to render the limit indicator or the Accept
// button.
// Threads list with pending state baked in. Returns one row per
// known counterparty (someone I've sent or received a message from,
// or someone who's pending acceptance from me).
export type ChatThreadSummary = {
 contactId: string;
 lastBody: string;
 lastAt: string | null;
 lastSender: string | null;
 state: ThreadState;
 acceptedAt: string | null;
 // Polln8-recommended chat alias - non-null when chat_contacts was
 // stamped with via_project_id and the project is is_polln8_recommended.
 aliasName: string | null;
 aliasAvatarPath: string | null;
};

type ChatThreadsRpcRow = {
 contact_id: string;
 last_body: string | null;
 last_at: string | null;
 last_sender: string | null;
 state: ThreadState;
 accepted_at: string | null;
 alias_name: string | null;
 alias_avatar_path: string | null;
};

export const listChatThreads = async (): Promise<ChatThreadSummary[]> => {
 const { data, error } = await supabase.rpc("list_chat_threads");
 if (error) throw error;
 return ((data ?? []) as ChatThreadsRpcRow[]).map((r) => ({
 contactId: r.contact_id,
 lastBody: r.last_body ?? "",
 lastAt: r.last_at ?? null,
 lastSender: r.last_sender ?? null,
 state: r.state ?? "none",
 acceptedAt: r.accepted_at ?? null,
 aliasName: r.alias_name ?? null,
 aliasAvatarPath: r.alias_avatar_path ?? null,
 }));
};

export const getChatThreadState = async (
 otherUserId: string,
): Promise<ChatThreadState> => {
 const { data, error } = await supabase.rpc("get_chat_thread_state", {
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

export type ChatContact = {
 contactId: string;
 fullName: string;
 linkedinUrl: string;
 avatarPath: string | null;
 connectedAt: string;
};

type ChatContactRow = {
 contact_id: string;
 full_name: string;
 linkedin_url: string;
 avatar_path: string | null;
 connected_at: string;
};

export const listChatContacts = async (): Promise<ChatContact[]> => {
 const { data, error } = await supabase.rpc("list_chat_contacts");
 if (error) throw error;
 return ((data ?? []) as ChatContactRow[]).map((r) => ({
 contactId: r.contact_id,
 fullName: r.full_name ?? "",
 linkedinUrl: r.linkedin_url ?? "",
 avatarPath: r.avatar_path ?? null,
 connectedAt: r.connected_at,
 }));
};

export { emptyCandidate, emptyProfile };
