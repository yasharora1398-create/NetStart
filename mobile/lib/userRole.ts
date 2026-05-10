// User role state — "founder" or "builder". Picked at sign-up, stored
// on the Supabase auth user's user_metadata so it survives reinstalls
// and rides with the account on every device.
//
// Existing users who signed up before the picker existed will have no
// `role` in metadata; for those, callers should fall back to a heuristic
// (e.g. projects.length > 0 → founder).
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export type Role = "founder" | "builder";

export const readMetadataRole = (
  user: { user_metadata?: Record<string, unknown> } | null,
): Role | null => {
  const r = user?.user_metadata?.role;
  return r === "founder" || r === "builder" ? r : null;
};

export const updateRole = async (role: Role): Promise<void> => {
  await supabase.auth.updateUser({ data: { role } });
};

// Convenience hook — returns the user's current role, with a default
// fallback for users created before the picker shipped.
export const useUserRole = (fallback: Role = "builder"): Role => {
  const { user } = useAuth();
  const [role, setRole] = useState<Role>(
    readMetadataRole(user) ?? fallback,
  );
  useEffect(() => {
    setRole(readMetadataRole(user) ?? fallback);
  }, [user, fallback]);
  return role;
};
