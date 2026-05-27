"use client";
/**
 * Saved page. Role-aware:
 *
 * Partner POV -> list of projects bookmarked from Match / Talent /
 * project detail. Source: local saved-projects store
 * (`useSavedProjects`).
 * Founder POV -> list of candidates the founder saved across their
 * projects. Source: each project's `savedPersonIds`
 * joined with `getCandidatesByIds`.
 *
 * Partners can star one saved project as their current focus " same
 * semantic as the founder-side active-project picker.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
 ArrowRight,
 Bookmark,
 Briefcase,
 ExternalLink,
 Linkedin,
 MapPin,
 MessageCircle,
 Star,
 X,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/netstart/AppLayout";
import { AuthGate } from "@/components/netstart/AuthGate";
import {
 MothEmptyState,
 type MothVariant,
} from "@/components/netstart/MothEmptyState";
import { useReviewStatus } from "@/hooks/useReviewStatus";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
 getAvatarUrl,
 getCandidatesByIds,
 listProjects,
} from "@/lib/mynet-storage";
import {
 removeSavedProject,
 setActiveSavedProject,
 useActiveSavedProjectId,
 useSavedProjects,
} from "@/lib/savedProjects";
import type { Candidate, PublicProject } from "@/lib/mynet-types";
import { cn } from "@/lib/utils";
import { readCache, writeCache } from "@/lib/cache";
import { readIntroOpened, writeIntroOpened } from "@/lib/introGate";

type Role = "founder" | "partner";

const initials = (name: string): string => {
 if (!name.trim()) return "?";
 return name
 .trim()
 .split(/\s+/)
 .slice(0, 2)
 .map((p) => p[0]?.toUpperCase() ?? "")
 .join("");
};

const readMetadataRole = (
 user: { user_metadata?: Record<string, unknown> } | null,
): Role | null => {
 const r = user?.user_metadata?.role;
 return r === "founder" || r === "partner" ? r : null;
};

const SAVED_CANDIDATES_CACHE_KEY = "polln8.saved.candidates";

const Saved = () => {
 // Intro gate: only shown the first time the user opens Saved on
 // this device. Stored in localStorage so reloads and new tabs
 // land straight on the list.
 const [opened, setOpenedState] = useState<boolean>(() =>
 readIntroOpened("saved"),
 );
 const setOpened = (next: boolean) => {
 writeIntroOpened("saved", next);
 setOpenedState(next);
 };
 const { user, loading } = useAuth();
 const reviewStatus = useReviewStatus();
 const needsSetup =
 Boolean(user) && reviewStatus !== null && reviewStatus !== "accepted";
 // Per-user localStorage cache so returning to /saved is instant.
 const cacheKey = user?.id
 ? `${SAVED_CANDIDATES_CACHE_KEY}.${user.id}`
 : null;
 const [savedCandidates, setSavedCandidates] = useState<Candidate[]>(() =>
 cacheKey ? readCache<Candidate[]>(cacheKey) ?? [] : [],
 );
 const [hasProjects, setHasProjects] = useState(false);
 const [loadingFounder, setLoadingFounder] = useState(false);

 // Re-hydrate from cache when user.id becomes known (auth was still
 // loading on first render).
 useEffect(() => {
 if (!cacheKey || savedCandidates.length > 0) return;
 const cached = readCache<Candidate[]>(cacheKey);
 if (cached && cached.length > 0) setSavedCandidates(cached);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [user?.id]);

 const role: Role = useMemo(
 () => readMetadataRole(user) ?? (hasProjects ? "founder" : "partner"),
 [user, hasProjects],
 );

 // Founder data: aggregate savedPersonIds across their projects.
 useEffect(() => {
 if (!user) return;
 let cancelled = false;
 setLoadingFounder(true);
 (async () => {
 try {
 const ps = await listProjects(user.id);
 if (cancelled) return;
 setHasProjects(ps.length > 0);
 const ids = new Set<string>();
 for (const p of ps) for (const id of p.savedPersonIds) ids.add(id);
 if (ids.size === 0) {
 if (!cancelled) setSavedCandidates([]);
 return;
 }
 const cands = await getCandidatesByIds(Array.from(ids));
 if (!cancelled) {
 setSavedCandidates(cands);
 if (cacheKey) writeCache(cacheKey, cands);
 }
 } catch {
 // soft-fail; empty state will render
 } finally {
 if (!cancelled) setLoadingFounder(false);
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [user]);

 if (!opened) {
 // Saved intro: text-first vertical column with the moth "saves"
 // empty-state illustration tucked beside the headline. No detail
 // tiles - just two inline callouts to keep the page light.
 return (
 <AppLayout>
 <div className="container max-w-4xl py-12 md:py-16">
 <div className="grid md:grid-cols-[1fr_auto] gap-8 items-start mb-10">
 <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1] font-bold">
 Your shortlist.
 </h1>
 <div className="w-40 md:w-52 shrink-0">
 <MothEmptyState variant="saves" compact />
 </div>
 </div>

 <div className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl space-y-4">
 <p>
 Saved is where everything you bookmarked from Match ends up.
 Partners save projects they want to circle back to.
 Founders save candidates they want to revisit before
 sending a chat request.
 </p>
 <p>
 Synced across every device you&apos;re signed in on. Open
 one to see the full profile, message them, or remove it
 from the list.
 </p>
 </div>

 <div className="border-l-2 border-gold pl-5 mb-10 max-w-2xl space-y-3">
 <p className="text-sm text-foreground leading-relaxed">
 <span className="font-semibold">Cross-device sync.</span>{" "}
 Save on your laptop, open on your phone. Your shortlist
 lives with your account.
 </p>
 <p className="text-sm text-foreground leading-relaxed">
 <span className="font-semibold">Star one as your focus.</span>{" "}
 Partners can pick one saved project as their current focus,
 same as the founder-side active project.
 </p>
 </div>

 <Button
 variant="gold"
 size="xl"
 onClick={() => setOpened(true)}
 className="group"
 >
 Open Saved
 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
 </Button>
 </div>
 </AppLayout>
 );
 }

 return (
 <AppLayout>
 <AuthGate
 authLoading={loading}
 signedIn={Boolean(user)}
 needsSetup={needsSetup}
 authTitle="Sign in to see your saves"
 authBody="Saved people and projects live with your account so you can come back to them across devices."
 setupTitle="Finish setting up MyNet to start saving."
 setupBody="Your shortlist unlocks once your MyNet profile is set up. It only takes a minute."
 >
 <div className="container py-10">
 <header className="mb-8">
 <h1 className="mb-2 font-display text-4xl leading-[1.05] md:text-5xl">
 Your shortlist.
 </h1>
 <p className="max-w-xl text-muted-foreground">
 {role === "partner"
 ? "Projects you bookmarked. Star one to mark it as your current focus."
 : "Partners you saved across your projects. Tap any to revisit."}
 </p>
 </header>

 {role === "partner" ? (
 <PartnerSaved />
 ) : (
 <FounderSaved
 candidates={savedCandidates}
 loading={loadingFounder}
 />
 )}
 </div>
 </AuthGate>
 </AppLayout>
 );
};

// """ partner """""""""""""""""""""""""""""""""""""""""""""""""""""""

const PartnerSaved = () => {
 const projects = useSavedProjects();
 const activeId = useActiveSavedProjectId();

 if (projects.length === 0) {
 return (
 <EmptyCard
 variant="saves"
 title="No saved projects yet."
 body="Open Match and tap the bookmark on any project to save it. Saved projects land here."
 />
 );
 }

 return (
 <ul className="grid gap-3">
 {projects.map((p) => (
 <SavedProjectCard
 key={p.id}
 project={p}
 isActive={p.id === activeId}
 />
 ))}
 </ul>
 );
};

const SavedProjectCard = ({
 project,
 isActive,
}: {
 project: PublicProject;
 isActive: boolean;
}) => {
 // Polln8 recommendations show the admin-uploaded founder photo
 // instead of the (admin's) profile avatar.
 const founderUrl = getAvatarUrl(
 project.isPolln8Recommended && project.polln8FounderAvatarPath
 ? project.polln8FounderAvatarPath
 : project.founderAvatarPath,
 );
 return (
 <li
 className={cn(
 "group flex flex-col gap-3 rounded-sm border bg-card p-4 transition-colors sm:flex-row sm:items-start",
 isActive ? "border-gold bg-gold" : "border-border hover:border-gold",
 )}
 >
 <Link
 to={`/u/${project.ownerId}`}
 className="flex shrink-0 items-center gap-3 sm:block"
 aria-label={`View founder ${project.founderFullName}`}
 >
 <Avatar className="size-12">
 {founderUrl ? <AvatarImage src={founderUrl} alt="" /> : null}
 <AvatarFallback>{initials(project.founderFullName)}</AvatarFallback>
 </Avatar>
 </Link>
 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-baseline gap-2">
 <h3 className="font-display text-lg leading-tight text-foreground">
 {project.title}
 </h3>
 {isActive ? (
 <span className="inline-flex items-center gap-1 rounded-sm border border-gold bg-card px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-gold">
 <Star className="size-2.5 fill-gold text-gold" />
 Focus
 </span>
 ) : null}
 </div>
 {project.founderFullName ? (
 <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
 {project.founderFullName}
 </p>
 ) : null}
 {project.description ? (
 <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
 {project.description}
 </p>
 ) : null}
 <div className="mt-3 flex flex-wrap gap-1.5">
 {project.businessType ? (
 <Pill icon={<Briefcase className="size-2.5" />}>{project.businessType}</Pill>
 ) : null}
 {project.criteria.commitment ? (
 <Pill>{project.criteria.commitment}</Pill>
 ) : null}
 {project.criteria.location ? (
 <Pill icon={<MapPin className="size-2.5" />}>{project.criteria.location}</Pill>
 ) : null}
 {(project.criteria.skills ?? []).slice(0, 4).map((s) => (
 <Pill key={s} muted>
 {s}
 </Pill>
 ))}
 </div>
 </div>
 <div className="flex flex-row gap-2 sm:flex-col">
 <Button
 variant={isActive ? "gold" : "outline"}
 size="sm"
 onClick={() => setActiveSavedProject(project.id)}
 aria-label={isActive ? "Unmark focus" : "Set as focus"}
 >
 <Star
 className={cn(
 "size-3.5",
 isActive ? "fill-current" : undefined,
 )}
 />
 <span className="ml-1 hidden sm:inline">
 {isActive ? "Focus" : "Set focus"}
 </span>
 </Button>
 <Button
 asChild
 variant="outline"
 size="sm"
 aria-label="Message founder"
 >
 <Link
 to={
 project.isPolln8Recommended
 ? `/chats/${project.ownerId}?via=${project.id}`
 : `/chats/${project.ownerId}`
 }
 >
 <MessageCircle className="size-3.5" />
 <span className="ml-1 hidden sm:inline">Message</span>
 </Link>
 </Button>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => {
 removeSavedProject(project.id);
 toast.success("Removed from saved.");
 }}
 aria-label="Remove from saved"
 >
 <X className="size-3.5" />
 <span className="ml-1 hidden sm:inline">Remove</span>
 </Button>
 </div>
 </li>
 );
};

// """ founder """""""""""""""""""""""""""""""""""""""""""""""""""""""

const FounderSaved = ({
 candidates,
 loading,
}: {
 candidates: Candidate[];
 loading: boolean;
}) => {
 if (loading && candidates.length === 0) {
 return (
 <div className="rounded-sm border border-border bg-card p-8 text-center text-sm text-muted-foreground">
 Loading saved partners...
 </div>
 );
 }
 if (candidates.length === 0) {
 return (
 <EmptyCard
 variant="saves"
 title="No saves yet."
 body="Use Match to swipe-save partners you want to revisit. They'll show up here grouped by project."
 />
 );
 }
 return (
 <ul className="grid gap-3">
 {candidates.map((c) => (
 <SavedCandidateCard key={c.userId} candidate={c} />
 ))}
 </ul>
 );
};

const SavedCandidateCard = ({ candidate }: { candidate: Candidate }) => {
 const url = getAvatarUrl(candidate.avatarPath);
 return (
 <li className="flex flex-col gap-3 rounded-sm border border-border bg-card p-4 transition-colors hover:border-gold sm:flex-row sm:items-center">
 <Avatar className="size-12 shrink-0">
 {url ? <AvatarImage src={url} alt="" /> : null}
 <AvatarFallback>{initials(candidate.fullName)}</AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <h3 className="truncate font-display text-lg text-foreground">
 {candidate.fullName || "Unnamed"}
 </h3>
 {candidate.headline ? (
 <p className="line-clamp-2 text-sm text-muted-foreground">
 {candidate.headline}
 </p>
 ) : null}
 <div className="mt-2 flex flex-wrap gap-1.5">
 {candidate.commitment ? <Pill>{candidate.commitment}</Pill> : null}
 {candidate.location ? (
 <Pill icon={<MapPin className="size-2.5" />}>{candidate.location}</Pill>
 ) : null}
 {(candidate.skills ?? []).slice(0, 4).map((s) => (
 <Pill key={s} muted>
 {s}
 </Pill>
 ))}
 </div>
 </div>
 <div className="flex flex-row gap-2 sm:flex-col">
 <Button asChild variant="outline" size="sm">
 <Link to={`/chats/${candidate.userId}`}>
 <MessageCircle className="size-3.5" />
 <span className="ml-1 hidden sm:inline">Message</span>
 </Link>
 </Button>
 {candidate.linkedinUrl ? (
 <Button asChild variant="ghost" size="sm">
 <a
 href={candidate.linkedinUrl}
 target="_blank"
 rel="noreferrer noopener"
 >
 <Linkedin className="size-3.5" />
 <span className="ml-1 hidden sm:inline">LinkedIn</span>
 </a>
 </Button>
 ) : null}
 <Button asChild variant="ghost" size="sm">
 <Link to={`/u/${candidate.userId}`}>
 <ExternalLink className="size-3.5" />
 <span className="ml-1 hidden sm:inline">Profile</span>
 </Link>
 </Button>
 </div>
 </li>
 );
};

// """ shared bits """"""""""""""""""""""""""""""""""""""""""""""""""""

const Pill = ({
 children,
 icon,
 muted,
}: {
 children: React.ReactNode;
 icon?: React.ReactNode;
 muted?: boolean;
}) => (
 <span
 className={cn(
 "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px]",
 muted
 ? "border-border bg-muted text-muted-foreground"
 : "border-gold bg-gold text-primary-foreground",
 )}
 >
 {icon}
 {children}
 </span>
);

const EmptyCard = ({
 variant,
 title,
 body,
}: {
 variant: MothVariant;
 title: string;
 body: string;
}) => (
 <div className="rounded-sm border border-border bg-card">
 <MothEmptyState variant={variant} title={title} sub={body} />
 </div>
);

export default Saved;
