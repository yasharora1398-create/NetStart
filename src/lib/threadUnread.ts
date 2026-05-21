/**
 * Per-user "mark thread as unread" store. Local-only - Supabase has
 * no concept of a user-flagged-unread thread, so we track this in
 * localStorage and a tiny in-memory pub/sub.
 *
 * Use case: user reads a thread on phone, wants to come back to it
 * on web later, marks it unread. The Threads list shows a dot on
 * marked threads until they're explicitly cleared.
 *
 * Scope: per-user (key includes userId). Switching users doesn't
 * leak flags between accounts.
 */
import { useEffect, useState } from "react";

const STORAGE_PREFIX = "polln8.thread_unread.v1:";

let flagged: Set<string> = new Set();
let currentUserId: string | null = null;
const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) l();
};

const persist = (): void => {
  if (!currentUserId) return;
  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + currentUserId,
      JSON.stringify(Array.from(flagged)),
    );
  } catch {
    // storage full / disabled - non-fatal
  }
};

export const setThreadUnreadUser = (userId: string | null): void => {
  if (userId === currentUserId) return;
  currentUserId = userId;
  if (!userId) {
    flagged = new Set();
    emit();
    return;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + userId);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      flagged = new Set(Array.isArray(parsed) ? parsed : []);
    } else {
      flagged = new Set();
    }
  } catch {
    flagged = new Set();
  }
  emit();
};

export const markThreadUnread = (contactId: string): void => {
  if (flagged.has(contactId)) return;
  flagged = new Set(flagged);
  flagged.add(contactId);
  emit();
  persist();
};

export const clearThreadUnread = (contactId: string): void => {
  if (!flagged.has(contactId)) return;
  flagged = new Set(flagged);
  flagged.delete(contactId);
  emit();
  persist();
};

export const isThreadMarkedUnread = (contactId: string): boolean =>
  flagged.has(contactId);

export const useThreadUnreadFlags = (): Set<string> => {
  const [, force] = useState(0);
  useEffect(() => {
    const listener = () => force((v) => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return flagged;
};
