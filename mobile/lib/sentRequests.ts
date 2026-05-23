// Module-level store of chat requests the current user has sent. The
// Match / Saved screens call `addSentRequest(candidate)` whenever the
// user taps the "Request chat" / "Apply" CTA. The Threads tab reads
// `useSentRequests()` to merge those rows in alongside notification-
// driven ones (with a "Request sent" pill).
//
// Items are persisted to AsyncStorage under a per-user key so they
// survive app restarts. Mirrors the same pattern as savedCount.ts.
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Candidate } from "@/lib/types";

// Bumped to v2 because the shape gained `kind` and `message`. Older
// (v1) entries are silently dropped on hydrate — fine for local state.
const STORAGE_PREFIX = "vettd_sent_requests_v2:";

// Two flavors of outgoing thread state:
//   • "chat"        — a Request-chat CTA tap. Opens a chat directly.
//   • "application" — an Apply CTA tap. Partner pitched themselves
//                      to this founder's project (mirrors the web's
//                      ApplyDialog flow). The pitch text is stored
//                      so it can render under the row in Threads.
export type SentRequestKind = "chat" | "application";

export type SentRequest = {
  candidate: Candidate;
  sentAt: string;
  kind: SentRequestKind;
  message?: string;
};

let items: SentRequest[] = [];
let currentUserId: string | null = null;
const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) l();
};

const persist = (): void => {
  if (!currentUserId) return;
  AsyncStorage.setItem(
    STORAGE_PREFIX + currentUserId,
    JSON.stringify(items),
  ).catch(() => {});
};

// Bind the store to a user. On sign-in, hydrates from AsyncStorage.
// On sign-out (userId = null), clears the in-memory list.
export const setSentRequestsUser = async (
  userId: string | null,
): Promise<void> => {
  if (userId === currentUserId) return;
  currentUserId = userId;
  if (!userId) {
    items = [];
    emit();
    return;
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_PREFIX + userId);
    if (raw) {
      const parsed = JSON.parse(raw) as SentRequest[];
      if (Array.isArray(parsed)) {
        items = parsed;
        emit();
        return;
      }
    }
  } catch {
    // ignore — fall through to empty
  }
  items = [];
  emit();
};

// Adds (or refreshes) a sent-request entry. Dedups by userId so the
// most recent send wins and the row floats to the top.
export const addSentRequest = (
  candidate: Candidate,
  kind: SentRequestKind = "chat",
  message?: string,
): void => {
  items = [
    { candidate, sentAt: new Date().toISOString(), kind, message },
    ...items.filter((i) => i.candidate.userId !== candidate.userId),
  ];
  emit();
  persist();
};

export const removeSentRequest = (userId: string): void => {
  const next = items.filter((i) => i.candidate.userId !== userId);
  if (next.length !== items.length) {
    items = next;
    emit();
    persist();
  }
};

export const useSentRequests = (): SentRequest[] => {
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
