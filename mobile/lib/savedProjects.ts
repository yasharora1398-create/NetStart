/**
 * Saved-projects store (builder side). Mirrors `savedCount.ts` but
 * for `PublicProject` rows: builders bookmark projects they might
 * want to join while browsing Search or the project detail page.
 *
 * Two pieces of per-user state:
 *   1. `items`     — list of saved projects, deduped by id
 *   2. `activeId`  — id of the project the builder has chosen as
 *                    their "current focus" (one or none)
 *
 * Both persist to AsyncStorage so saves survive restarts. A tiny
 * pub/sub keeps the Saved tab, project detail screen, and search
 * row in sync without forcing a refetch. Saving a project bumps
 * the Saved-tab unread badge so the builder notices new items
 * land even when they're on a different tab.
 */
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PublicProject } from "@/lib/types";
import { bumpUnread } from "@/lib/unread";

const ITEMS_PREFIX = "polln8.saved_projects.v1:";
const ACTIVE_PREFIX = "polln8.saved_projects.active.v1:";

let items: PublicProject[] = [];
let activeId: string | null = null;
let currentUserId: string | null = null;
const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) l();
};

const persistItems = (): void => {
  if (!currentUserId) return;
  AsyncStorage.setItem(
    ITEMS_PREFIX + currentUserId,
    JSON.stringify(items),
  ).catch(() => {});
};

const persistActive = (): void => {
  if (!currentUserId) return;
  const key = ACTIVE_PREFIX + currentUserId;
  if (activeId === null) {
    AsyncStorage.removeItem(key).catch(() => {});
  } else {
    AsyncStorage.setItem(key, activeId).catch(() => {});
  }
};

// Bind the store to a user. On sign-in, hydrates from AsyncStorage.
// On sign-out (userId = null), clears the in-memory list without
// touching storage so the next sign-in for that user still gets
// their saves back.
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
    const [rawItems, rawActive] = await Promise.all([
      AsyncStorage.getItem(ITEMS_PREFIX + userId),
      AsyncStorage.getItem(ACTIVE_PREFIX + userId),
    ]);
    if (rawItems) {
      const parsed = JSON.parse(rawItems) as PublicProject[];
      items = Array.isArray(parsed) ? parsed : [];
    } else {
      items = [];
    }
    activeId = rawActive ?? null;
    emit();
  } catch {
    items = [];
    activeId = null;
    emit();
  }
};

export const addSavedProject = (project: PublicProject): void => {
  if (items.some((p) => p.id === project.id)) return;
  items = [project, ...items];
  emit();
  persistItems();
  // Tab-bar badge bumps so the builder sees something landed even
  // if they're on Match when they save from the project detail.
  bumpUnread("saved");
};

export const removeSavedProject = (projectId: string): void => {
  const next = items.filter((p) => p.id !== projectId);
  if (next.length === items.length) return;
  items = next;
  // If the removed project was the active focus, clear it too.
  if (activeId === projectId) {
    activeId = null;
    persistActive();
  }
  emit();
  persistItems();
};

// Re-saving an already-saved project replaces the row in place
// (handy when a project's title/description changed since the
// last save). Used by the project detail page when the builder
// taps the bookmark on a project they've already saved — actually
// no, in that case we unsave. This keeps the API symmetric for
// callers that want "freshen the cached row".
export const refreshSavedProject = (project: PublicProject): void => {
  const idx = items.findIndex((p) => p.id === project.id);
  if (idx === -1) return;
  const next = [...items];
  next[idx] = project;
  items = next;
  emit();
  persistItems();
};

// Pick (or unpick) one saved project as the builder's current focus.
// Tapping the same id again clears the focus. Setting to a project
// that isn't saved is a no-op.
export const setActiveSavedProject = (projectId: string | null): void => {
  if (projectId !== null && !items.some((p) => p.id === projectId)) return;
  const next = activeId === projectId ? null : projectId;
  if (next === activeId) return;
  activeId = next;
  emit();
  persistActive();
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
