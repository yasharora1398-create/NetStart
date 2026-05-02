import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  MessageCircle,
  Search,
  Sparkles,
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
  requestChat,
} from "@/lib/mynet-storage";
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
        // ignore — page will fall through to a friendly state
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold-soft bg-gold/5 mb-6">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">
                Match
              </span>
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
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [query, setQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [commitmentFilter, setCommitmentFilter] = useState("");
  const [decided, setDecided] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Candidate | null>(null);

  useEffect(() => {
    setLoadingData(true);
    listOpenCandidates()
      .then((list) => setCandidates(list))
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

  const decline = () => {
    if (!current) return;
    setDecided((prev) => new Set(prev).add(current.userId));
  };
  const accept = () => {
    if (!current) return;
    setDetail(current);
  };

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
        }}
        hasFilters={hasFilters}
      />

      {loadingData ? (
        <Loading />
      ) : !current ? (
        <Empty
          title="That's everyone for now."
          body={
            hasFilters
              ? "No one matches those filters. Loosen them and try again."
              : "You've worked through every looker that's open right now. Check back soon."
          }
        />
      ) : (
        <div className="max-w-[640px] mx-auto">
          <CandidateSquareCard candidate={current} />
          <div className="mt-6 flex items-center justify-center gap-4">
            <DecisionButton variant="decline" onClick={decline} />
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {filtered.length} left
            </p>
            <DecisionButton variant="accept" onClick={accept} />
          </div>
        </div>
      )}

      <CandidateDetailDialog
        candidate={detail}
        onClose={() => {
          if (detail) {
            setDecided((prev) => new Set(prev).add(detail.userId));
          }
          setDetail(null);
        }}
      />
    </>
  );
};

const CandidateSquareCard = ({ candidate }: { candidate: Candidate }) => {
  const avatar = getAvatarUrl(candidate.avatarPath);
  return (
    <article className="rounded-sm border border-border bg-card overflow-hidden grid grid-cols-1 md:grid-cols-2">
      <div className="aspect-square md:aspect-auto md:h-auto bg-gold/5 border-b md:border-b-0 md:border-r border-border relative">
        {avatar ? (
          <img
            src={avatar}
            alt={candidate.fullName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-7xl text-gold/60">
              {initials(candidate.fullName)}
            </span>
          </div>
        )}
      </div>
      <div className="p-6 md:p-8 flex flex-col">
        <h2 className="font-display text-3xl md:text-4xl leading-tight mb-2">
          {candidate.fullName || "Unnamed"}
        </h2>
        {candidate.headline && (
          <p className="text-sm text-muted-foreground mb-5">
            {candidate.headline}
          </p>
        )}
        {candidate.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {candidate.skills.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 text-xs rounded-sm border border-gold/30 bg-gold/5"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        {candidate.bio && (
          <p className="text-sm leading-relaxed text-foreground/90 line-clamp-6">
            {candidate.bio}
          </p>
        )}
        <div className="mt-auto pt-5 flex flex-wrap gap-2">
          {candidate.commitment && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-border bg-background font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <Briefcase className="h-3 w-3 text-gold" />
              {candidate.commitment}
            </span>
          )}
          {candidate.location && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-border bg-background font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <MapPin className="h-3 w-3 text-gold" />
              {candidate.location}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

const DecisionButton = ({
  variant,
  onClick,
}: {
  variant: "accept" | "decline";
  onClick: () => void;
}) => {
  const accept = variant === "accept";
  const Icon = accept ? Check : X;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={accept ? "Accept" : "Decline"}
      className={`h-16 w-16 rounded-sm border-2 flex items-center justify-center transition-all ${
        accept
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/80 hover:shadow-[0_0_22px_rgba(16,185,129,0.45)]"
          : "border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:border-destructive/80 hover:shadow-[0_0_22px_rgba(239,68,68,0.4)]"
      }`}
    >
      <Icon className="h-7 w-7" />
    </button>
  );
};

const CandidateDetailDialog = ({
  candidate,
  onClose,
}: {
  candidate: Candidate | null;
  onClose: () => void;
}) => {
  const [saved, setSaved] = useState(false);
  const [chatRequested, setChatRequested] = useState(false);
  const [working, setWorking] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  useEffect(() => {
    setSaved(false);
    setChatRequested(false);
    setResumeUrl(null);
    setResumeError(null);
    const path = candidate?.resumePath;
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
  }, [candidate?.userId, candidate?.resumePath]);

  if (!candidate) {
    return (
      <Dialog open={false} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const avatar = getAvatarUrl(candidate.avatarPath);

  const handleRequestChat = async () => {
    if (chatRequested || working) return;
    setWorking(true);
    try {
      await requestChat(candidate.userId, null);
      setChatRequested(true);
      toast.success("Chat request sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={Boolean(candidate)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-0 bg-card border-gold-soft w-[95vw] sm:w-[min(70vw,860px)] max-w-[95vw] max-h-[88vh] overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">{candidate.fullName}</DialogTitle>

        <div className="grid md:grid-cols-[260px_1fr] gap-0 flex-1 overflow-hidden">
          <div className="relative bg-gold/5 border-b md:border-b-0 md:border-r border-border min-h-[220px]">
            {avatar ? (
              <img
                src={avatar}
                alt={candidate.fullName}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-6xl text-gold/60">
                  {initials(candidate.fullName)}
                </span>
              </div>
            )}
          </div>

          <div className="overflow-y-auto p-6 md:p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
              Operator profile
            </p>
            <h2 className="font-display text-3xl md:text-4xl leading-tight mb-2">
              {candidate.fullName}
            </h2>
            {candidate.headline && (
              <p className="text-sm text-muted-foreground mb-5">
                {candidate.headline}
              </p>
            )}

            {candidate.bio && (
              <section className="mb-6">
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                  Pitch / Bio
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {candidate.bio}
                </p>
              </section>
            )}

            {candidate.skills.length > 0 && (
              <section className="mb-6">
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                  Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 text-xs rounded-sm border border-gold/30 bg-gold/5"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {candidate.linkedinUrl && (
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                    LinkedIn
                  </p>
                  <a
                    href={candidate.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-gold hover:underline break-all"
                  >
                    <Linkedin className="h-4 w-4" />
                    Profile
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </div>
              )}
              {candidate.resumeName && (
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                    Resume
                  </p>
                  {resumeUrl ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-gold hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="truncate max-w-[260px]">
                          {candidate.resumeName}
                        </span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                      <a
                        href={resumeUrl}
                        download={candidate.resumeName}
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 text-gold" />
                      <span className="truncate">{candidate.resumeName}</span>
                      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70">
                        {resumeError ? "· not accessible" : "· loading..."}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="border-t border-border bg-background/40 px-6 md:px-8 py-4 flex items-center gap-2 flex-wrap">
          <Button
            variant="outlineGold"
            size="lg"
            onClick={() => setSaved((s) => !s)}
            className="flex-1 min-w-[160px]"
          >
            {saved ? (
              <>
                <BookmarkCheck className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                Save for later
              </>
            )}
          </Button>
          <Button
            variant="gold"
            size="lg"
            onClick={handleRequestChat}
            disabled={chatRequested || working}
            className="flex-1 min-w-[170px]"
          >
            {chatRequested ? (
              <>
                <Check className="h-4 w-4" />
                Chat requested
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" />
                {working ? "Sending..." : "Request to chat"}
              </>
            )}
          </Button>
          <Button variant="ghost" size="lg" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
        <Empty
          title="No projects right now."
          body={
            hasFilters
              ? "No projects match those filters. Try fewer keywords."
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
