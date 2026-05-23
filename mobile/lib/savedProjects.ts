/**
 * Saved-projects store (mobile, partner side). Cross-device, persisted
 * on the server in public.saved_projects (migration 0030). Same shape
 * as the web store so a partner who saves on their phone sees it on
 * their laptop.
 *
 * Two pieces of per-user state:
 *   1. `items`     — list of saved PublicProject rows, deduped by id
 *   2. `activeId`  — id of the project the partner picked as their
 *                    "current focus" (one or none).
 *
 * Reads: hydrate from `list_saved_projects()` RPC on user bind.
 * Writes: optimistic — update memory + emit, then await the round
 *         trip; on failure, undo and log.
 *
 * Saving a project bumps the Saved-tab unread badge so the partner
 * notices new items land even when they're on a different tab.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PublicProject } from "@/lib/types";
import { bumpUnread } from "@/lib/unread";

let items: PublicProject[] = [];
let activeId: string | null = null;
let currentUserId: string | null = null;
const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) l();
};

type SavedRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  criteria: Record<string, unknown> | null;
  business_type: string;
  lifecycle_state: string;
  created_at: string;
  founder_full_name: string;
  founder_headline: string;
  founder_avatar_path: string | null;
  is_active: boolean;
  saved_at: string;
};

const rowToProject = (r: SavedRow): PublicProject => {
  const c = (r.criteria ?? {}) as Partial<{
    skills: string[];
    commitment: string;
    location: string;
    keywords: string;
  }>;
  return {
    id: r.id,
    ownerId: r.owner_id,
    title: r.title,
    description: r.description,
    criteria: {
      skills: Array.isArray(c.skills) ? c.skills : [],
      commitment: typeof c.commitment === "string" ? c.commitment : "",
      location: typeof c.location === "string" ? c.location : "",
      keywords: typeof c.keywords === "string" ? c.keywords : "",
    },
    businessType: r.business_type ?? "",
    lifecycleState: (r.lifecycle_state ?? "active") as PublicProject["lifecycleState"],
    createdAt: r.created_at,
    founderFullName: r.founder_full_name ?? "",
    founderHeadline: r.founder_headline ?? "",
    founderAvatarPath: r.founder_avatar_path,
  };
};

export const setSavedProjectsUser = async (
  userId: string | null,
): Promise<void> => {
  if (userId === currentUserId) return;
  currentUserId = userId;
  if (!userId) {
    items = [];
    activeId = null;
    emit();
    return;
  }
  try {
    const { data, error } = await supabase.rpc("list_saved_projects");
    if (error) throw error;
    const rows = (data ?? []) as SavedRow[];
    if (currentUserId !== userId) return;
    items = rows.map(rowToProject);
    activeId = rows.find((r) => r.is_active)?.id ?? null;
    emit();
  } catch (err) {
    console.warn("[savedProjects] hydrate failed", err);
    items = [];
    activeId = null;
    emit();
  }
};

export const addSavedProject = async (
  project: PublicProject,
): Promise<void> => {
  if (!currentUserId) return;
  if (items.some((p) => p.id === project.id)) return;
  items = [project, ...items];
  emit();
  bumpUnread("saved");
  try {
    const { error } = await supabase.from("saved_projects").insert({
      user_id: currentUserId,
      project_id: project.id,
    });
    if (error && error.code !== "23505") throw error;
  } catch (err) {
    console.warn("[savedProjects] add failed", err);
    items = items.filter((p) => p.id !== project.id);
    emit();
  }
};

export const removeSavedProject = async (
  projectId: string,
): Promise<void> => {
  if (!currentUserId) return;
  const prev = items;
  const next = items.filter((p) => p.id !== projectId);
  if (next.length === items.length) return;
  items = next;
  const prevActive = activeId;
  if (activeId === projectId) activeId = null;
  emit();
  try {
    const { error } = await supabase
      .from("saved_projects")
      .delete()
      .eq("user_id", currentUserId)
      .eq("project_id", projectId);
    if (error) throw error;
  } catch (err) {
    console.warn("[savedProjects] remove failed", err);
    items = prev;
    activeId = prevActive;
    emit();
  }
};

// Re-saving an already-saved project replaces the row in memory.
// Server row stays the same — only the cached `PublicProject`
// payload gets freshened with new title / description / etc.
export const refreshSavedProject = (project: PublicProject): void => {
  const idx = items.findIndex((p) => p.id === project.id);
  if (idx === -1) return;
  const next = [...items];
  next[idx] = project;
  items = next;
  emit();
};

export const setActiveSavedProject = async (
  projectId: string | null,
): Promise<void> => {
  if (!currentUserId) return;
  if (projectId !== null && !items.some((p) => p.id === projectId)) return;
  const target = activeId === projectId ? null : projectId;
  if (target === activeId) return;
  const prevActive = activeId;
  activeId = target;
  emit();
  try {
    const { error } = await supabase.rpc("set_active_saved_project", {
      target_project_id: target,
    });
    if (error) throw error;
  } catch (err) {
    console.warn("[savedProjects] set active failed", err);
    activeId = prevActive;
    emit();
  }
};

export const useSavedProjects = (): PublicProject[] => {
  const [, force] = useState(0);
  useEffect(() => {
    const listener = () => force((v) => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return items;
};

export const useSavedProjectsCount = (): number =>
  useSavedProjects().length;

export const useIsProjectSaved = (projectId: string): boolean => {
  const list = useSavedProjects();
  return list.some((p) => p.id === projectId);
};

export const useActiveSavedProjectId = (): string | null => {
  const [, force] = useState(0);
  useEffect(() => {
    const listener = () => force((v) => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return activeId;
};
