import { getSupabase } from "@/lib/supabase";
import type { ReviewStatus } from "@/lib/mynet-types";

// ────────────────────────────────────────────────────────────────
// Visitor analytics
// ────────────────────────────────────────────────────────────────

export type ViewCounts = {
 last24h: number;
 last7d: number;
 last30d: number;
};

export type DailyViewPoint = {
 day: string; // YYYY-MM-DD (local)
 count: number;
};

const isoDateNDaysAgo = (n: number): string => {
 const d = new Date();
 d.setDate(d.getDate() - n);
 const y = d.getFullYear();
 const m = String(d.getMonth() + 1).padStart(2, "0");
 const day = String(d.getDate()).padStart(2, "0");
 return `${y}-${m}-${day}`;
};

// Pull every page_views row from the last 30 days and bucket
// client-side. Cheap because the table is one row per (device, day);
// even at 10k devices/day this stays small.
export const getAnalytics = async (): Promise<{
 counts: ViewCounts;
 daily: DailyViewPoint[];
}> => {
 const since = isoDateNDaysAgo(30);
 const { data, error } = await getSupabase()
 .from("page_views")
 .select("day")
 .gte("day", since);
 if (error) throw error;

 const rows = (data ?? []) as { day: string }[];
 const today = isoDateNDaysAgo(0);
 const day1 = isoDateNDaysAgo(1);
 const day7 = isoDateNDaysAgo(7);

 let last24h = 0;
 let last7d = 0;
 const last30d = rows.length;

 const perDay = new Map<string, number>();
 for (const r of rows) {
 perDay.set(r.day, (perDay.get(r.day) ?? 0) + 1);
 // "last 24h" = today + yesterday's local day; close enough for a
 // marketing dashboard without timezone gymnastics.
 if (r.day === today || r.day === day1) last24h += 1;
 if (r.day >= day7) last7d += 1;
 }

 // Build a contiguous 30-day series so the line graph has a point
 // for every day even when nobody visited.
 const daily: DailyViewPoint[] = [];
 for (let i = 29; i >= 0; i -= 1) {
 const day = isoDateNDaysAgo(i);
 daily.push({ day, count: perDay.get(day) ?? 0 });
 }

 return {
 counts: { last24h, last7d, last30d },
 daily,
 };
};

// ────────────────────────────────────────────────────────────────
// Signups + Profile status
// ────────────────────────────────────────────────────────────────

// "Just signed up" = profile exists (auto-created by handle_new_user
// trigger) but review_status is still draft.
// "Submitted" = review_status in (pending, accepted, rejected).
export type SignupRow = {
 userId: string;
 email: string;
 fullName: string;
 createdAt: string;
 reviewStatus: ReviewStatus;
 mynetSubmitted: boolean;
};

export const listAllSignups = async (): Promise<SignupRow[]> => {
 const { data, error } = await getSupabase()
 .from("profiles")
 .select("user_id, email, full_name, created_at, review_status")
 .order("created_at", { ascending: false });
 if (error) throw error;

 return (
 (data ?? []) as Array<{
 user_id: string;
 email: string | null;
 full_name: string | null;
 created_at: string;
 review_status: ReviewStatus | null;
 }>
 ).map((row) => {
 const status: ReviewStatus = row.review_status ?? "draft";
 return {
 userId: row.user_id,
 email: row.email ?? "",
 fullName: row.full_name ?? "",
 createdAt: row.created_at,
 reviewStatus: status,
 mynetSubmitted: status !== "draft",
 };
 });
};

// ────────────────────────────────────────────────────────────────
// Pending review queue (with full submitted info)
// ────────────────────────────────────────────────────────────────

export type PendingSubmission = {
 userId: string;
 email: string;
 fullName: string;
 linkedinUrl: string;
 resume: {
 name: string;
 size: number;
 uploadedAt: string;
 path: string;
 } | null;
 candidate: {
 headline: string;
 bio: string;
 skills: string[];
 location: string;
 commitment: string;
 isOpenToWork: boolean;
 };
 createdAt: string;
};

export const listPendingSubmissions = async (): Promise<PendingSubmission[]> => {
 const { data, error } = await getSupabase()
 .from("profiles")
 .select(
 "user_id, email, full_name, linkedin_url, resume_path, resume_name, resume_size, resume_uploaded_at, headline, bio, skills, candidate_location, candidate_commitment, is_open_to_work, created_at",
 )
 .eq("review_status", "pending")
 .order("created_at", { ascending: false });
 if (error) throw error;

 return (
 (data ?? []) as Array<{
 user_id: string;
 email: string | null;
 full_name: string | null;
 linkedin_url: string | null;
 resume_path: string | null;
 resume_name: string | null;
 resume_size: number | null;
 resume_uploaded_at: string | null;
 headline: string | null;
 bio: string | null;
 skills: string[] | null;
 candidate_location: string | null;
 candidate_commitment: string | null;
 is_open_to_work: boolean | null;
 created_at: string;
 }>
 ).map((row) => ({
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
 candidate: {
 headline: row.headline ?? "",
 bio: row.bio ?? "",
 skills: row.skills ?? [],
 location: row.candidate_location ?? "",
 commitment: row.candidate_commitment ?? "",
 isOpenToWork: Boolean(row.is_open_to_work),
 },
 createdAt: row.created_at,
 }));
};
