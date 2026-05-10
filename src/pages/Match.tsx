import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApplyDialog } from "@/components/mynet/ApplyDialog";
import { MothEmptyState } from "@/components/netstart/MothEmptyState";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { COMMITMENT_OPTIONS, LOCATION_OPTIONS } from "@/lib/options";
import {
  getAvatarUrl,
  getProfile,
  getResumeSignedUrl,
  listMyApplications,
  listOpenCandidates,
  listProjects,
  listPublishedProjects,
  requestOrSendChatMessage,
  setPersonStatus,
} from "@/lib/mynet-storage";
import { addSavedProject, removeSavedProject, useIsProjectSaved } from "@/lib/savedProjects";
import type {
  ApplicationStatus,
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
  // Builder if they have at least one project, otherwise a looker.
  const userMode: "builder" | "looker" = hasProjects ? "builder" : "looker";

  const Locked = (
    <div className="rounded-sm border border-gold-soft bg-card p-12 text-center max-w-2xl mx-auto">
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

  return (
    <AppLayout blurred={!isAuthed}>
        <div className="container">
          <header className="mb-10">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold-soft bg-gold/5">
                <Sparkles className="h-3 w-3 text-gold" />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">
                  Match
                </span>
              </div>
              {/* Search shortcut to the filterable browse view (Talents).
                  Mirrors the magnifying-glass affordance on mobile. */}
              {userMode === "looker" ? (
                <Link
                  to="/talent"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border hover:border-gold/60 text-muted-foreground hover:text-gold transition-colors"
                  aria-label="Browse all projects"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-mono uppercase tracking-widest">
                    Browse all
                  </span>
                </Link>
              ) : null}
            </div>
            <h1 className="font-display text-4xl md:text-6xl leading-[1] mb-4">
              {userMode === "builder"
                ? "Find your operator."
                : "Find a project."}
            </h1>
            <p className="text-muted-foreground max-w-xl">
              {userMode === "builder"
                ? "Vetted operators, one at a time. Accept the ones you want to talk to and pass the rest."
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

const BuilderView = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [query, setQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [commitmentFilter, setCommitmentFilter] = useState("");
  const [decided, setDecided] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Candidate | null>(null);
  // Founder's active/first project — drives where Save lands plus
  // the "Matching for [project]" banner. Title kept alongside the
  // id so we can show it without a second fetch.
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectTitle, setActiveProjectTitle] = useState<string | null>(
    null,
  );
  const [hasMultipleProjects, setHasMultipleProjects] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    listOpenCandidates()
      .then((list) => setCandidates(list))
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to load."),
      )
      .finally(() => setLoadingData(false));
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-gold/30 bg-gold/5 px-4 py-3">
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
              : "You've worked through every looker that's open right now. New ones will land here as they sign up."
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
                className="inline-flex items-center gap-1.5 rounded-sm border border-gold/40 bg-gold/5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-gold hover:bg-gold/10 hover:border-gold/70 transition-colors"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Undo
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? "Exit full-screen" : "Full-screen"}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold transition-colors"
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

          {/* Deck stage — single flex row, justify-center. The card
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
            {/* X button — collapses out of the flex layout when the
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

            {/* The card itself — fixed width, never shifts on its
                own. Justify-center on the parent does the visual
                slide as the action column grows on the right. */}
            <div className="w-full max-w-[520px] flex-shrink-0">
              <MatchCandidateCard candidate={current} />
            </div>

            {/* ✓ button — same collapse trick on the other side. */}
            <button
              type="button"
              onClick={accept}
              aria-label="Approve"
              disabled={Boolean(approving)}
              className={cn(
                "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-gold/60 bg-card text-gold shadow-sm hover:bg-gold/10 transition-all duration-500",
                approving &&
                  "opacity-0 pointer-events-none scale-75 -ml-[80px]",
              )}
            >
              <Check className="h-6 w-6" strokeWidth={2.4} />
            </button>

            {/* Action column — only the LinkedIn / resume / save /
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
    <article className="overflow-hidden rounded-2xl border border-gold-soft bg-card shadow-sm">
      {/* Picture square — full-width, 1:1 aspect, dominates the card. */}
      <div className="relative w-full aspect-square bg-gold/5">
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

      {/* Body — name, pills, bio. */}
      <div className="p-5">
        <h2 className="mb-2 font-display text-2xl leading-tight text-foreground">
          {candidate.fullName || "Unnamed"}
        </h2>

        {(candidate.commitment ||
          candidate.location ||
          candidate.skills.length > 0) ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {candidate.commitment ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
                <Sparkles className="h-3 w-3" />
                {candidate.commitment}
              </span>
            ) : null}
            {candidate.location ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
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
// box — the buttons themselves stand free next to the card.
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
    if (!activeProjectId) {
      setSaved((s) => !s);
      toast.message("No active project", {
        description: "Pick one in MyNet so saves attach to a project.",
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
          className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-card text-gold shadow-sm transition-all hover:bg-gold/10 hover:border-gold/70 hover:shadow-md"
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
          className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-card text-gold shadow-sm transition-all hover:bg-gold/10 hover:border-gold/70 hover:shadow-md"
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
        className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-card text-gold shadow-sm transition-all hover:bg-gold/10 hover:border-gold/70 hover:shadow-md disabled:opacity-50"
      >
        {saved ? (
          <BookmarkCheck className="h-6 w-6 fill-current" />
        ) : (
          <Bookmark className="h-6 w-6" />
        )}
      </button>

      {/* Message — primary action */}
      <button
        type="button"
        onClick={handleMessage}
        disabled={working}
        aria-label="Message"
        title="Message"
        className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/60 bg-gold text-gold-foreground shadow-sm transition-all hover:bg-gold/90 hover:shadow-md disabled:opacity-50"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Back / dismiss */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Back to deck"
        title="Back"
        className="mt-1 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

// ============= Looker view: arrows through builders ==================

const LookerView = () => {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [applied, setApplied] = useState<Map<string, ApplicationStatus>>(
    new Map(),
  );
  const [loadingData, setLoadingData] = useState(false);
  const [query, setQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [commitmentFilter, setCommitmentFilter] = useState("");
  const [index, setIndex] = useState(0);
  const [applyTarget, setApplyTarget] = useState<PublicProject | null>(null);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([listPublishedProjects(), listMyApplications()])
      .then(([list, mine]) => {
        setProjects(list);
        const map = new Map<string, ApplicationStatus>();
        for (const a of mine) map.set(a.projectId, a.status);
        setApplied(map);
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to load."),
      )
      .finally(() => setLoadingData(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const skill = skillFilter.trim().toLowerCase();
    const loc = locationFilter.trim().toLowerCase();
    const com = commitmentFilter.trim().toLowerCase();
    return projects.filter((p) => {
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
  }, [projects, query, skillFilter, locationFilter, commitmentFilter]);

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) for (const s of p.criteria.skills) set.add(s);
    return Array.from(set).sort();
  }, [projects]);

  const hasFilters = Boolean(
    query || skillFilter || locationFilter || commitmentFilter,
  );

  // Reset index when filtered list shrinks past it.
  const safeIndex = filtered.length === 0 ? 0 : Math.min(index, filtered.length - 1);
  const current = filtered[safeIndex] ?? null;

  const prev = () => setIndex((i) => (filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length));
  const next = () => setIndex((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length));

  const status = current ? applied.get(current.id) : undefined;

  return (
    <>
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
          setIndex(0);
        }}
        hasFilters={hasFilters}
      />

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
        <div className="max-w-[640px] mx-auto">
          <ProjectSquareCard project={current} />
          <div className="mt-6 flex items-center justify-center gap-4">
            <ArrowButton direction="prev" onClick={prev} />
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {safeIndex + 1} / {filtered.length}
            </p>
            <ArrowButton direction="next" onClick={next} />
          </div>
          <div className="mt-6 flex justify-center">
            {status ? (
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-sm border text-[11px] font-mono uppercase tracking-widest ${
                  status === "accepted"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : status === "rejected"
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : status === "withdrawn"
                        ? "border-border bg-background text-muted-foreground"
                        : "border-gold/40 bg-gold/10 text-gold"
                }`}
              >
                {status === "pending"
                  ? "Applied"
                  : status === "accepted"
                    ? "Accepted"
                    : status === "rejected"
                      ? "Rejected"
                      : "Withdrawn"}
              </span>
            ) : (
              <Button
                variant="gold"
                size="xl"
                onClick={() => setApplyTarget(current)}
              >
                Application
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <ApplyDialog
        project={applyTarget}
        onClose={() => setApplyTarget(null)}
        onApplied={(projectId) => {
          setApplied((prev) => {
            const next = new Map(prev);
            next.set(projectId, "pending");
            return next;
          });
        }}
      />
    </>
  );
};

const ProjectSquareCard = ({ project }: { project: PublicProject }) => {
  const avatar = getAvatarUrl(project.founderAvatarPath);
  return (
    <article className="rounded-sm border border-border bg-card overflow-hidden grid grid-cols-1 md:grid-cols-2">
      <div className="aspect-square md:aspect-auto md:h-auto bg-gold/5 border-b md:border-b-0 md:border-r border-border relative">
        {avatar ? (
          <img
            src={avatar}
            alt={project.founderFullName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-7xl text-gold/60">
              {initials(project.founderFullName)}
            </span>
          </div>
        )}
      </div>
      <div className="p-6 md:p-8 flex flex-col">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
          Project
        </p>
        <h2 className="font-display text-3xl md:text-4xl leading-tight mb-2">
          {project.title}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          by{" "}
          <span className="text-foreground">
            {project.founderFullName || "Anonymous"}
          </span>
          {project.founderHeadline && ` · ${project.founderHeadline}`}
        </p>
        {project.criteria.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {project.criteria.skills.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 text-xs rounded-sm border border-gold/30 bg-gold/5"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        {project.description && (
          <p className="text-sm leading-relaxed text-foreground/90 line-clamp-6">
            {project.description}
          </p>
        )}
        <div className="mt-auto pt-5 flex flex-wrap gap-2">
          {project.criteria.commitment && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-border bg-background font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <Briefcase className="h-3 w-3 text-gold" />
              {project.criteria.commitment}
            </span>
          )}
          {project.criteria.location && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-border bg-background font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <MapPin className="h-3 w-3 text-gold" />
              {project.criteria.location}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

const ArrowButton = ({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) => {
  const Icon = direction === "next" ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "next" ? "Next" : "Previous"}
      className="h-16 w-16 rounded-sm border-2 border-gold/40 bg-gold/5 text-gold hover:bg-gold/15 hover:border-gold/70 hover:shadow-[0_0_22px_rgba(234,179,8,0.35)] transition-all flex items-center justify-center"
    >
      <Icon className="h-7 w-7" />
    </button>
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
        className="pl-10 h-11 bg-card border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
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
        <SelectTrigger className="h-11 bg-background border-border focus:border-gold/60 focus:ring-gold/20">
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
