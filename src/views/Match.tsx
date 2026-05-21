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
import { COMMITMENT_OPTIONS, LOCATION_OPTIONS } from "@/lib/options";
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
  // Intro gate: every visit lands on a brief explainer screen.
  // Click CTA -> render real page (gated by AuthGate downstream).
  const [opened, setOpened] = useState(false);
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
  // Auth role is the primary signal: a builder swipes projects, a
  // founder swipes candidates. Fall back to project ownership only
  // for legacy users who pre-date the role stamp on user_metadata.
  // (Naming is unfortunate: userMode "builder" = founder-side view;
  // "looker" = builder-side view. Kept for now since both branches
  // below already use those names.)
  const role = user?.user_metadata?.role as string | undefined;
  const userMode: "builder" | "looker" =
    role === "builder"
      ? "looker"
      : role === "founder"
        ? "builder"
        : hasProjects
          ? "builder"
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
                The ranked deck. Founders see builders ordered against
                their active project&apos;s criteria. Builders see
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
    <AppLayout blurred={!isAuthed}>
        <div className="container">
          <header className="mb-6 md:mb-10">
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl leading-[1] mb-3 md:mb-4">
              {userMode === "builder"
                ? "Find your builder."
                : "Find a project."}
            </h1>
            <p className="text-muted-foreground max-w-xl text-sm md:text-base">
              {userMode === "builder"
                ? "Vetted builders, one at a time. Accept the ones you want to talk to and pass the rest."
                : "Founders building right now. Browse one by one and apply when something fits."}
            </p>
          </header>

          {loadingMode && isAuthed ? (
            <Loading />
          ) : isAuthed && !isAccepted ? (
            Locked
          ) : userMode === "builder" ? (
            <BuilderView />
          ) : (
            <LookerView />
          )}
        </div>

      {!loading && !user && <AuthGate />}
    </AppLayout>
  );
};

// ============= Builder view: swipe through lookers ===================

const MATCH_CANDIDATES_CACHE_KEY = "polln8.match.candidates";

