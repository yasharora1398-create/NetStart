import { getSupabase } from "./supabase";

// Two-tab review feed: one bucket reviewing the founder experience,
// one bucket reviewing the partner experience. target_role labels
// the side being reviewed, NOT the author. An operator might write
// a founder review (rating their experience working with founders);
// a founder might write a partner review.
export type ReviewTargetRole = "founder" | "partner";

export type Review = {
 id: string;
 authorId: string;
 authorFullName: string;
 authorAvatarPath: string | null;
 targetRole: ReviewTargetRole;
 title: string;
 rating: number;
 body: string;
 createdAt: string;
};

type ReviewRpcRow = {
 id: string;
 author_id: string;
 author_full_name: string;
 author_avatar_path: string | null;
 target_role: ReviewTargetRole;
 title: string;
 rating: number;
 body: string;
 created_at: string;
};

const rowToReview = (r: ReviewRpcRow): Review => ({
 id: r.id,
 authorId: r.author_id,
 authorFullName: r.author_full_name ?? "",
 authorAvatarPath: r.author_avatar_path ?? null,
 targetRole: r.target_role,
 title: r.title,
 rating: r.rating,
 body: r.body ?? "",
 createdAt: r.created_at,
});

export const listReviews = async (
 targetRole: ReviewTargetRole,
): Promise<Review[]> => {
 const { data, error } = await getSupabase().rpc("list_reviews", {
 role_filter: targetRole,
 });
 if (error) {
 const msg = error.message || "";
 if (/list_reviews/i.test(msg) || /relation.*reviews/i.test(msg)) {
 throw new Error(
 "Reviews table is missing. Run supabase/migrations/0041_reviews.sql in the Supabase SQL editor.",
 );
 }
 throw error;
 }
 return ((data ?? []) as ReviewRpcRow[]).map(rowToReview);
};

export const createReview = async (input: {
 targetRole: ReviewTargetRole;
 title: string;
 rating: number;
 body: string;
}): Promise<void> => {
 const supabase = getSupabase();
 const { data: userResp } = await supabase.auth.getUser();
 const uid = userResp.user?.id;
 if (!uid) throw new Error("Sign in to leave a review.");
 const title = input.title.trim();
 if (title.length === 0) throw new Error("Add a title.");
 if (input.rating < 1 || input.rating > 5) {
 throw new Error("Pick a rating from 1 to 5.");
 }
 const { error } = await supabase.from("reviews").insert({
 author_id: uid,
 target_role: input.targetRole,
 title,
 rating: input.rating,
 body: input.body.trim(),
 });
 if (error) {
 const msg = error.message || "";
 if (/relation.*reviews/i.test(msg) || /schema cache/i.test(msg)) {
 throw new Error(
 "Reviews table is missing. Run supabase/migrations/0041_reviews.sql in the Supabase SQL editor.",
 );
 }
 throw new Error(`Could not post review: ${msg}`);
 }
};
