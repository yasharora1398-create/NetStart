/**
 * Saved-projects store (web). Mirrors mobile/lib/savedProjects.ts:
 * a per-user, localStorage-backed list of `PublicProject` rows that
 * builders bookmark from Match / Talent / project detail.
 *
 * Two pieces of state per user:
 *   1. items     — list of saved projects, deduped by id
 *   2. activeId  — the project the builder picked as their "current
 *                  focus" (one or none)
 *
 * A tiny pub/sub keeps every consumer (Saved page, Match card,
 * project detail) in sync without forcing a refetch.
 */
import { useEffect, useState } from "react";
import type { PublicProject } from "./mynet-types";

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
  try {
    window.localStorage.setItem(
      ITEMS_PREFIX + currentUserId,
      JSON.stringify(items),
    );
  } catch {
    // storage full / disabled — non-fatal
  }
};

const persistActive = (): void => {
  if (!currentUserId) return;
  const key = ACTIVE_PREFIX + currentUserId;
  try {
    if (activeId === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, activeId);
    }
  } catch {
    // ignore
  }
};

// Bind the store to a user. On sign-in, hydrate from localStorage.
// On sign-out (userId = null), clear in-memory without touching
// storage so the next sign-in for that user still gets their data.
export const setSavedProjectsUser = (userId: string | null): void => {
  if (userId === currentUserId) return;
  currentUserId = userId;
  if (!userId) {
    items = [];
    activeId = null;
    emit();
    return;
  }
  try {
    const rawItems = window.localStorage.getItem(ITEMS_PREFIX + userId);
    if (rawItems) {
      const parsed = JSON.parse(rawItems) as PublicProject[];
      items = Array.isArray(parsed) ? parsed : [];
    } else {
      items = [];
    }
    activeId = window.localStorage.getItem(ACTIVE_PREFIX + userId);
  } catch {
    items = [];
    activeId = null;
  }
  emit();
};

export const addSavedProject = (project: PublicProject): void => {
  if (items.some((p) => p.id === project.id)) return;
  items = [project, ...items];
  emit();
  persistItems();
};

export const removeSavedProject = (projectId: string): void => {
  const next = items.filter((p) => p.id !== projectId);
  if (next.length === items.length) return;
  items = next;
  if (activeId === projectId) {
    activeId = null;
    persistActive();
  }
  emit();
  persistItems();
};

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

export const useSavedProjectsCount = (): number => useSavedProjects().length;

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
