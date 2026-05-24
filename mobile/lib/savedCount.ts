// Module-level saved-people store. The Match screen calls
// `addSaved(candidate)` whenever the user swipes-left or taps Save.
// The Saved tab reads `useSavedItems()` to render the list. The tab
// bar reads `useSavedCount()` for the badge.
//
// Items are deduplicated by userId. They are persisted to AsyncStorage
// under a per-user key so they survive app restarts and reinstalls.
// Real-user saves from Supabase can be merged in too (see Saved tab's
// mount effect).
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Candidate } from "@/lib/types";
import { bumpUnread } from "@/lib/unread";

const STORAGE_PREFIX = "vettd_saved_v1:";

let items: Candidate[] = [];
let currentUserId: string | null = null;
const listeners = new Set<() => void>();

const emit = () => {
 for (const l of listeners) l();
};

const persist = (): void => {
 if (!currentUserId) return;
 const key = STORAGE_PREFIX + currentUserId;
 // Fire-and-forget; storage errors are non-fatal.
 AsyncStorage.setItem(key, JSON.stringify(items)).catch(() => {});
};

// Bind the store to a user. On sign-in, hydrates `items` from
// AsyncStorage. On sign-out (userId = null), clears the in-memory list
// without touching storage so the next sign-in for that user still
// gets their saves back.
export const setSavedUser = async (userId: string | null): Promise<void> => {
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
 const parsed = JSON.parse(raw) as Candidate[];
 if (Array.isArray(parsed)) {
 items = parsed;
 emit();
 return;
 }
 }
 } catch {
 // ignore - fall through to empty
 }
 items = [];
 emit();
};

export const addSaved = (candidate: Candidate): void => {
 if (items.some((c) => c.userId === candidate.userId)) return;
 items = [candidate, ...items];
 emit();
 persist();
 // Tab-bar badge bumps so the user sees there's something new even
 // if they're on a different tab when the save lands.
 bumpUnread("saved");
};

export const addSavedMany = (candidates: Candidate[]): void => {
 let changed = false;
 for (const c of candidates) {
 if (!items.some((existing) => existing.userId === c.userId)) {
 items = [c, ...items];
 changed = true;
 }
 }
 if (changed) {
 emit();
 persist();
 }
};

export const removeSaved = (userId: string): void => {
 const next = items.filter((c) => c.userId !== userId);
 if (next.length !== items.length) {
 items = next;
 emit();
 persist();
 }
};

export const resetSavedCount = (): void => {
 items = [];
 emit();
 persist();
};

export const useSavedItems = (): Candidate[] => {
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

export const useSavedCount = (): number => useSavedItems().length;

// Legacy export kept for compatibility - addSaved is the real API now.
export const incrementSaved = (): void => {
 // no-op
};
