"use client";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import {
 Bookmark,
 BookmarkCheck,
 Briefcase,
 Check,
 ChevronLeft,
 ExternalLink,
 FileText,
 Globe,
 Linkedin,
 Loader2,
 MapPin,
 Maximize2,
 MessageCircle,
 Minimize2,
 Search,
 Sparkles,
 Undo2,
 User,
 X,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/netstart/AppLayout";
import { AuthGate } from "@/components/netstart/AuthGate";
import { StepMatch } from "@/components/mockups/Steps";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { MothEmptyState } from "@/components/netstart/MothEmptyState";
import { MobileSwipeCard } from "@/components/netstart/MobileSwipeCard";
import { BottomSheet } from "@/components/netstart/BottomSheet";
import { cn } from "@/lib/utils";
import { readCache, writeCache } from "@/lib/cache";
import { useAuth } from "@/context/AuthContext";
import {
 COMMITMENT_OPTIONS,
 LOCATION_OPTIONS,
 SKILLS_OPTIONS,
} from "@/lib/options";
import { readIntroOpened, writeIntroOpened } from "@/lib/introGate";
import {
 getAvatarUrl,
 getProfile,
 getPublicFounder,
 getResumeSignedUrl,
 listOpenCandidates,
 listProjects,
 listPublishedProjects,
 listPublishedProjectsForOwner,
 setPersonStatus,
 type PublicFounder,
} from "@/lib/mynet-storage";
import { addSavedProject, removeSavedProject, useIsProjectSaved } from "@/lib/savedProjects";
import type {
 Candidate,
 Profile,
 PublicProject,
} from "@/lib/mynet-types";

const initials = (name: string): string => {
 if (!name.trim()) return "?";
 return name
 .trim()
 .split(/\s+/)
 .slice(0, 2)
 .map((p) => p[0]?.toUpperCase() ?? "")
 .join("");
};

const Match = () => {
 // Intro gate: only shown the first time the user opens Match on
 // this device. The dismissal is sticky in localStorage so reloads
 // and new tabs land straight on the deck.
 const [opened, setOpenedState] = useState<boolean>(() =>
 readIntroOpened("match"),
 );
 const setOpened = (next: boolean) => {
 writeIntroOpened("match", next);
 setOpenedState(next);
 };
 const { user, loading } = useAuth();
 const [profile, setProfile] = useState<Profile | null>(null);
 const [hasProjects, setHasProjects] = useState(false);
 const [loadingMode, setLoadingMode] = useState(false);

 useEffect(() => {
 if (!user) return;
 let cancelled = false;
 setLoadingMode(true);
 Promise.all([getProfile(user.id), listProjects(user.id)])
 .then(([p, prs]) => {
 if (cancelled) return;
 setProfile(p);
 setHasProjects(prs.length > 0);
 })
 .catch(() => {
 // ignore - page will fall through to a friendly state
 })
 .finally(() => {
 if (!cancelled) setLoadingMode(false);
 });
 return () => {
 cancelled = true;
 };
 }, [user]);

 const isAuthed = Boolean(user) && !loading;
 const isAccepted = profile?.reviewStatus === "accepted";

 // Unauth visitors pick a role on a title page before they see the
 // deck. Lives in component state (not localStorage) so they re-pick
 // on the next visit - intentional; the picker is a moment for the
 // visitor to self-identify before anything that depends on it.
 //
 // Two states intentionally split:
 //   chosenRole - which card is currently highlighted (picking is
 //                NOT a commitment - they can switch before Start).
 //   started    - they hit Start. Falls through to the real deck.
 const [chosenRole, setChosenRole] = useState<
 "founder" | "partner" | null
 >(null);
 const [started, setStarted] = useState(false);

 // Auth role is the primary signal: a partner swipes projects, a
 // founder swipes candidates. Fall back to project ownership only
 // for legacy users who pre-date the role stamp on user_metadata.
 // (Naming is unfortunate: userMode "partner" = founder-side view;
 // "looker" = partner-side view. Kept for now since both branches
 // below already use those names.)
 const role = user?.user_metadata?.role as string | undefined;
 const userMode: "partner" | "looker" =
 // Unauth: their picker choice drives the deck. Founder picked
 // -> partner-cards view; partner picked -> project-cards view.
 !isAuthed && chosenRole === "founder"
 ? "partner"
 : !isAuthed && chosenRole === "partner"
 ? "looker"
 : role === "partner"
 ? "looker"
 : role === "founder"
 ? "partner"
 : hasProjects
 ? "partner"
 : "looker";

 const Locked = (
 <div className="rounded-sm border border-gold bg-card p-12 text-center max-w-2xl mx-auto">
 <h1 className="font-display text-3xl mb-3">Almost there.</h1>
 <p className="text-muted-foreground mb-6">
 Match opens up once your profile has been accepted. Hop back to MyNet
 to finish setting up.
 </p>
 <Link to="/mynet">
 <Button variant="gold" size="lg">
 Go to MyNet
 </Button>
 </Link>
 </div>
 );

 // Unauth role-picker title page. Two RoleSplit-style cards: pick one
 // to highlight (green outline), then click Start to enter the deck.
 // Picking is NOT an immediate advance - that was the old behavior;
 // user wanted picking to just preview the choice.
 if (!loading && !isAuthed && !started) {
 const ROLE_OPTIONS = [
 {
 value: "founder" as const,
 eyebrow: "I'm a founder",
 headline: "Pitch one person, the right one.",
 body:
 "Post what you're building once. We surface partners whose skills and commitment actually match.",
 bullets: [
 "One pitch covers every introduction",
 "Partners with shipped work, not just bios",
 "Block the noise. Accept only the ones you want",
 ],
 },
 {
 value: "partner" as const,
 eyebrow: "I'm a partner",
 headline: "See real projects. Not job boards.",
 body:
 "Swipe through what founders are actually building right now. Stage, traction, equity ask, what they need.",
 bullets: [
 "Browse projects, not LinkedIn job titles",
 "Mutual interest before any commitment",
 "Save the ones that intrigue you, ignore the rest",
 ],
 },
 ];

 return (
 <AppLayout>
 <div className="container py-12 md:py-20">
 <div className="max-w-3xl mb-10 md:mb-14">
 <h1 className="font-display text-5xl sm:text-6xl md:text-7xl leading-[0.95] mb-5 font-bold">
 Pick your side.
 </h1>
 <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
 Polln8 matches founders with partners. Tell us which one
 you are - the deck flips to show you the other side.
 </p>
 </div>

 <div className="grid gap-5 md:grid-cols-2 mb-8">
 {ROLE_OPTIONS.map((opt) => {
 const active = chosenRole === opt.value;
 return (
 <button
 key={opt.value}
 type="button"
 onClick={() => setChosenRole(opt.value)}
 className={cn(
 "group relative h-full rounded-sm border-2 bg-card p-8 text-left transition-colors",
 active
 ? "border-primary"
 : "border-border hover:border-primary",
 )}
 >
 <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary mb-3">
 {opt.eyebrow}
 </p>
 <h3 className="font-display text-3xl mb-4 leading-tight font-semibold text-foreground">
 {opt.headline}
 </h3>
 <p className="text-sm text-muted-foreground leading-relaxed mb-6">
 {opt.body}
 </p>
 <ul className="space-y-2.5">
 {opt.bullets.map((b) => (
 <li
 key={b}
 className="flex items-start gap-2 text-sm text-foreground"
 >
 <span
 aria-hidden
 className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"
 />
 <span>{b}</span>
 </li>
 ))}
 </ul>
 {active ? (
 <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-primary-foreground">
 Selected
 </span>
 ) : null}
 </button>
 );
 })}
 </div>

 <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
 <Button
 variant="gold"
 size="xl"
 disabled={!chosenRole}
 onClick={() => setStarted(true)}
 >
 Start
 </Button>
 <Link to="/signin">
 <Button variant="outline" size="xl" className="w-full sm:w-auto">
 Log in
 </Button>
 </Link>
 </div>
 </div>
 </AppLayout>
 );
 }

 if (!opened) {
 // Match intro: hero stacked. Centered title + body up top, the
 // anonymous StepMatch deck mockup huge below, then a single
 // 4-column strip of facts at the bottom.
 return (
 <AppLayout>
 <div className="container py-12 md:py-16">
 <div className="max-w-3xl mb-12 md:mb-16">
 <h1 className="font-display text-5xl sm:text-6xl md:text-7xl leading-[0.95] mb-6 font-bold">
 Match.
 </h1>
 <div className="text-base sm:text-lg text-muted-foreground leading-relaxed space-y-4">
 <p>
 The ranked deck. Founders see partners ordered against
 their active project&apos;s criteria. Partners see
 projects ordered against what they&apos;ve built and the
 work they&apos;d want to ship next.
 </p>
 <p>
 Three actions per card: save for later, pass, or send a
 chat request. No fourth bucket and no maybes. Chat opens
 only when the other side accepts back.
 </p>
 </div>
 </div>

 <div className="relative w-full max-w-full overflow-hidden mb-16">
 <div className="relative left-1/2 w-fit -translate-x-1/2 pointer-events-none">
 <StepMatch anonymous />
 </div>
 </div>

 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
 {[
 { t: "Ranked, not feed-spam", b: "Profile and project text get embedded; cards order by real similarity to what you built." },
 { t: "Three actions per card", b: "Save, pass, request. No likes, no maybes. Every card is a decision." },
 { t: "Mutual before chat", b: "Both sides have to accept before a thread opens. No cold DMs." },
 { t: "Undo the last swipe", b: "Tap undo in the top bar to bring the last card back if you misclicked." },
 ].map((d) => (
 <div
 key={d.t}
 className="rounded-sm border border-border bg-card p-4"
 >
 <h3 className="font-display text-base mb-1.5 font-semibold">{d.t}</h3>
 <p className="text-xs text-muted-foreground leading-relaxed">{d.b}</p>
 </div>
 ))}
 </div>

 <Button
 variant="gold"
 size="xl"
 onClick={() => setOpened(true)}
 className="group"
 >
 Open Match
 <ChevronLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
 </Button>
 </div>
 </AppLayout>
 );
 }

 return (
 <AppLayout>
 <div className="container">
 <header className="mb-6 md:mb-10">
 <h1 className="font-display text-3xl sm:text-4xl md:text-6xl leading-[1] mb-3 md:mb-4">
 {userMode === "partner"
 ? "Find your partner."
 : "Find a project."}
 </h1>
 <p className="text-muted-foreground max-w-xl text-sm md:text-base">
 {userMode === "partner"
 ? "Vetted partners, one at a time. Accept the ones you want to talk to and pass the rest."
 : "Founders building right now. Browse one by one and apply when something fits."}
 </p>
 </header>

 {loadingMode && isAuthed ? (
 <Loading />
 ) : isAuthed && !isAccepted ? (
 Locked
 ) : userMode === "partner" ? (
 <PartnerView />
 ) : (
 <LookerView />
 )}
 </div>
 </AppLayout>
 );
};

// ============= Partner view: swipe through lookers ===================

const MATCH_CANDIDATES_CACHE_KEY = "polln8.match.candidates";
const MATCH_PARTNER_DECIDED_KEY = "polln8.match.partner.decided";

// Read the persisted "already decided" set so a refresh on /match
// drops the user back on the same card instead of restarting from
// the top of the deck. Keyed off the auth user id so two people
// sharing a browser don't merge sets.
const readPartnerDecided = (uid: string | undefined): Set<string> => {
 if (typeof window === "undefined" || !uid) return new Set();
 try {
 const raw = window.localStorage.getItem(
 `${MATCH_PARTNER_DECIDED_KEY}.${uid}`,
 );
 if (!raw) return new Set();
 const arr = JSON.parse(raw) as string[];
 return Array.isArray(arr) ? new Set(arr) : new Set();
 } catch {
 return new Set();
 }
};

const PartnerView = () => {
 const { user } = useAuth();
 // Hydrate from localStorage so revisiting /match shows the deck
 // instantly; the network fetch below overwrites with fresh data.
 const [candidates, setCandidates] = useState<Candidate[]>(
 () => readCache<Candidate[]>(MATCH_CANDIDATES_CACHE_KEY) ?? [],
 );
 // Don't show the spinner if we already have cached cards to render.
 const [loadingData, setLoadingData] = useState(false);
 const [query, setQuery] = useState("");
 const [skillFilter, setSkillFilter] = useState("");
 const [locationFilter, setLocationFilter] = useState("");
 const [commitmentFilter, setCommitmentFilter] = useState("");
 // Persisted across reloads so refreshing /match doesn't reset the
 // user to the first card. Persisted on every change via the
 // effect below.
 const [decided, setDecided] = useState<Set<string>>(() =>
 readPartnerDecided(user?.id),
 );

 // Rehydrate when the auth user finishes loading (initial render
 // may not have user.id yet).
 useEffect(() => {
 if (!user?.id) return;
 const stored = readPartnerDecided(user.id);
 if (stored.size > 0) setDecided(stored);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [user?.id]);

 // Persist the decided set every time it changes.
 useEffect(() => {
 if (typeof window === "undefined" || !user?.id) return;
 try {
 window.localStorage.setItem(
 `${MATCH_PARTNER_DECIDED_KEY}.${user.id}`,
 JSON.stringify(Array.from(decided)),
 );
 } catch {
 // ignore - localStorage quota / disabled is non-fatal
 }
 }, [decided, user?.id]);
 const [detail, setDetail] = useState<Candidate | null>(null);
 // Founder's active/first project "" drives where Save lands plus
 // the "Matching for [project]" banner. Title kept alongside the
 // id so we can show it without a second fetch.
 const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
 const [activeProjectTitle, setActiveProjectTitle] = useState<string | null>(
 null,
 );
 const [hasMultipleProjects, setHasMultipleProjects] = useState(false);

 useEffect(() => {
 // Only show the spinner on first-ever load (no cache); refreshes
 // happen quietly under the existing rendered cards.
 if (candidates.length === 0) setLoadingData(true);
 listOpenCandidates()
 .then((list) => {
 setCandidates(list);
 writeCache(MATCH_CANDIDATES_CACHE_KEY, list);
 })
 .catch((err) =>
 toast.error(err instanceof Error ? err.message : "Failed to load."),
 )
 .finally(() => setLoadingData(false));
 // candidates.length not in deps -- we only want this effect on
 // mount, not every time setCandidates fires.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 useEffect(() => {
 if (!user) return;
 let cancelled = false;
 (async () => {
 try {
 const [profile, projects] = await Promise.all([
 getProfile(user.id),
 listProjects(user.id),
 ]);
 if (cancelled) return;
 setHasMultipleProjects(projects.length > 1);
 // Prefer the explicitly-picked active project; fall back to
 // the first one the founder owns. Saves go here.
 const picked =
 profile.activeProjectId &&
 projects.find((p) => p.id === profile.activeProjectId);
 const fallback = projects[0] ?? null;
 const project = picked || fallback;
 setActiveProjectId(project?.id ?? null);
 setActiveProjectTitle(project?.title ?? null);
 } catch {
 // soft-fail; Save will warn the user it isn't persisting
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [user]);

 const filtered = useMemo(() => {
 const q = query.trim().toLowerCase();
 const skill = skillFilter.trim().toLowerCase();
 const loc = locationFilter.trim().toLowerCase();
 const com = commitmentFilter.trim().toLowerCase();
 return candidates.filter((c) => {
 if (decided.has(c.userId)) return false;
 if (q) {
 const hay = `${c.fullName} ${c.headline} ${c.bio} ${c.skills.join(
 " ",
 )} ${c.location} ${c.commitment}`.toLowerCase();
 if (!hay.includes(q)) return false;
 }
 if (skill && !c.skills.some((s) => s.toLowerCase().includes(skill)))
 return false;
 if (loc && !c.location.toLowerCase().includes(loc)) return false;
 if (com && !c.commitment.toLowerCase().includes(com)) return false;
 return true;
 });
 }, [candidates, query, skillFilter, locationFilter, commitmentFilter, decided]);

 const allSkills = useMemo(() => {
 const set = new Set<string>();
 for (const c of candidates) for (const s of c.skills) set.add(s);
 return Array.from(set).sort();
 }, [candidates]);

 const hasFilters = Boolean(
 query || skillFilter || locationFilter || commitmentFilter,
 );

 const current = filtered[0] ?? null;
 // When `approving` is set, the card slides left and the info pane
 // slides in from the right. Confirming a chat / closing advances
 // the deck by adding the candidate to `decided`.
 const [approving, setApproving] = useState<Candidate | null>(null);
 const [fullscreen, setFullscreen] = useState(false);

 // ESC exits full-screen. Listener only attaches when fullscreen is
 // on so we don't capture keys for unrelated screens.
 useEffect(() => {
 if (!fullscreen) return;
 const onKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") setFullscreen(false);
 };
 window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, [fullscreen]);

 // History stack of decided candidates in decide-order. Drives the
 // Previous / undo button: each undo pops the most-recent decision,
 // and the stack lets the user walk all the way back through the
 // session's decisions instead of being capped at one undo.
 const [history, setHistory] = useState<Candidate[]>([]);
 const lastDecided = history.length > 0 ? history[history.length - 1] : null;

 const decline = () => {
 if (!current) return;
 setApproving(null);
 setHistory((prev) => [...prev, current]);
 setDecided((prev) => new Set(prev).add(current.userId));
 };
 const accept = () => {
 if (!current) return;
 setApproving(current);
 };
 const closeInfo = (decideThem: boolean) => {
 const target = approving ?? detail;
 if (decideThem && target) {
 setHistory((prev) => [...prev, target]);
 setDecided((prev) => new Set(prev).add(target.userId));
 }
 setApproving(null);
 setDetail(null);
 };
 const undo = () => {
 if (history.length === 0) return;
 const top = history[history.length - 1];
 setHistory((prev) => prev.slice(0, -1));
 setDecided((prev) => {
 const next = new Set(prev);
 next.delete(top.userId);
 return next;
 });
 setApproving(null);
 };

 return (
 <>
 {/* Active-project banner + Filters are hidden in full-screen
 mode so the deck takes over the whole canvas. */}
 {!fullscreen && activeProjectTitle ? (
 <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-gold bg-gold px-4 py-3">
 <div className="flex items-center gap-2 text-sm">
 <Sparkles className="h-3.5 w-3.5 text-white flex-shrink-0" />
 <span className="text-muted-foreground">Matching for</span>
 <span className="font-medium text-foreground">
 {activeProjectTitle}
 </span>
 </div>
 {hasMultipleProjects ? (
 <Link
 to="/mynet"
 className="text-[11px] font-mono uppercase tracking-widest text-gold hover:underline"
 >
 Switch project
 </Link>
 ) : null}
 </div>
 ) : null}

 {!fullscreen ? (
 <Filters
 query={query}
 setQuery={setQuery}
 skill={skillFilter}
 setSkill={setSkillFilter}
 location={locationFilter}
 setLocation={setLocationFilter}
 commitment={commitmentFilter}
 setCommitment={setCommitmentFilter}
 skillOptions={SKILLS_OPTIONS}
 onClear={() => {
 setQuery("");
 setSkillFilter("");
 setLocationFilter("");
 setCommitmentFilter("");
 }}
 hasFilters={hasFilters}
 />
 ) : null}

 {loadingData ? (
 <Loading />
 ) : !current ? (
 <div className="flex flex-col items-center">
 <MothEmptyState
 variant={hasFilters ? "filters" : "caught"}
 title={hasFilters ? "No matches." : "You're caught up."}
 sub={
 hasFilters
 ? "Hawk-moths home in by scent, and your filters narrow the bouquet. Loosen a few and the field opens up."
 : decided.size > 0
 ? "You've worked through every partner that's open right now. Review the ones you've already seen, or wait for new sign-ups to land."
 : "You've worked through every partner that's open right now. New ones will land here as they sign up."
 }
 />
 {!hasFilters && decided.size > 0 ? (
 <button
 type="button"
 onClick={() => setDecided(new Set())}
 className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-gold bg-card px-6 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-primary-foreground hover:border-gold"
 >
 <Undo2 className="h-4 w-4" />
 Review already seen ({decided.size})
 </button>
 ) : null}
 </div>
 ) : (
 <div
 className={cn(
 "relative",
 fullscreen
 ? "fixed inset-0 z-50 bg-background overflow-hidden"
 : "",
 )}
 >
 {/* Top-bar controls: undo + full-screen toggle. Undo only
 renders once we have a `lastDecided` to bring back. */}
 <div
 className={cn(
 "flex items-center gap-2",
 fullscreen
 ? "absolute top-4 left-4 z-20"
 : "justify-end mb-4",
 )}
 >
 {lastDecided ? (
 <button
 type="button"
 onClick={undo}
 aria-label={`Undo: bring back ${lastDecided.fullName}`}
 title={`Undo: bring back ${lastDecided.fullName || "last candidate"}`}
 className="inline-flex items-center gap-1.5 rounded-sm border border-gold bg-gold px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-primary-foreground hover:bg-gold hover:border-gold transition-colors"
 >
 <Undo2 className="h-3.5 w-3.5" />
 Undo
 </button>
 ) : null}
 <button
 type="button"
 onClick={() => setFullscreen((v) => !v)}
 aria-label={fullscreen ? "Exit full-screen" : "Full-screen"}
 className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold transition-colors"
 >
 {fullscreen ? (
 <>
 <Minimize2 className="h-3.5 w-3.5" />
 Exit
 </>
 ) : (
 <>
 <Maximize2 className="h-3.5 w-3.5" />
 Full-screen
 </>
 )}
 </button>
 </div>

 {/* DESKTOP deck stage - original X | Card+Previous | Check
 row with the side action column on accept. Hidden under
 768px in favour of the swipe deck below. */}
 <div
 className={cn(
 "relative mx-auto hidden md:flex items-center justify-center gap-6 px-4 py-6",
 fullscreen ? "h-[calc(100dvh-72px)]" : "",
 )}
 >
 <button
 type="button"
 onClick={decline}
 aria-label="Pass"
 className={cn(
 "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-destructive bg-card text-destructive shadow-sm hover:bg-destructive hover:border-destructive transition-all duration-500",
 approving &&
 "opacity-0 pointer-events-none scale-75 -mr-[80px]",
 )}
 >
 <X className="h-6 w-6" strokeWidth={2.2} />
 </button>

 {/* Desktop card width: 400px keeps the card + Previous button +
 the side info panel under the viewport height in non-fullscreen
 mode (image scales with width since aspect-[4/3] is fixed). */}
 <div className="w-full max-w-[400px] flex-shrink-0 flex flex-col gap-3">
 <MatchCandidateCard candidate={current} />
 <button
 type="button"
 onClick={undo}
 disabled={!lastDecided}
 aria-label="Previous card"
 className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gold bg-card px-4 py-3 text-sm font-medium text-gold transition-all hover:bg-gold hover:text-primary-foreground hover:border-gold disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-card disabled:hover:text-gold disabled:hover:border-gold"
 >
 <ChevronLeft className="h-4 w-4" />
 Previous
 </button>
 </div>

 <button
 type="button"
 onClick={accept}
 aria-label="Approve"
 disabled={Boolean(approving)}
 className={cn(
 "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-gold bg-card text-gold shadow-sm hover:bg-gold hover:text-primary-foreground transition-all duration-500",
 approving &&
 "opacity-0 pointer-events-none scale-75 -ml-[80px]",
 )}
 >
 <Check className="h-6 w-6" strokeWidth={2.4} />
 </button>

 <div
 className={cn(
 "transition-all duration-500 ease-out overflow-hidden",
 approving ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0 -ml-6",
 )}
 >
 <div className="w-[88px]">
 {approving ? (
 <CandidateActions
 candidate={approving}
 activeProjectId={activeProjectId}
 onClose={() => closeInfo(true)}
 />
 ) : null}
 </div>
 </div>
 </div>

 {/* MOBILE deck - card-only swipe deck. */}
 <div className="md:hidden mx-auto w-full max-w-[480px] px-3 py-4">
 <MobileSwipeCard
 top={<MatchCandidateCard candidate={current} />}
 under={
 filtered[1] ? (
 <MatchCandidateCard candidate={filtered[1]} />
 ) : null
 }
 resetKey={current.userId}
 onSwipeLeft={decline}
 onSwipeRight={accept}
 />
 </div>

 {/* MOBILE action sheet - LinkedIn / Resume / Save / Message
 opens on swipe-right. */}
 <div className="md:hidden">
 <BottomSheet
 open={Boolean(approving)}
 onClose={() => closeInfo(true)}
 >
 <div className="p-4 pb-12">
 {approving ? (
 <CandidateActions
 candidate={approving}
 activeProjectId={activeProjectId}
 onClose={() => closeInfo(true)}
 />
 ) : null}
 </div>
 </BottomSheet>
 </div>
 </div>
 )}
 </>
 );
};

// Mirrors the mobile profile card: full-width square photo at the
// top, then name, then pills (commitment / location / skills), then
// optional bio underneath. Sized to feel like a phone-card on
// desktop (~520px wide, image fills the top half).
const MatchCandidateCard = ({ candidate }: { candidate: Candidate }) => {
 const avatar = getAvatarUrl(candidate.avatarPath);
 return (
 <article className="overflow-hidden rounded-2xl border border-gold bg-card shadow-sm">
 {/* Picture square "" full-width, 1:1 aspect, dominates the card.
 Falls back to a grey field with a silhouette User icon when the
 candidate has no avatar - matches the anonymous silhouette in
 the How-it-works StepMatch mockup so the same visual reads
 across the marketing + product surfaces. */}
 <div className="relative w-full aspect-[4/3] bg-muted">
 {avatar ? (
 <img
 src={avatar}
 alt={candidate.fullName}
 className="absolute inset-0 h-full w-full object-cover"
 />
 ) : (
 <div className="absolute inset-0 flex items-center justify-center">
 <User className="h-32 w-32 text-muted-foreground" strokeWidth={1.4} />
 </div>
 )}
 </div>

 {/* Body "" name, pills, bio. */}
 <div className="p-5">
 <h2 className="mb-2 font-display text-2xl leading-tight text-foreground">
 {candidate.fullName || "Unnamed"}
 </h2>

 {(candidate.commitment ||
 candidate.location ||
 candidate.skills.length > 0) ? (
 <div className="mb-3 flex flex-wrap gap-1.5">
 {candidate.commitment ? (
 <span className="inline-flex items-center gap-1.5 rounded-full border border-gold bg-gold px-3 py-1 text-xs font-medium text-primary-foreground">
 <Sparkles className="h-3 w-3" />
 {candidate.commitment}
 </span>
 ) : null}
 {candidate.location ? (
 <span className="inline-flex items-center gap-1.5 rounded-full border border-gold bg-gold px-3 py-1 text-xs font-medium text-primary-foreground">
 <MapPin className="h-3 w-3" />
 {candidate.location}
 </span>
 ) : null}
 {candidate.skills.slice(0, 5).map((s) => (
 <span
 key={s}
 className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
 >
 {s}
 </span>
 ))}
 </div>
 ) : null}

 {candidate.headline ? (
 <p className="mb-2 text-sm font-medium text-foreground">
 {candidate.headline}
 </p>
 ) : null}

 {candidate.bio ? (
 <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
 {candidate.bio}
 </p>
 ) : null}
 </div>
 </article>
 );
};

// Founder-side action column. The card already shows bio / skills /
// headline; the only thing this column adds is the actions you'd
// take after deciding to engage: open LinkedIn, open the resume,
// save the candidate, message them, or back out. No surrounding
// box "" the buttons themselves stand free next to the card.
const CandidateActions = ({
 candidate,
 activeProjectId,
 onClose,
}: {
 candidate: Candidate;
 activeProjectId: string | null;
 onClose: () => void;
}) => {
 const navigate = useNavigate();
 const { user } = useAuth();
 const [saved, setSaved] = useState(false);
 const [working, setWorking] = useState(false);
 const [resumeUrl, setResumeUrl] = useState<string | null>(null);
 const [resumeError, setResumeError] = useState<string | null>(null);

 useEffect(() => {
 setSaved(false);
 setResumeUrl(null);
 setResumeError(null);
 const path = candidate.resumePath;
 if (!path) return;
 let cancelled = false;
 getResumeSignedUrl(path)
 .then((url) => {
 if (!cancelled) setResumeUrl(url);
 })
 .catch(() => {
 if (!cancelled) setResumeError("Resume not accessible yet.");
 });
 return () => {
 cancelled = true;
 };
 }, [candidate.userId, candidate.resumePath]);

 const handleSave = async () => {
 if (working) return;
 // Unauth: bounce to /saved - that page renders the AuthGate
 // 'sign in to save' message, which is friendlier than dropping
 // them straight on the sign-in form with no context.
 if (!user) {
 navigate("/saved");
 return;
 }
 // Saves attach to a project. Without one published & marked
 // active in MyNet, there's nowhere to store the save "" so the
 // old behavior silently lost data. Block the action and tell the
 // founder exactly what to do.
 if (!activeProjectId) {
 toast.error("Finish your active project in MyNet first", {
 description:
 "Partners are ranked against your active project's criteria - and saves attach to it. Publish a project in MyNet, then mark it active.",
 });
 return;
 }
 setWorking(true);
 try {
 const next = !saved;
 await setPersonStatus(activeProjectId, candidate.userId, "saved");
 setSaved(next);
 toast.success(next ? "Saved." : "Removed.");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Could not save.");
 } finally {
 setWorking(false);
 }
 };

 const handleMessage = () => {
 // Unauth: bounce to /chats - that page renders the AuthGate
 // 'sign in to chat' message so the user learns what's behind
 // the action before they're asked to sign up.
 if (!user) {
 navigate("/chats");
 return;
 }
 onClose();
 navigate(`/chats/${candidate.userId}`);
 };

 return (
 <div className="flex flex-col items-center gap-3">
 {/* LinkedIn */}
 {candidate.linkedinUrl ? (
 <a
 href={candidate.linkedinUrl}
 target="_blank"
 rel="noopener noreferrer"
 aria-label="Open LinkedIn"
 title="LinkedIn"
 className="flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-card text-gold shadow-sm transition-all hover:bg-gold hover:text-primary-foreground hover:border-gold hover:shadow-md"
 >
 <Linkedin className="h-6 w-6" />
 </a>
 ) : (
 <span
 aria-label="LinkedIn unavailable"
 title="No LinkedIn on file"
 className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-muted-foreground cursor-not-allowed"
 >
 <Linkedin className="h-6 w-6" />
 </span>
 )}

 {/* Resume */}
 {candidate.resumeName && resumeUrl ? (
 <a
 href={resumeUrl}
 target="_blank"
 rel="noopener noreferrer"
 aria-label="Open resume"
 title={candidate.resumeName}
 className="flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-card text-gold shadow-sm transition-all hover:bg-gold hover:text-primary-foreground hover:border-gold hover:shadow-md"
 >
 <FileText className="h-6 w-6" />
 </a>
 ) : (
 <span
 aria-label={
 candidate.resumeName ? "Resume loading" : "No resume on file"
 }
 title={candidate.resumeName ?? "No resume on file"}
 className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-muted-foreground cursor-not-allowed"
 >
 <FileText className="h-6 w-6" />
 </span>
 )}

 {/* Save (gold accent so it reads as primary) */}
 <button
 type="button"
 onClick={handleSave}
 disabled={working}
 aria-label={saved ? "Remove from saved" : "Save"}
 title={saved ? "Saved" : "Save"}
 className="flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-card text-gold shadow-sm transition-all hover:bg-gold hover:text-primary-foreground hover:border-gold hover:shadow-md"
 >
 {saved ? (
 <BookmarkCheck className="h-6 w-6 fill-current" />
 ) : (
 <Bookmark className="h-6 w-6" />
 )}
 </button>

 {/* Message "" primary action */}
 <button
 type="button"
 onClick={handleMessage}
 disabled={working}
 aria-label="Message"
 title="Message"
 className="flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-gold text-primary-foreground shadow-sm transition-all hover:bg-gold hover:shadow-md"
 >
 <MessageCircle className="h-6 w-6" />
 </button>

 {/* Back / dismiss */}
 <button
 type="button"
 onClick={onClose}
 aria-label="Back to deck"
 title="Back"
 className="mt-1 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-gold hover:text-foreground"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 );
};

// ============= Looker view: arrows through partners ==================

const MATCH_PROJECTS_CACHE_KEY = "polln8.match.projects";
const MATCH_LOOKER_DECIDED_KEY = "polln8.match.looker.decided";

const readLookerDecided = (uid: string | undefined): Set<string> => {
 if (typeof window === "undefined" || !uid) return new Set();
 try {
 const raw = window.localStorage.getItem(
 `${MATCH_LOOKER_DECIDED_KEY}.${uid}`,
 );
 if (!raw) return new Set();
 const arr = JSON.parse(raw) as string[];
 return Array.isArray(arr) ? new Set(arr) : new Set();
 } catch {
 return new Set();
 }
};

const LookerView = () => {
 const { user } = useAuth();
 const [projects, setProjects] = useState<PublicProject[]>(
 () => readCache<PublicProject[]>(MATCH_PROJECTS_CACHE_KEY) ?? [],
 );
 const [loadingData, setLoadingData] = useState(false);
 const [query, setQuery] = useState("");
 const [skillFilter, setSkillFilter] = useState("");
 const [locationFilter, setLocationFilter] = useState("");
 const [commitmentFilter, setCommitmentFilter] = useState("");
 // Same deck pattern as the founder side. Persisted to localStorage
 // so refreshing /match keeps the user on the same project instead
 // of restarting from the top of the deck.
 const [decided, setDecided] = useState<Set<string>>(() =>
 readLookerDecided(user?.id),
 );
 useEffect(() => {
 if (!user?.id) return;
 const stored = readLookerDecided(user.id);
 if (stored.size > 0) setDecided(stored);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [user?.id]);
 useEffect(() => {
 if (typeof window === "undefined" || !user?.id) return;
 try {
 window.localStorage.setItem(
 `${MATCH_LOOKER_DECIDED_KEY}.${user.id}`,
 JSON.stringify(Array.from(decided)),
 );
 } catch {
 // ignore
 }
 }, [decided, user?.id]);
 const [approving, setApproving] = useState<PublicProject | null>(null);
 // History stack of decided projects in decide-order so the user
 // can walk back through multiple decisions, not just one.
 const [history, setHistory] = useState<PublicProject[]>([]);
 const lastDecided = history.length > 0 ? history[history.length - 1] : null;
 const [fullscreen, setFullscreen] = useState(false);

 // ESC exits full-screen. Listener only attaches when fullscreen
 // is on so we don't capture keys for unrelated screens.
 useEffect(() => {
 if (!fullscreen) return;
 const onKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") setFullscreen(false);
 };
 window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, [fullscreen]);

 useEffect(() => {
 if (projects.length === 0) setLoadingData(true);
 listPublishedProjects()
 .then((list) => {
 setProjects(list);
 writeCache(MATCH_PROJECTS_CACHE_KEY, list);
 })
 .catch((err) =>
 toast.error(err instanceof Error ? err.message : "Failed to load."),
 )
 .finally(() => setLoadingData(false));
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const filtered = useMemo(() => {
 const q = query.trim().toLowerCase();
 const skill = skillFilter.trim().toLowerCase();
 const loc = locationFilter.trim().toLowerCase();
 const com = commitmentFilter.trim().toLowerCase();
 const uid = user?.id;
 return projects.filter((p) => {
 // Hide projects the current user owns - including Polln8
 // recommendations the admin posted on behalf of someone else.
 // Those rows have owner_id = admin's uid even though the card
 // displays the recommended founder's name, so this single
 // ownership check covers both cases.
 if (uid && p.ownerId === uid) return false;
 if (decided.has(p.id)) return false;
 if (q) {
 const hay = `${p.title} ${p.description} ${p.criteria.skills.join(
 " ",
 )} ${p.criteria.commitment} ${p.criteria.location} ${p.criteria.keywords} ${p.founderFullName} ${p.founderHeadline}`.toLowerCase();
 if (!hay.includes(q)) return false;
 }
 if (
 skill &&
 !p.criteria.skills.some((s) => s.toLowerCase().includes(skill))
 )
 return false;
 if (loc && !p.criteria.location.toLowerCase().includes(loc)) return false;
 if (com && !p.criteria.commitment.toLowerCase().includes(com))
 return false;
 return true;
 });
 }, [projects, query, skillFilter, locationFilter, commitmentFilter, decided, user?.id]);

 const allSkills = useMemo(() => {
 const set = new Set<string>();
 for (const p of projects) for (const s of p.criteria.skills) set.add(s);
 return Array.from(set).sort();
 }, [projects]);

 const hasFilters = Boolean(
 query || skillFilter || locationFilter || commitmentFilter,
 );

 // `current` is the next undecided project in the deck. `displayed`
 // is what's actually on screen "" usually `current`, but when the
 // user taps a sibling project in the info panel we override it so
 // they can browse the founder's other work in place.
 const current = filtered[0] ?? null;
 const displayed = approving ?? current;
 // Mobile-only filter sheet open/close. Triggered by the search
 // icon in the mobile top bar.
 const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

 const decline = () => {
 if (!displayed) return;
 setApproving(null);
 setHistory((prev) => [...prev, displayed]);
 setDecided((prev) => new Set(prev).add(displayed.id));
 };
 const accept = () => {
 if (!displayed) return;
 // Swipe-right is a decision: stamp it into the deck so when the
 // info sheet is dismissed the deck has already advanced. The
 // info sheet stays visible until the user drags it down.
 setHistory((prev) => [...prev, displayed]);
 setDecided((prev) => new Set(prev).add(displayed.id));
 setApproving(displayed);
 };
 const closeInfo = () => {
 setApproving(null);
 };
 const goBack = () => {
 if (history.length === 0) return;
 const top = history[history.length - 1];
 setHistory((prev) => prev.slice(0, -1));
 setDecided((prev) => {
 const next = new Set(prev);
 next.delete(top.id);
 return next;
 });
 setApproving(null);
 };

 const filtersNode = (
 <Filters
 query={query}
 setQuery={setQuery}
 skill={skillFilter}
 setSkill={setSkillFilter}
 location={locationFilter}
 setLocation={setLocationFilter}
 commitment={commitmentFilter}
 setCommitment={setCommitmentFilter}
 skillOptions={SKILLS_OPTIONS}
 onClear={() => {
 setQuery("");
 setSkillFilter("");
 setLocationFilter("");
 setCommitmentFilter("");
 }}
 hasFilters={hasFilters}
 />
 );

 return (
 <>
 {/* Desktop renders the filter row inline at the top. Mobile
 hides it; the search icon in the mobile top bar opens
 the same Filters in a bottom sheet instead. */}
 {!fullscreen ? (
 <div className="hidden md:block">{filtersNode}</div>
 ) : null}

 {loadingData ? (
 <Loading />
 ) : !current ? (
 <div className="flex flex-col items-center">
 <MothEmptyState
 variant={
 hasFilters
 ? "filters"
 : decided.size > 0
 ? "caught"
 : "platform"
 }
 title={
 hasFilters
 ? "No matches."
 : decided.size > 0
 ? "You're caught up."
 : "No projects right now."
 }
 sub={
 hasFilters
 ? "Hawk-moths home in by scent, and your filters narrow the bouquet. Loosen a few and the field opens up."
 : decided.size > 0
 ? "You've worked through every project on the deck. Review the ones you've already seen, or wait for new ones to land."
 : "Be early. Once founders publish projects, they'll show up here."
 }
 />
 {!hasFilters && decided.size > 0 ? (
 <button
 type="button"
 onClick={() => setDecided(new Set())}
 className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-gold bg-card px-6 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-primary-foreground hover:border-gold"
 >
 <Undo2 className="h-4 w-4" />
 Review already seen ({decided.size})
 </button>
 ) : null}
 </div>
 ) : (
 <div
 className={cn(
 "relative",
 fullscreen
 ? "fixed inset-0 z-50 bg-background overflow-hidden"
 : "",
 )}
 >
 {/* DESKTOP top-bar controls: undo + full-screen toggle. */}
 <div
 className={cn(
 "hidden md:flex items-center gap-2",
 fullscreen
 ? "absolute top-4 left-4 z-20"
 : "justify-end mb-4",
 )}
 >
 {lastDecided ? (
 <button
 type="button"
 onClick={goBack}
 aria-label={`Undo: bring back ${lastDecided.title}`}
 title={`Undo: bring back "${lastDecided.title}"`}
 className="inline-flex items-center gap-1.5 rounded-sm border border-gold bg-gold px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-primary-foreground hover:bg-gold hover:border-gold transition-colors"
 >
 <Undo2 className="h-3.5 w-3.5" />
 Undo
 </button>
 ) : null}
 <button
 type="button"
 onClick={() => setFullscreen((v) => !v)}
 aria-label={fullscreen ? "Exit full-screen" : "Full-screen"}
 className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold transition-colors"
 >
 {fullscreen ? (
 <>
 <Minimize2 className="h-3.5 w-3.5" />
 Exit
 </>
 ) : (
 <>
 <Maximize2 className="h-3.5 w-3.5" />
 Full-screen
 </>
 )}
 </button>
 </div>

 {/* MOBILE top-bar "" two icons pinned to the very top-
 right of the viewport, above the page header. Previous
 rewinds the deck by one card; Search opens the filter
 bottom sheet (same Filters component the desktop
 renders inline). Fixed positioning + safe-area-inset
 keeps them clear of the iOS notch / Android status
 bar without leaning on the page's own layout. */}
 <div
 className="md:hidden fixed right-3 z-40 flex items-center gap-2"
 style={{
 top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
 }}
 >
 <button
 type="button"
 onClick={goBack}
 disabled={!lastDecided}
 aria-label="Previous card"
 className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-gold hover:text-primary-foreground hover:border-gold disabled:cursor-not-allowed"
 >
 <Undo2 className="h-4 w-4" />
 </button>
 <button
 type="button"
 onClick={() => setMobileFiltersOpen(true)}
 aria-label="Search and filter"
 className={cn(
 "flex h-10 w-10 items-center justify-center rounded-full border bg-card text-gold shadow-sm transition-colors",
 hasFilters
 ? "border-gold bg-gold"
 : "border-border hover:bg-gold hover:border-gold",
 )}
 >
 <Search className="h-4 w-4" />
 </button>
 </div>

 {/* DESKTOP deck stage - X | Card+Previous | Check row with
 a slide-in info panel on accept. Hidden under 768px in
 favour of the swipe deck below. */}
 <div
 className={cn(
 "relative mx-auto hidden md:flex items-center justify-center gap-6 px-4 py-6",
 fullscreen ? "h-[calc(100dvh-72px)]" : "",
 )}
 >
 <button
 type="button"
 onClick={decline}
 aria-label="Pass"
 className={cn(
 "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-destructive bg-card text-destructive shadow-sm hover:bg-destructive hover:border-destructive transition-all duration-500",
 approving &&
 "opacity-0 pointer-events-none scale-75 -mr-[80px]",
 )}
 >
 <X className="h-6 w-6" strokeWidth={2.2} />
 </button>

 {/* Desktop card width: 400px keeps card + Previous + side panel
 inside non-fullscreen viewport height (image aspect-[4/3]
 scales with width). */}
 <div className="w-full max-w-[400px] flex-shrink-0 flex flex-col gap-3">
 <MatchProjectCard project={displayed!} />
 <button
 type="button"
 onClick={goBack}
 disabled={!lastDecided}
 aria-label="Previous card"
 className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gold bg-card px-4 py-3 text-sm font-medium text-gold transition-all hover:bg-gold hover:text-primary-foreground hover:border-gold disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-card disabled:hover:text-gold disabled:hover:border-gold"
 >
 <ChevronLeft className="h-4 w-4" />
 Previous
 </button>
 </div>

 <button
 type="button"
 onClick={accept}
 aria-label="Approve"
 disabled={Boolean(approving)}
 className={cn(
 "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-gold bg-card text-gold shadow-sm hover:bg-gold hover:text-primary-foreground transition-all duration-500",
 approving &&
 "opacity-0 pointer-events-none scale-75 -ml-[80px]",
 )}
 >
 <Check className="h-6 w-6" strokeWidth={2.4} />
 </button>

 <div
 className={cn(
 "transition-all duration-500 ease-out overflow-hidden",
 approving
 ? approving.isPolln8Recommended
 ? "max-w-[120px] opacity-100"
 : "max-w-[420px] opacity-100"
 : "max-w-0 opacity-0 -ml-6",
 )}
 >
 {/* Polln8 recommendations get a slim icon-only column (chat /
 website / save) - same shape as the founder-side
 CandidateActions. Regular projects get the full info panel
 capped to viewport height so it scrolls internally. */}
 {approving ? (
 approving.isPolln8Recommended ? (
 <div className="w-[88px]">
 <Polln8ProjectActions
 project={approving}
 onClose={() => closeInfo()}
 />
 </div>
 ) : (
 <div className="w-[400px] max-h-[calc(100vh-160px)] overflow-y-auto rounded-2xl">
 <ProjectInfoPanel
 project={approving}
 canGoBack={Boolean(lastDecided)}
 onClose={() => closeInfo()}
 onBack={goBack}
 onSwitchProject={(p) => setApproving(p)}
 />
 </div>
 )
 ) : null}
 </div>
 </div>

 {/* MOBILE deck - card-only swipe deck. */}
 <div className="md:hidden mx-auto w-full max-w-[520px] px-3 py-4">
 <MobileSwipeCard
 top={<MatchProjectCard project={displayed!} />}
 under={
 filtered[1] ? (
 <MatchProjectCard project={filtered[1]} />
 ) : null
 }
 resetKey={displayed!.id}
 onSwipeLeft={decline}
 onSwipeRight={accept}
 />
 </div>

 {/* MOBILE info sheet - slides up on swipe-right. */}
 <div className="md:hidden">
 <BottomSheet
 open={Boolean(approving)}
 onClose={() => closeInfo()}
 >
 <div className="p-4 pb-12">
 {approving ? (
 approving.isPolln8Recommended ? (
 <Polln8ProjectActions
 project={approving}
 onClose={() => closeInfo()}
 />
 ) : (
 <ProjectInfoPanel
 project={approving}
 canGoBack={Boolean(lastDecided)}
 onClose={() => closeInfo()}
 onBack={goBack}
 onSwitchProject={(p) => setApproving(p)}
 />
 )
 ) : null}
 </div>
 </BottomSheet>
 </div>

 {/* MOBILE filter sheet "" same Filters component the
 desktop renders inline, surfaced via the search icon
 in the mobile top bar. */}
 <div className="md:hidden">
 <BottomSheet
 open={mobileFiltersOpen}
 onClose={() => setMobileFiltersOpen(false)}
 heightClass="h-[70dvh]"
 >
 <div className="p-4 pb-12">
 <h2 className="font-display text-2xl mb-4">
 Search + filter
 </h2>
 {filtersNode}
 </div>
 </BottomSheet>
 </div>
 </div>
 )}
 </>
 );
};

// Partner-side info panel "" the founder's full public profile
// rendered inline beside the project card on accept. Bio, skills,
// website, LinkedIn "" same content as /u/<founder> but laid out as
// a side panel so the partner can read it without leaving the
// deck. The icon-only action column on the founder side is
// intentionally different because it's framing a person, not a
// project; this surface frames a person.
// Polln8-recommended action panel - takes the place of the full
// ProjectInfoPanel for cards posted via the admin's "Recommend a
// startup" flow. Recommendations are featured cards, not full
// founder profiles, so the partner doesn't need bio / sibling
// projects / etc. - they just need three actions:
//   - Request chat (routes through the admin account; chat header
//     shows the polln8 founder alias on the requester's side)
//   - Save (adds to /saved like any normal project)
//   - Website (opens the project's polln8_founder_website in a
//     new tab; only renders when a website was set on the card)
const Polln8ProjectActions = ({
 project,
 onClose,
}: {
 project: PublicProject;
 onClose: () => void;
}) => {
 const navigate = useNavigate();
 const { user } = useAuth();
 const saved = useIsProjectSaved(project.id);

 const handleToggleSave = () => {
 // Unauth: bounce to /saved so the AuthGate message explains
 // what the saved tab does. Skips dropping them on /signin cold.
 if (!user) {
 navigate("/saved");
 return;
 }
 if (saved) {
 void removeSavedProject(project.id);
 toast.success("Removed.");
 } else {
 void addSavedProject(project);
 toast.success("Saved.");
 }
 };

 const handleMessage = () => {
 // Unauth: bounce to /chats so the AuthGate message tells them
 // chat needs an account, instead of dropping them on /signin
 // with no context.
 if (!user) {
 navigate("/chats");
 return;
 }
 onClose();
 // ?via stamps the chat_contacts row with the recommendation's
 // project id so the requester's DMs show the polln8 founder
 // name + photo instead of the admin owner.
 navigate(`/chats/${project.ownerId}?via=${project.id}`);
 };

 const website = project.polln8FounderWebsite;
 const websiteHref = website?.trim()
 ? website.startsWith("http")
 ? website
 : `https://${website}`
 : null;

 // Three stacked circular icon buttons - same shape as the
 // founder-side CandidateActions column. Polln8 recommendations
 // don't get a full info panel; just chat / website / save.
 return (
 <div className="flex flex-col items-center gap-3">
 {/* Chat - primary action, gold-filled */}
 <button
 type="button"
 onClick={handleMessage}
 aria-label="Request chat"
 title="Request chat"
 className="flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-gold text-primary-foreground shadow-sm transition-all hover:shadow-md"
 >
 <MessageCircle className="h-6 w-6" />
 </button>

 {/* Website (network icon). Disabled state matches founder-side
 LinkedIn-unavailable styling when no website was set. */}
 {websiteHref ? (
 <a
 href={websiteHref}
 target="_blank"
 rel="noopener noreferrer"
 aria-label="Open website"
 title="Open website"
 className="flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-card text-gold shadow-sm transition-all hover:bg-gold hover:text-primary-foreground hover:shadow-md"
 >
 <Globe className="h-6 w-6" />
 </a>
 ) : (
 <span
 aria-label="No website on file"
 title="No website on file"
 className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-muted-foreground cursor-not-allowed"
 >
 <Globe className="h-6 w-6" />
 </span>
 )}

 {/* Save */}
 <button
 type="button"
 onClick={handleToggleSave}
 aria-label={saved ? "Remove from saved" : "Save"}
 title={saved ? "Saved" : "Save"}
 className="flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-card text-gold shadow-sm transition-all hover:bg-gold hover:text-primary-foreground hover:shadow-md"
 >
 {saved ? (
 <BookmarkCheck className="h-6 w-6 fill-current" />
 ) : (
 <Bookmark className="h-6 w-6" />
 )}
 </button>

 {/* Close - smaller, secondary. Lets the user back out without
 swiping the card away. */}
 <button
 type="button"
 onClick={onClose}
 aria-label="Close"
 title="Close"
 className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-gold hover:text-foreground"
 >
 <X className="h-4 w-4" />
 </button>
 </div>
 );
};

const ProjectInfoPanel = ({
 project,
 canGoBack,
 onClose,
 onBack,
 onSwitchProject,
}: {
 project: PublicProject;
 canGoBack: boolean;
 onClose: () => void;
 onBack: () => void;
 onSwitchProject: (p: PublicProject) => void;
}) => {
 const navigate = useNavigate();
 const { user } = useAuth();
 const saved = useIsProjectSaved(project.id);
 const [founder, setFounder] = useState<PublicFounder | null>(null);
 // Every published project from this founder, including the one
 // currently on the deck. The active one is highlighted; clicking
 // any other swaps which one the deck displays.
 const [allProjects, setAllProjects] = useState<PublicProject[]>([]);
 const [loading, setLoading] = useState(true);

 // Re-fetch when the founder changes (i.e. user moved to a card
 // from a different owner). Switching between sibling projects
 // inside the same panel shouldn't refetch.
 useEffect(() => {
 setLoading(true);
 setFounder(null);
 setAllProjects([]);
 let cancelled = false;
 Promise.all([
 getPublicFounder(project.ownerId),
 listPublishedProjectsForOwner(project.ownerId).catch(() => []),
 ])
 .then(([f, projects]) => {
 if (cancelled) return;
 setFounder(f);
 setAllProjects(projects);
 })
 .catch(() => {
 if (!cancelled) setFounder(null);
 })
 .finally(() => {
 if (!cancelled) setLoading(false);
 });
 return () => {
 cancelled = true;
 };
 }, [project.ownerId]);

 const handleToggleSave = () => {
 // Unauth: bounce to /saved so the AuthGate explains saves;
 // dropping straight to /signin loses the context of why.
 if (!user) {
 navigate("/saved");
 return;
 }
 if (saved) {
 void removeSavedProject(project.id);
 toast.success("Removed.");
 } else {
 void addSavedProject(project);
 toast.success("Saved.");
 }
 };

 const handleMessage = () => {
 // Unauth: bounce to /chats so the AuthGate explains chat;
 // dropping straight to /signin loses the context of why.
 if (!user) {
 navigate("/chats");
 return;
 }
 onClose();
 // Polln8-recommended projects route the chat through the admin
 // owner but display under the project's polln8 founder name. Pass
 // the project id as ?via so the first message gets stamped with
 // the alias on chat_contacts.
 const target = project.isPolln8Recommended
 ? `/chats/${project.ownerId}?via=${project.id}`
 : `/chats/${project.ownerId}`;
 navigate(target);
 };

 return (
 <article className="relative rounded-2xl border border-gold bg-card shadow-sm">
 {/* Close in the corner so the panel header isn't cluttered. */}
 <button
 type="button"
 onClick={onClose}
 aria-label="Close info"
 className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-gold hover:text-foreground"
 >
 <X className="h-4 w-4" />
 </button>

 <div className="p-5">
 <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
 About the founder
 </p>
 <h3 className="mb-1 font-display text-xl leading-tight text-foreground">
 {founder?.fullName || project.founderFullName || "Loading..."}
 </h3>
 {founder?.headline || project.founderHeadline ? (
 <p className="mb-4 text-xs text-muted-foreground">
 {founder?.headline || project.founderHeadline}
 </p>
 ) : null}

 {loading && !founder ? (
 <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 Loading details
 </div>
 ) : (
 <>
 {founder?.bio ? (
 <p className="mb-4 line-clamp-6 text-sm leading-relaxed text-foreground">
 {founder.bio}
 </p>
 ) : null}

 {founder && founder.skills.length > 0 ? (
 <div className="mb-4">
 <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
 Skills
 </p>
 <div className="flex flex-wrap gap-1.5">
 {founder.skills.slice(0, 8).map((s) => (
 <span
 key={s}
 className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
 >
 {s}
 </span>
 ))}
 </div>
 </div>
 ) : null}

 {founder?.websiteUrl || founder?.linkedinUrl ? (
 <div className="mb-4 flex flex-wrap items-center gap-3">
 {founder.websiteUrl ? (
 <a
 href={founder.websiteUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline"
 >
 <Globe className="h-3.5 w-3.5" />
 Website
 <ExternalLink className="h-3 w-3 " />
 </a>
 ) : null}
 {founder.linkedinUrl ? (
 <a
 href={founder.linkedinUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline"
 >
 <Linkedin className="h-3.5 w-3.5" />
 LinkedIn
 <ExternalLink className="h-3 w-3 " />
 </a>
 ) : null}
 </div>
 ) : null}

 {allProjects.length > 0 ? (
 <div className="mb-4">
 <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
 Projects ({allProjects.length})
 </p>
 <ul className="space-y-2">
 {allProjects.map((p) => {
 const isActive = p.id === project.id;
 return (
 <li key={p.id}>
 <button
 type="button"
 onClick={() => {
 if (isActive) return;
 onSwitchProject(p);
 }}
 aria-current={isActive ? "true" : undefined}
 aria-label={
 isActive
 ? `${p.title} (currently viewing)`
 : `View ${p.title}`
 }
 className={cn(
 "block w-full rounded-sm border bg-card p-3 text-left transition-colors",
 isActive
 ? "border-primary cursor-default ring-2 ring-primary"
 : "border-border hover:border-gold hover:bg-accent",
 )}
 >
 <div className="mb-1 flex items-center gap-2">
 <p
 className={cn(
 "line-clamp-1 flex-1 text-sm font-medium",
 isActive ? "text-primary" : "text-foreground",
 )}
 >
 {p.title}
 </p>
 {isActive ? (
 <span className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary-foreground">
 Viewing
 </span>
 ) : null}
 </div>
 {p.description ? (
 <p
 className={cn(
 "line-clamp-2 text-xs leading-snug",
 isActive ? "text-foreground" : "text-muted-foreground",
 )}
 >
 {p.description}
 </p>
 ) : null}
 {p.criteria.skills.length > 0 ? (
 <div className="mt-2 flex flex-wrap gap-1">
 {p.criteria.skills.slice(0, 4).map((s) => (
 <span
 key={s}
 className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
 >
 {s}
 </span>
 ))}
 </div>
 ) : null}
 </button>
 </li>
 );
 })}
 </ul>
 </div>
 ) : null}
 </>
 )}

 <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
 {/* Back to previous card. Sits next to Request chat as a
 small icon button so the partner can rewind one card
 without leaving the panel. */}
 <button
 type="button"
 onClick={onBack}
 disabled={!canGoBack}
 aria-label="Back to previous card"
 title="Back to previous card"
 className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-gold hover:text-foreground disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground"
 >
 <ChevronLeft className="h-5 w-5" />
 </button>

 <button
 type="button"
 onClick={handleMessage}
 className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-gold bg-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold hover:shadow-md"
 >
 <MessageCircle className="h-4 w-4" />
 Request chat
 </button>

 <button
 type="button"
 onClick={handleToggleSave}
 aria-label={saved ? "Remove from saved" : "Save"}
 title={saved ? "Saved" : "Save"}
 className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gold bg-card text-gold transition-all hover:bg-gold hover:text-primary-foreground hover:border-gold"
 >
 {saved ? (
 <BookmarkCheck className="h-5 w-5 fill-current" />
 ) : (
 <Bookmark className="h-5 w-5" />
 )}
 </button>
 </div>
 </div>
 </article>
 );
};

// Partner-side project card. Visual twin of MatchCandidateCard so
// partners and founders see the same deck shape "" full-width 1:1
// photo at top, then title, then pills, then optional description.
const MatchProjectCard = ({ project }: { project: PublicProject }) => {
 const recommended = project.isPolln8Recommended;
 // Polln8 cards: prefer the admin-uploaded recommendation photo over
 // the project owner's profile avatar. Direct read so it works even
 // if listPublishedProjects' swap somehow missed.
 const avatarPath = recommended && project.polln8FounderAvatarPath
 ? project.polln8FounderAvatarPath
 : project.founderAvatarPath;
 const avatar = getAvatarUrl(avatarPath);
 const website = project.polln8FounderWebsite;
 return (
 <div className="flex flex-col gap-3">
 {recommended && website ? (
 <a
 href={website}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-2 self-start font-display text-2xl md:text-3xl font-bold tracking-tight text-primary hover:underline break-all"
 >
 <Globe className="h-5 w-5 flex-shrink-0" />
 {website.replace(/^https?:\/\//, "")}
 <ExternalLink className="h-4 w-4 flex-shrink-0" />
 </a>
 ) : null}
 <article
 className={cn(
 "overflow-hidden rounded-2xl bg-card shadow-sm",
 // Polln8-recommended cards get a heavier green outline so
 // partners can spot the curated picks at a glance.
 recommended ? "border-2 border-primary" : "border border-gold",
 )}
 >
 {recommended ? (
 <div className="bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
 Recommended by Polln8
 </div>
 ) : null}
 {/* Picture square "" full-width, 1:1 aspect. Grey field with
 silhouette icon when the founder has no avatar - matches the
 partner-card fallback above and the StepMatch anonymous
 silhouette on the How-it-works page. */}
 <div className="relative w-full aspect-[4/3] bg-muted">
 {avatar ? (
 <img
 src={avatar}
 alt={project.founderFullName}
 className="absolute inset-0 h-full w-full object-cover"
 />
 ) : (
 <div className="absolute inset-0 flex items-center justify-center">
 <User className="h-32 w-32 text-muted-foreground" strokeWidth={1.4} />
 </div>
 )}
 </div>

 {/* Body "" title, byline, pills, description. */}
 <div className="p-5">
 <h2 className="mb-1 font-display text-2xl leading-tight text-foreground">
 {project.title}
 </h2>
 <p className="mb-3 text-sm text-muted-foreground">
 by{" "}
 <span className="text-foreground">
 {project.founderFullName || "Anonymous"}
 </span>
 {project.founderHeadline ? ` · ${project.founderHeadline}` : null}
 </p>

 {(project.criteria.commitment ||
 project.criteria.location ||
 project.criteria.skills.length > 0) ? (
 <div className="mb-3 flex flex-wrap gap-1.5">
 {project.criteria.commitment ? (
 <span className="inline-flex items-center gap-1.5 rounded-full border border-gold bg-gold px-3 py-1 text-xs font-medium text-primary-foreground">
 <Briefcase className="h-3 w-3" />
 {project.criteria.commitment}
 </span>
 ) : null}
 {project.criteria.location ? (
 <span className="inline-flex items-center gap-1.5 rounded-full border border-gold bg-gold px-3 py-1 text-xs font-medium text-primary-foreground">
 <MapPin className="h-3 w-3" />
 {project.criteria.location}
 </span>
 ) : null}
 {project.criteria.skills.slice(0, 5).map((s) => (
 <span
 key={s}
 className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
 >
 {s}
 </span>
 ))}
 </div>
 ) : null}

 {project.description ? (
 <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
 {project.description}
 </p>
 ) : null}
 </div>
 </article>
 </div>
 );
};

// ============= Shared bits ==========================================

const Filters = ({
 query,
 setQuery,
 skill,
 setSkill,
 location,
 setLocation,
 commitment,
 setCommitment,
 skillOptions,
 onClear,
 hasFilters,
}: {
 query: string;
 setQuery: (v: string) => void;
 skill: string;
 setSkill: (v: string) => void;
 location: string;
 setLocation: (v: string) => void;
 commitment: string;
 setCommitment: (v: string) => void;
 skillOptions: string[];
 onClear: () => void;
 hasFilters: boolean;
}) => (
 <div className="space-y-3 mb-8">
 <div className="relative max-w-xl">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Search title, skills, founder..."
 className="pl-10 h-11 bg-card border-border focus-visible:border-gold focus-visible:ring-gold"
 />
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <Autocomplete
 value={skill}
 onChange={setSkill}
 options={skillOptions}
 placeholder="Filter by skill"
 allowCustom
 />
 <Autocomplete
 value={location}
 onChange={setLocation}
 options={LOCATION_OPTIONS}
 placeholder="Filter by location"
 allowCustom
 />
 <Autocomplete
 value={commitment}
 onChange={setCommitment}
 options={COMMITMENT_OPTIONS}
 placeholder="Any commitment (type to filter)"
 allowCustom
 />
 </div>
 {hasFilters && (
 <button
 type="button"
 onClick={onClear}
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
 >
 Clear filters
 </button>
 )}
 </div>
);

const Loading = () => (
 <div className="rounded-sm border border-border bg-card p-12 text-center">
 <Loader2 className="h-5 w-5 text-gold animate-spin mx-auto mb-3" />
 <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
 Loading...
 </p>
 </div>
);

const Empty = ({ title, body }: { title: string; body: string }) => (
 <div className="rounded-sm border border-dashed border-border bg-card p-12 text-center">
 <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-3">
 All caught up
 </p>
 <h3 className="font-display text-2xl mb-3">{title}</h3>
 <p className="text-sm text-muted-foreground max-w-md mx-auto">{body}</p>
 </div>
);

export default Match;

