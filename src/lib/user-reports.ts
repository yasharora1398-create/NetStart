import { getSupabase } from "./supabase";

/**
 * Polln8 user reports (migration 0025).
 *
 * Anyone signed in can file a report against another user; admins
 * read the queue from the Admin page. The SQL RPC enforces both the
 * "must be signed in" and "can't report yourself" rules so the UI
 * doesn't need to defend against them either.
 */

export type ReportCategory =
 | "spam"
 | "harassment"
 | "fake"
 | "inappropriate"
 | "other";

export type UserReport = {
 id: string;
 reporterId: string;
 reportedId: string;
 category: ReportCategory;
 reason: string;
 resolved: boolean;
 resolvedAt: string | null;
 resolutionNote: string | null;
 createdAt: string;
};

export const reportUser = async (
 reportedUserId: string,
 category: ReportCategory,
 reason: string,
): Promise<string> => {
 const { data, error } = await getSupabase().rpc("report_user", {
 p_reported_id: reportedUserId,
 p_category: category,
 p_reason: reason.trim(),
 });
 if (error) throw error;
 return data as string;
};

// Admin-only: list everything unresolved first, then resolved.
export const listAllReports = async (): Promise<UserReport[]> => {
 const { data, error } = await getSupabase()
 .from("user_reports")
 .select(
 "id, reporter_id, reported_id, category, reason, resolved, resolved_at, resolution_note, created_at",
 )
 .order("resolved", { ascending: true })
 .order("created_at", { ascending: false });
 if (error) throw error;
 return ((data ?? []) as Array<{
 id: string;
 reporter_id: string;
 reported_id: string;
 category: ReportCategory;
 reason: string;
 resolved: boolean;
 resolved_at: string | null;
 resolution_note: string | null;
 created_at: string;
 }>).map((r) => ({
 id: r.id,
 reporterId: r.reporter_id,
 reportedId: r.reported_id,
 category: r.category,
 reason: r.reason,
 resolved: r.resolved,
 resolvedAt: r.resolved_at,
 resolutionNote: r.resolution_note,
 createdAt: r.created_at,
 }));
};

export const resolveReport = async (
 reportId: string,
 note: string,
): Promise<void> => {
 const { error } = await getSupabase()
 .from("user_reports")
 .update({
 resolved: true,
 resolved_at: new Date().toISOString(),
 resolution_note: note.trim() || null,
 })
 .eq("id", reportId);
 if (error) throw error;
};
