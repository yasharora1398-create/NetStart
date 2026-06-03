"use client";
/**
 * Desktop /app/ left panel. Sits next to the (collapsed) sidebar
 * and to the left of the main page content; tabs between Chats and
 * Saved. Mobile is unaffected (the existing MobileBottomNav covers
 * those surfaces).
 *
 * Width: clamps to 1/4 of viewport, with a floor/ceiling so the
 * panel stays usable on narrow and ultrawide screens. The width is
 * written into the global --left-panel-width CSS variable so the
 * main content can pad past it without each page having to compute
 * the offset itself.
 *
 * Collapse pill: vertical capsule on the panel's right edge with an
 * inward-pointing chevron (closes) or outward-pointing chevron
 * (opens). State persists per-user in localStorage so reloads keep
 * the user's preference.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
 ArrowLeft,
 Bookmark,
 ChevronLeft,
 ChevronRight,
 MessageCircle,
} from "lucide-react";
import { useNavigate } from "@/lib/router-compat";

import { ChatConversation } from "@/components/chat/ChatConversation";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
 getAvatarUrl,
 getCandidatesByIds,
 listChatThreads,
 type ChatThreadSummary,
} from "@/lib/mynet-storage";
import type { Candidate } from "@/lib/mynet-types";
import {
 ChatThreadList,
 mergeThreadProfiles,
} from "@/components/chat/ChatThreadList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSavedProjects } from "@/lib/savedProjects";

const COLLAPSED_WIDTH = "32px"; // pill button only
// Strict 1/4 of viewport - user wants this as the exact panel width
// regardless of screen size. No clamp ceiling so it scales up on
// ultrawide displays the same way it shrinks on smaller laptops.
const EXPANDED_WIDTH = "25vw";

const initials = (name: string): string => {
 if (!name.trim()) return "?";
 return name
 .trim()
 .split(/\s+/)
 .slice(0, 2)
 .map((p) => p[0]?.toUpperCase() ?? "")
 .join("");
};

type Tab = "chats" | "saved";

export const AppLeftPanel = () => {
 const { user } = useAuth();
 const navigate = useNavigate();

 // Active conversation lives in PANEL STATE - clicking a contact
 // does NOT navigate. The main /app/match (or whatever page) stays
 // mounted to the right; the chat opens inside this 25vw column.
 // Back arrow at the top of the panel clears it and returns to the
 // contacts list.
 const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

 // Persist collapse + tab choice per user.
 const collapseKey = user?.id
 ? `polln8.app_panel.collapsed.${user.id}`
 : "polln8.app_panel.collapsed";
 const tabKey = user?.id
 ? `polln8.app_panel.tab.${user.id}`
 : "polln8.app_panel.tab";

 const [collapsed, setCollapsed] = useState<boolean>(() => {
 if (typeof window === "undefined") return false;
 return window.localStorage.getItem(collapseKey) === "1";
 });
 const [tab, setTab] = useState<Tab>(() => {
 if (typeof window === "undefined") return "chats";
 const stored = window.localStorage.getItem(tabKey);
 return stored === "saved" ? "saved" : "chats";
 });

 // Re-read prefs once auth finishes hydrating (user.id was unknown
 // on first render).
 useEffect(() => {
 if (!user?.id) return;
 const c = window.localStorage.getItem(`polln8.app_panel.collapsed.${user.id}`);
 if (c !== null) setCollapsed(c === "1");
 const t = window.localStorage.getItem(`polln8.app_panel.tab.${user.id}`);
 if (t === "saved" || t === "chats") setTab(t);
 }, [user?.id]);

 // Drive the global --left-panel-width variable so the main column
 // in AppLayout pads correctly. Removed on unmount so non-/app/
 // pages (marketing) don't inherit the offset.
 useEffect(() => {
 const w = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
 document.documentElement.style.setProperty("--left-panel-width", w);
 try {
 window.localStorage.setItem(collapseKey, collapsed ? "1" : "0");
 } catch {
 // ignore (private mode)
 }
 return () => {
 document.documentElement.style.removeProperty("--left-panel-width");
 };
 }, [collapsed, collapseKey]);

 // Persist tab choice on every change.
 useEffect(() => {
 try {
 window.localStorage.setItem(tabKey, tab);
 } catch {
 // ignore
 }
 }, [tab, tabKey]);

 // -------- Chat threads --------
 // Fetched once when the panel mounts (or the user changes); refresh
 // happens whenever the user comes back to the chats tab. Keeps the
 // panel's threads in sync with /app/chats without needing a shared
 // store. Cache is per-user in localStorage so a reload paints
 // instantly.
 const threadsKey = user?.id ? `polln8.app_panel.threads.${user.id}` : null;
 const profilesKey = user?.id ? `polln8.app_panel.profiles.${user.id}` : null;
 const [threads, setThreads] = useState<ChatThreadSummary[]>(() => {
 if (!threadsKey || typeof window === "undefined") return [];
 try {
 const raw = window.localStorage.getItem(threadsKey);
 return raw ? (JSON.parse(raw) as ChatThreadSummary[]) : [];
 } catch {
 return [];
 }
 });
 const [profiles, setProfiles] = useState<Candidate[]>(() => {
 if (!profilesKey || typeof window === "undefined") return [];
 try {
 const raw = window.localStorage.getItem(profilesKey);
 return raw ? (JSON.parse(raw) as Candidate[]) : [];
 } catch {
 return [];
 }
 });
 const [loadingThreads, setLoadingThreads] = useState(false);

 const loadThreads = useCallback(async () => {
 if (!user) return;
 setLoadingThreads(true);
 try {
 const ts = await listChatThreads();
 setThreads(ts);
 if (threadsKey) {
 try {
 window.localStorage.setItem(threadsKey, JSON.stringify(ts));
 } catch {
 // ignore
 }
 }
 const ids = ts.map((t) => t.contactId);
 if (ids.length > 0) {
 const cands = await getCandidatesByIds(ids);
 setProfiles(cands);
 if (profilesKey) {
 try {
 window.localStorage.setItem(profilesKey, JSON.stringify(cands));
 } catch {
 // ignore
 }
 }
 }
 } catch {
 // Soft-fail: panel keeps showing whatever it had.
 } finally {
 setLoadingThreads(false);
 }
 }, [user, threadsKey, profilesKey]);

 // Fetch when auth hydrates and when the user switches to the chats
 // tab while signed in. Avoids hitting the network every render.
 useEffect(() => {
 if (!user) return;
 if (tab !== "chats") return;
 void loadThreads();
 }, [user, tab, loadThreads]);

 const threadItems = useMemo(
 () => mergeThreadProfiles(threads, profiles),
 [threads, profiles],
 );

 // -------- Saved projects (partner POV) --------
 const savedProjects = useSavedProjects();

 // Collapsed: render only the slim pill button so the panel takes
 // 32px of width and the main content gets the rest.
 if (collapsed) {
 return (
 <aside
 className="hidden md:flex fixed top-0 bottom-0 z-30 flex-col items-center justify-center"
 style={{
 left: 0,
 top: "var(--profile-banner-height, 0px)",
 width: COLLAPSED_WIDTH,
 }}
 aria-label="Chats and saved (collapsed)"
 >
 <CollapsePill
 collapsed={true}
 onToggle={() => setCollapsed(false)}
 />
 </aside>
 );
 }

 return (
 <aside
 className="hidden md:flex fixed top-0 bottom-0 z-30 border-r border-border bg-card"
 style={{
 left: 0,
 top: "var(--profile-banner-height, 0px)",
 width: EXPANDED_WIDTH,
 }}
 aria-label="Chats and saved"
 >
 <div className="flex h-full min-h-0 w-full flex-col">
 {activeThreadId ? (
 // Conversation view inside the panel. Back arrow at
 // the top-left returns to the contacts list without
 // navigating away from the main page.
 <>
 <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-2.5">
 <button
 type="button"
 onClick={() => setActiveThreadId(null)}
 aria-label="Back to contacts"
 className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
 >
 <ArrowLeft className="h-4 w-4" />
 </button>
 <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
 Contacts
 </span>
 </div>
 <div className="flex-1 min-h-0 overflow-hidden">
 {user ? (
 <ChatConversation
 contactId={activeThreadId}
 currentUserId={user.id}
 initialProfile={(() => {
 const t = threadItems.find(
 (it) => it.contactId === activeThreadId,
 );
 return t
 ? {
 fullName: t.fullName,
 headline: "",
 avatarPath: t.avatarPath,
 linkedinUrl: "",
 }
 : null;
 })()}
 onThreadsChanged={() => void loadThreads()}
 onThreadDeleted={() => {
 setActiveThreadId(null);
 void loadThreads();
 }}
 />
 ) : null}
 </div>
 </>
 ) : (
 // Default view: tab header + list. Clicking a thread
 // opens it INSIDE the panel via setActiveThreadId; no
 // route navigation - Match (or whatever page is in main)
 // stays mounted.
 <>
 <div className="flex items-stretch border-b border-border bg-background">
 <TabButton
 active={tab === "chats"}
 onClick={() => setTab("chats")}
 icon={<MessageCircle className="h-3.5 w-3.5" />}
 label="Contacts"
 />
 <TabButton
 active={tab === "saved"}
 onClick={() => setTab("saved")}
 icon={<Bookmark className="h-3.5 w-3.5" />}
 label="Saved"
 />
 </div>

 <div className="flex-1 min-h-0 overflow-hidden">
 {tab === "chats" ? (
 <ChatThreadList
 items={threadItems}
 selectedId={activeThreadId}
 currentUserId={user?.id ?? null}
 loading={loadingThreads}
 onSelect={(id) => setActiveThreadId(id)}
 />
 ) : (
 <SavedList
 projects={savedProjects}
 onOpen={() => navigate(`/app/saved`)}
 />
 )}
 </div>
 </>
 )}
 </div>

 {/* Collapse pill - vertical capsule pinned to the panel's
 right edge. Chevron points inward when expanded (close)
 and outward when collapsed (open). */}
 <CollapsePill
 collapsed={false}
 onToggle={() => setCollapsed(true)}
 />
 </aside>
 );
};