const BuilderView = () => {
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
  const [decided, setDecided] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Candidate | null>(null);
  // Founder's active/first project â€” drives where Save lands plus
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

  // Last candidate we decided on (passed or sent to info pane).
  // Drives the undo button so a stray click on X doesn't lose
  // someone permanently.
  const [lastDecided, setLastDecided] = useState<Candidate | null>(null);

  const decline = () => {
    if (!current) return;
    setApproving(null);
    setLastDecided(current);
    setDecided((prev) => new Set(prev).add(current.userId));
  };
  const accept = () => {
    if (!current) return;
    setApproving(current);
  };
  const closeInfo = (decideThem: boolean) => {
    const target = approving ?? detail;
    if (decideThem && target) {
      setLastDecided(target);
      setDecided((prev) => new Set(prev).add(target.userId));
    }
    setApproving(null);
    setDetail(null);
  };
  const undo = () => {
    if (!lastDecided) return;
    setDecided((prev) => {
      const next = new Set(prev);
      next.delete(lastDecided.userId);
      return next;
    });
    setApproving(null);
    setLastDecided(null);
  };

  return (
    <>
      {/* Active-project banner + Filters are hidden in full-screen
          mode so the deck takes over the whole canvas. */}
      {!fullscreen && activeProjectTitle ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-gold bg-gold px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-3.5 w-3.5 text-gold flex-shrink-0" />
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
          skillOptions={allSkills}
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
        <MothEmptyState
          variant={hasFilters ? "filters" : "caught"}
          title={hasFilters ? "No matches." : "You're caught up."}
          sub={
            hasFilters
              ? "Hawk-moths home in by scent, and your filters narrow the bouquet. Loosen a few and the field opens up."
              : "You've worked through every builder that's open right now. New ones will land here as they sign up."
          }
        />
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
                className="inline-flex items-center gap-1.5 rounded-sm border border-gold bg-gold px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-white hover:bg-gold hover:border-gold transition-colors"
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

          {/* Deck stage â€” single flex row, justify-center. The card
              + side buttons (or action buttons when approving) move
              together as a unit. No absolute positioning, no big
              gaps; the card visibly slides left as the action
              buttons grow into existence on the right. */}
          <div
            className={cn(
              "relative mx-auto flex items-center justify-center gap-6 px-4",
              fullscreen
                ? "min-h-[calc(100vh-72px)] py-12"
                : "min-h-[760px] py-6",
            )}
          >
            {/* X button â€” collapses out of the flex layout when the
                user approves so the row doesn't keep dead space. */}
            <button
              type="button"
              onClick={decline}
              aria-label="Pass"
              className={cn(
                "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-destructive/40 bg-card text-destructive shadow-sm hover:bg-destructive/10 hover:border-destructive/60 transition-all duration-500",
                approving &&
                  "opacity-0 pointer-events-none scale-75 -mr-[80px]",
              )}
            >
              <X className="h-6 w-6" strokeWidth={2.2} />
            </button>

            {/* The card itself â€” fixed width, never shifts on its
                own. Justify-center on the parent does the visual
                slide as the action column grows on the right. */}
            <div className="w-full max-w-[520px] flex-shrink-0">
              <MatchCandidateCard candidate={current} />
            </div>

            {/* âœ“ button â€” same collapse trick on the other side. */}
            <button
              type="button"
              onClick={accept}
              aria-label="Approve"
              disabled={Boolean(approving)}
              className={cn(
                "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-gold bg-card text-gold shadow-sm hover:bg-gold transition-all duration-500",
                approving &&
                  "opacity-0 pointer-events-none scale-75 -ml-[80px]",
              )}
            >
              <Check className="h-6 w-6" strokeWidth={2.4} />
            </button>

            {/* Action column â€” only the LinkedIn / resume / save /
                message buttons. No box, no headings. Width animates
                from 0 to auto so the card recenters smoothly. */}
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
      {/* Picture square â€” full-width, 1:1 aspect, dominates the card. */}
      <div className="relative w-full aspect-square bg-gold">
        {avatar ? (
          <img
            src={avatar}
            alt={candidate.fullName}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-7xl text-gold/60">
              {initials(candidate.fullName)}
            </span>
          </div>
        )}
      </div>

      {/* Body â€” name, pills, bio. */}
      <div className="p-5">
        <h2 className="mb-2 font-display text-2xl leading-tight text-foreground">
          {candidate.fullName || "Unnamed"}
        </h2>

        {(candidate.commitment ||
          candidate.location ||
          candidate.skills.length > 0) ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {candidate.commitment ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold bg-gold px-3 py-1 text-xs font-medium text-white">
                <Sparkles className="h-3 w-3" />
                {candidate.commitment}
              </span>
            ) : null}
            {candidate.location ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold bg-gold px-3 py-1 text-xs font-medium text-white">
                <MapPin className="h-3 w-3" />
                {candidate.location}
              </span>
            ) : null}
            {candidate.skills.slice(0, 5).map((s) => (
              <span
                key={s}
                className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}

        {candidate.headline ? (
          <p className="mb-2 text-sm font-medium text-foreground/90">
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
// box â€” the buttons themselves stand free next to the card.
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
    // Saves attach to a project. Without one published & marked
    // active in MyNet, there's nowhere to store the save â€” so the
    // old behavior silently lost data. Block the action and tell the
    // founder exactly what to do.
    if (!activeProjectId) {
      toast.error("Finish your active project in MyNet first", {
        description:
          "Builders are ranked against your active project's criteria â€” and saves attach to it. Publish a project in MyNet, then mark it active.",
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
          className="flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-card text-white shadow-sm transition-all hover:bg-gold hover:border-gold hover:shadow-md"
        >
          <Linkedin className="h-6 w-6" />
        </a>
      ) : (
        <span
          aria-label="LinkedIn unavailable"
          title="No LinkedIn on file"
          className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground/50 cursor-not-allowed"
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
          className="flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-card text-white shadow-sm transition-all hover:bg-gold hover:border-gold hover:shadow-md"
        >
          <FileText className="h-6 w-6" />
        </a>
      ) : (
        <span
          aria-label={
            candidate.resumeName ? "Resume loading" : "No resume on file"
          }
          title={candidate.resumeName ?? "No resume on file"}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground/50 cursor-not-allowed"
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
        className="flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-card text-white shadow-sm transition-all hover:bg-gold hover:border-gold hover:shadow-md disabled:opacity-50"
      >
        {saved ? (
          <BookmarkCheck className="h-6 w-6 fill-current" />
        ) : (
          <Bookmark className="h-6 w-6" />
        )}
      </button>

      {/* Message â€” primary action */}
      <button
        type="button"
        onClick={handleMessage}
        disabled={working}
        aria-label="Message"
        title="Message"
        className="flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-gold text-white-foreground shadow-sm transition-all hover:bg-gold hover:shadow-md disabled:opacity-50"
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

// ============= Looker view: arrows through builders ==================

const MATCH_PROJECTS_CACHE_KEY = "polln8.match.projects";

const LookerView = () => {
  const [projects, setProjects] = useState<PublicProject[]>(
    () => readCache<PublicProject[]>(MATCH_PROJECTS_CACHE_KEY) ?? [],
  );
  const [loadingData, setLoadingData] = useState(false);
  const [query, setQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [commitmentFilter, setCommitmentFilter] = useState("");
  // Same deck pattern as the founder side: passed/seen project ids
  // drop out of `filtered`. `approving` is the project the user
  // tapped âœ“ on â€” drives the action pane that slides in from the
  // right. `lastDecided` powers Undo / the Back button in the pane.
  const [decided, setDecided] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState<PublicProject | null>(null);
  const [lastDecided, setLastDecided] = useState<PublicProject | null>(null);
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
    return projects.filter((p) => {
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
  }, [projects, query, skillFilter, locationFilter, commitmentFilter, decided]);

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) for (const s of p.criteria.skills) set.add(s);
    return Array.from(set).sort();
  }, [projects]);

  const hasFilters = Boolean(
    query || skillFilter || locationFilter || commitmentFilter,
  );

  // `current` is the next undecided project in the deck. `displayed`
  // is what's actually on screen â€” usually `current`, but when the
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
    setLastDecided(displayed);
    setDecided((prev) => new Set(prev).add(displayed.id));
  };
  const accept = () => {
    if (!displayed) return;
    // Swipe-right is a decision: stamp it into the deck so when the
    // info sheet is dismissed the deck has already advanced. The
    // info sheet stays visible until the user drags it down.
    setLastDecided(displayed);
    setDecided((prev) => new Set(prev).add(displayed.id));
    setApproving(displayed);
  };
  const closeInfo = () => {
    setApproving(null);
  };
  const goBack = () => {
    if (!lastDecided) return;
    setDecided((prev) => {
      const next = new Set(prev);
      next.delete(lastDecided.id);
      return next;
    });
    setApproving(null);
    setLastDecided(null);
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
      skillOptions={allSkills}
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
        <MothEmptyState
          variant={hasFilters ? "filters" : "platform"}
          title={hasFilters ? "No matches." : "No projects right now."}
          sub={
            hasFilters
              ? "Hawk-moths home in by scent, and your filters narrow the bouquet. Loosen a few and the field opens up."
              : "Be early. Once founders publish projects, they'll show up here."
          }
        />
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
                className="inline-flex items-center gap-1.5 rounded-sm border border-gold bg-gold px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-white hover:bg-gold hover:border-gold transition-colors"
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

          {/* MOBILE top-bar â€” two icons pinned to the very top-
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
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 backdrop-blur text-white shadow-sm transition-colors hover:bg-gold hover:border-gold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              aria-label="Search and filter"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border bg-card/95 backdrop-blur text-gold shadow-sm transition-colors",
                hasFilters
                  ? "border-gold bg-gold"
                  : "border-border hover:bg-gold hover:border-gold",
              )}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* DESKTOP deck stage â€” X | Card | âœ“ row with a slide-in
              info panel on accept. Hidden under 768px in favour of
              the swipe deck below. */}
          <div
            className={cn(
              "relative mx-auto hidden md:flex items-center justify-center gap-6 px-4",
              fullscreen
                ? "min-h-[calc(100vh-72px)] py-12"
                : "min-h-[760px] py-6",
            )}
          >
            <button
              type="button"
              onClick={decline}
              aria-label="Pass"
              className={cn(
                "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-destructive/40 bg-card text-destructive shadow-sm hover:bg-destructive/10 hover:border-destructive/60 transition-all duration-500",
                approving &&
                  "opacity-0 pointer-events-none scale-75 -mr-[80px]",
              )}
            >
              <X className="h-6 w-6" strokeWidth={2.2} />
            </button>

            <div className="w-full max-w-[520px] flex-shrink-0 flex flex-col gap-3">
              <MatchProjectCard project={displayed!} />
              <button
                type="button"
                onClick={goBack}
                disabled={!lastDecided}
                aria-label="Previous card"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gold bg-card px-4 py-3 text-sm font-medium text-white transition-all hover:bg-gold hover:border-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:border-gold"
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
                "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-gold bg-card text-gold shadow-sm hover:bg-gold transition-all duration-500",
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
                  ? "max-w-[540px] opacity-100"
                  : "max-w-0 opacity-0 -ml-6",
              )}
            >
              <div className="w-[520px]">
                {approving ? (
                  <ProjectInfoPanel
                    project={approving}
                    canGoBack={Boolean(lastDecided)}
                    onClose={() => closeInfo()}
                    onBack={goBack}
                    onSwitchProject={(p) => setApproving(p)}
                  />
                ) : null}
              </div>
            </div>
          </div>

          {/* MOBILE deck â€” swipe-left = pass, swipe-right = save +
              open the info sheet. Mirrors the Expo Match feel:
              one card, stacked under-card peeking, no buttons. */}
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

          {/* MOBILE info sheet â€” bottom sheet (~85dvh) that slides
              up on swipe-right. The card behind stays visible in
              the gap at the top. Drag the handle down to dismiss
              and the deck moves on (the project was already
              stamped decided by accept()). */}
          <div className="md:hidden">
            <BottomSheet
              open={Boolean(approving)}
              onClose={() => closeInfo()}
            >
              <div className="p-4 pb-12">
                {approving ? (
                  <ProjectInfoPanel
                    project={approving}
                    canGoBack={Boolean(lastDecided)}
                    onClose={() => closeInfo()}
                    onBack={goBack}
                    onSwitchProject={(p) => setApproving(p)}
                  />
                ) : null}
              </div>
            </BottomSheet>
          </div>

          {/* MOBILE filter sheet â€” same Filters component the
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

// Builder-side info panel â€” the founder's full public profile
// rendered inline beside the project card on accept. Bio, skills,
// website, LinkedIn â€” same content as /u/<founder> but laid out as
// a side panel so the builder can read it without leaving the
// deck. The icon-only action column on the founder side is
// intentionally different because it's framing a person, not a
// project; this surface frames a person.
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
    if (saved) {
      void removeSavedProject(project.id);
      toast.success("Removed.");
    } else {
      void addSavedProject(project);
      toast.success("Saved.");
    }
  };

  const handleMessage = () => {
    onClose();
    navigate(`/chats/${project.ownerId}`);
  };

  return (
    <article className="relative rounded-2xl border border-gold bg-card shadow-sm">
      {/* Close in the corner so the panel header isn't cluttered. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close info"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition-colors hover:border-gold hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="p-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
          About the founder
        </p>
        <h3 className="mb-1 font-display text-xl leading-tight text-foreground">
          {founder?.fullName || project.founderFullName || "Loadingâ€¦"}
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
              <p className="mb-4 line-clamp-6 text-sm leading-relaxed text-foreground/90">
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
                      className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground"
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
                    <ExternalLink className="h-3 w-3 opacity-60" />
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
                    <ExternalLink className="h-3 w-3 opacity-60" />
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
                            "block w-full rounded-sm border bg-background/40 p-3 text-left transition-colors",
                            isActive
                              ? "border-emerald-500/60 bg-emerald-500/5 cursor-default"
                              : "border-border hover:border-gold hover:bg-card",
                          )}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <p className="line-clamp-1 flex-1 text-sm font-medium text-foreground">
                              {p.title}
                            </p>
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Viewing
                              </span>
                            ) : null}
                          </div>
                          {p.description ? (
                            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                              {p.description}
                            </p>
                          ) : null}
                          {p.criteria.skills.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {p.criteria.skills.slice(0, 4).map((s) => (
                                <span
                                  key={s}
                                  className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground"
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
              small icon button so the builder can rewind one card
              without leaving the panel. */}
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            aria-label="Back to previous card"
            title="Back to previous card"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-gold hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={handleMessage}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-gold bg-gold px-4 py-2.5 text-sm font-semibold text-white-foreground transition-all hover:bg-gold hover:shadow-md"
          >
            <MessageCircle className="h-4 w-4" />
            Request chat
          </button>

          <button
            type="button"
            onClick={handleToggleSave}
            aria-label={saved ? "Remove from saved" : "Save"}
            title={saved ? "Saved" : "Save"}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gold bg-card text-white transition-all hover:bg-gold hover:border-gold"
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

// Builder-side project card. Visual twin of MatchCandidateCard so
// builders and founders see the same deck shape â€” full-width 1:1
// photo at top, then title, then pills, then optional description.
const MatchProjectCard = ({ project }: { project: PublicProject }) => {
  const avatar = getAvatarUrl(project.founderAvatarPath);
  return (
    <article className="overflow-hidden rounded-2xl border border-gold bg-card shadow-sm">
      {/* Picture square â€” full-width, 1:1 aspect, dominates the card. */}
      <div className="relative w-full aspect-square bg-gold">
        {avatar ? (
          <img
            src={avatar}
            alt={project.founderFullName}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-7xl text-gold/60">
              {initials(project.founderFullName)}
            </span>
          </div>
        )}
      </div>

      {/* Body â€” title, byline, pills, description. */}
      <div className="p-5">
        <h2 className="mb-1 font-display text-2xl leading-tight text-foreground">
          {project.title}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          by{" "}
          <span className="text-foreground">
            {project.founderFullName || "Anonymous"}
          </span>
          {project.founderHeadline ? ` Â· ${project.founderHeadline}` : null}
        </p>

        {(project.criteria.commitment ||
          project.criteria.location ||
          project.criteria.skills.length > 0) ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {project.criteria.commitment ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold bg-gold px-3 py-1 text-xs font-medium text-white">
                <Briefcase className="h-3 w-3" />
                {project.criteria.commitment}
              </span>
            ) : null}
            {project.criteria.location ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold bg-gold px-3 py-1 text-xs font-medium text-white">
                <MapPin className="h-3 w-3" />
                {project.criteria.location}
              </span>
            ) : null}
            {project.criteria.skills.slice(0, 5).map((s) => (
              <span
                key={s}
                className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
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
        className="pl-10 h-11 bg-card border-border focus-visible:border-gold focus-visible:ring-gold/20"
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
      <Select
        value={commitment || "any"}
        onValueChange={(v) => setCommitment(v === "any" ? "" : v)}
      >
        <SelectTrigger className="h-11 bg-background border-border focus:border-gold focus:ring-gold/20">
          <SelectValue placeholder="Any commitment" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="any">Any commitment</SelectItem>
          {COMMITMENT_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
  <div className="rounded-sm border border-border bg-card/40 p-12 text-center">
    <Loader2 className="h-5 w-5 text-gold animate-spin mx-auto mb-3" />
    <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
      Loading...
    </p>
  </div>
);

const Empty = ({ title, body }: { title: string; body: string }) => (
  <div className="rounded-sm border border-dashed border-border bg-card/40 p-12 text-center">
    <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-3">
      All caught up
    </p>
    <h3 className="font-display text-2xl mb-3">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-md mx-auto">{body}</p>
  </div>
);

export default Match;
