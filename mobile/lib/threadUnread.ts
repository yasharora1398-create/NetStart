/**
 * Per-user "mark thread as unread" store. Local-only - Supabase has
 * no concept of a user-flagged-unread thread, so we track it in
 * AsyncStorage with a tiny in-memory pub/sub for sync UI updates.
 *
 * Use case: user reads a thread on web, wants to come back to it on
 * phone later, marks it unread. The Threads list shows a dot until
 * the row is opened (or the user explicitly clears it).
 *
 * Scope: per-user (key includes userId). Switching accounts on the
 * same device doesn't leak flags.
 */
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_PREFIX = "polln8.thread_unread.v1:";

let flagged: Set<string> = new Set();
let currentUserId: string | null = null;
const listeners = new Set<() => void>();

const emit = () => {
 for (const l of listeners) l();
};

const persist = async (): Promise<void> => {
 if (!currentUserId) return;
 try {
 await AsyncStorage.setItem(
 STORAGE_PREFIX + currentUserId,
 JSON.stringify(Array.from(flagged)),
 );
 } catch {
 // storage unavailable - non-fatal
 }
};

export const setThreadUnreadUser = async (
 userId: string | null,
): Promise<void> => {
 if (userId === currentUserId) return;
 currentUserId = userId;
 if (!userId) {
 flagged = new Set();
 emit();
 return;
 }
 try {
 const raw = await AsyncStorage.getItem(STORAGE_PREFIX + userId);
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
 void persist();
};

export const clearThreadUnread = (contactId: string): void => {
 if (!flagged.has(contactId)) return;
 flagged = new Set(flagged);
 flagged.delete(contactId);
 emit();
 void persist();
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
