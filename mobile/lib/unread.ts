/**
 * Per-tab unread counters. The Saved tab and Threads tab both want
 * a "you have N new things" badge on their tab icon. The badge:
 * - bumps when a new item arrives (a save lands in the local store,
 * or a chat message arrives addressed to me),
 * - clears the moment the user opens the tab (so it accurately
 * reflects only what they haven't seen yet).
 *
 * Counts live in memory + AsyncStorage so they survive app restarts.
 * A tiny pub/sub keeps the tab layout in sync without forcing each
 * subscriber to poll.
 */
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Bucket = "saved" | "threads";
const KEY = (b: Bucket) => `polln8.unread.${b}`;

// In-memory state. Backed by AsyncStorage so it survives reload.
const counts: Record<Bucket, number> = { saved: 0, threads: 0 };
const listeners: Record<Bucket, Set<(n: number) => void>> = {
 saved: new Set(),
 threads: new Set(),
};

let hydrated = false;
const hydrate = async () => {
 if (hydrated) return;
 hydrated = true;
 try {
 const [s, t] = await Promise.all([
 AsyncStorage.getItem(KEY("saved")),
 AsyncStorage.getItem(KEY("threads")),
 ]);
 counts.saved = parseInt(s ?? "0", 10) || 0;
 counts.threads = parseInt(t ?? "0", 10) || 0;
 notify("saved");
 notify("threads");
 } catch {
 // silent — empty counts are fine
 }
};

const notify = (b: Bucket) => {
 for (const fn of listeners[b]) fn(counts[b]);
};

const persist = (b: Bucket) => {
 void AsyncStorage.setItem(KEY(b), String(counts[b])).catch(() => {});
};

export const bumpUnread = (b: Bucket): void => {
 counts[b] += 1;
 persist(b);
 notify(b);
};

export const clearUnread = (b: Bucket): void => {
 if (counts[b] === 0) return;
 counts[b] = 0;
 persist(b);
 notify(b);
};

export const useUnread = (b: Bucket): number => {
 const [n, setN] = useState(counts[b]);
 useEffect(() => {
 void hydrate();
 const fn = (next: number) => setN(next);
 listeners[b].add(fn);
 setN(counts[b]);
 return () => {
 listeners[b].delete(fn);
 };
 }, [b]);
 return n;
};
