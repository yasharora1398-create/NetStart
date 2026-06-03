// Light wrapper around getProfile that yields just the review
// status. Used by every AppLayout-wrapped page that needs to gate
// its content on whether the user's Profile profile has been
// approved (status="accepted"). Returns `null` while loading so
// callers can hold the gate until the answer lands.
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProfile } from "@/lib/mynet-storage";
import type { ReviewStatus } from "@/lib/mynet-types";

export const useReviewStatus = (): ReviewStatus | null => {
 const { user } = useAuth();
 const [status, setStatus] = useState<ReviewStatus | null>(null);
 useEffect(() => {
 if (!user) {
 setStatus(null);
 return;
 }
 let cancelled = false;
 getProfile(user.id)
 .then((p) => {
 if (!cancelled) setStatus(p.reviewStatus);
 })
 .catch(() => {
 // soft-fail; treat as "draft" so the gate prompts setup
 if (!cancelled) setStatus("draft");
 });
 return () => {
 cancelled = true;
 };
 }, [user]);
 return status;
};