// -------------------------------------------------------------------
// Tab button - flat segmented control. Two of these sit in the
// header row, splitting available width 50/50.
const TabButton = ({
 active,
 onClick,
 icon,
 label,
}: {
 active: boolean;
 onClick: () => void;
 icon: React.ReactNode;
 label: string;
}) => (
 <button
 type="button"
 onClick={onClick}
 aria-pressed={active}
 className={cn(
 "relative flex-1 inline-flex items-center justify-center gap-2 px-3 py-3 text-[11px] font-mono uppercase tracking-[0.18em] transition-colors",
 active
 ? "text-foreground"
 : "text-muted-foreground hover:text-foreground",
 )}
 >
 {icon}
 {label}
 {active && (
 <span
 aria-hidden
 className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
 />
 )}
 </button>
);

// -------------------------------------------------------------------
// Saved list - compact row per project. Click navigates to the full
// /app/saved page so the user gets the rich detail. Long form lives
// in Saved.tsx; this panel is a quick-scan affordance.
const SavedList = ({
 projects,
 onOpen,
}: {
 projects: ReturnType<typeof useSavedProjects>;
 onOpen: () => void;
}) => {
 if (projects.length === 0) {
 return (
 <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
 <Bookmark className="h-5 w-5" aria-hidden />
 <p>Saved projects show up here.</p>
 </div>
 );
 }
 return (
 <ScrollArea className="h-full">
 <ul className="py-1">
 {projects.map((p) => {
 const avatarUrl = getAvatarUrl(p.founderAvatarPath);
 return (
 <li key={p.id}>
 <button
 type="button"
 onClick={onOpen}
 className="flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-accent"
 >
 <Avatar className="size-10 shrink-0">
 {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
 <AvatarFallback className="text-xs">
 {initials(p.founderFullName)}
 </AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <div className="truncate text-sm font-semibold text-foreground">
 {p.title}
 </div>
 <div className="truncate text-xs text-muted-foreground">
 {p.founderFullName}
 </div>
 </div>
 </button>
 </li>
 );
 })}
 </ul>
 </ScrollArea>
 );
};

// -------------------------------------------------------------------
// Vertical pill collapse button - pinned to the right edge of the
// panel. Half-overlaps the panel border so it reads as "attached"
// rather than floating in space.
const CollapsePill = ({
 collapsed,
 onToggle,
}: {
 collapsed: boolean;
 onToggle: () => void;
}) => {
 const Icon = collapsed ? ChevronRight : ChevronLeft;
 return (
 <button
 type="button"
 onClick={onToggle}
 aria-label={collapsed ? "Open chats and saved" : "Close chats and saved"}
 className={cn(
 "absolute top-1/2 -translate-y-1/2 flex h-14 w-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
 // Right-edge attachment when expanded; centered when
 // collapsed (the whole aside IS the pill).
 collapsed ? "right-1/2 translate-x-1/2" : "-right-2.5",
 )}
 >
 <Icon className="h-3.5 w-3.5" />
 </button>
 );
};
