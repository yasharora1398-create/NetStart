import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Compass,
  Loader2,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Nav } from "@/components/netstart/Nav";
import { Footer } from "@/components/netstart/Footer";
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
import { ApplyDialog } from "@/components/mynet/ApplyDialog";
import { COMMITMENT_OPTIONS, LOCATION_OPTIONS } from "@/lib/options";
import { useAuth } from "@/context/AuthContext";
import { isAiConfigured } from "@/lib/ai";
import {
  getAvatarUrl,
  listMyApplications,
  listPublishedProjects,
  matchProjectsForMe,
} from "@/lib/mynet-storage";
import type {
  ApplicationStatus,
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

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

const Talent = () => {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<
    Array<PublicProject & { similarity?: number }>
  >([]);
  const [applied, setApplied] = useState<Map<string, ApplicationStatus>>(
    new Map(),
  );
  const [loadingData, setLoadingData] = useState(false);
  const [query, setQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [commitmentFilter, setCommitmentFilter] = useState("");
  const [applyTarget, setApplyTarget] = useState<PublicProject | null>(null);
  const [aiRanked, setAiRanked] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingData(true);
    const useAi = isAiConfigured();
    setAiRanked(useAi);
    const projectLoader = useAi ? matchProjectsForMe() : listPublishedProjects();
    Promise.all([projectLoader, listMyApplications()])
      .then(([list, mine]) => {
        if (cancelled) return;
        setProjects(list);
        const map = new Map<string, ApplicationStatus>();
        for (const a of mine) map.set(a.projectId, a.status);
        setApplied(map);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isAuthed = Boolean(user) && !loading;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const skill = skillFilter.trim().toLowerCase();
    const location = locationFilter.trim().toLowerCase();
    const commitment = commitmentFilter.trim().toLowerCase();
    return projects.filter((p) => {
      if (q) {
        const haystack = `${p.title} ${p.description} ${p.criteria.skills.join(
          " ",
        )} ${p.criteria.commitment} ${p.criteria.location} ${p.criteria.keywords} ${p.founderFullName} ${p.founderHeadline}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (skill) {
        const ok = p.criteria.skills.some((s) =>
          s.toLowerCase().includes(skill),
        );
        if (!ok) return false;
      }
      if (location) {
        if (!p.criteria.location.toLowerCase().includes(location)) return false;
      }
      if (commitment) {
        if (!p.criteria.commitment.toLowerCase().includes(commitment))
          return false;
      }
      return true;
    });
  }, [projects, query, skillFilter, locationFilter, commitmentFilter]);

  const hasActiveFilters =
    Boolean(skillFilter || locationFilter || commitmentFilter || query);

  const clearFilters = () => {
    setQuery("");
    setSkillFilter("");
    setLocationFilter("");
    setCommitmentFilter("");
  };

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) for (const s of p.criteria.skills) set.add(s);
    return Array.from(set).sort();
  }, [projects]);

  const handleApplied = (projectId: string) => {
    setApplied((prev) => {
      const next = new Map(prev);
      next.set(projectId, "pending");
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main
        className={`pt-28 pb-24 ${!isAuthed ? "pointer-events-none select-none blur-sm" : ""}`}
      >
        <div className="container">
          <header className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold-soft bg-gold/5 mb-6">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">
                Talent
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl leading-[1] mb-4">
              Open projects.
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Founders looking for operators right now. Pitch yourself if it's a
              fit.
            </p>
            {aiRanked && (
              <p className="text-[11px] font-mono uppercase tracking-widest text-gold mt-3">
                AI-ranked for your profile
              </p>
            )}
          </header>

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
                value={skillFilter}
                onChange={setSkillFilter}
                options={allSkills}
                placeholder="Filter by skill"
                allowCustom
              />
              <Autocomplete
                value={locationFilter}
                onChange={setLocationFilter}
                options={LOCATION_OPTIONS}
                placeholder="Filter by location"
                allowCustom
              />
              <Select
                value={commitmentFilter || "any"}
                onValueChange={(v) =>
                  setCommitmentFilter(v === "any" ? "" : v)
                }
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
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {loadingData ? (
            <div className="rounded-sm border border-border bg-card/40 p-12 text-center">
              <Loader2 className="h-5 w-5 text-gold animate-spin mx-auto mb-3" />
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Loading projects...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border bg-card/40 p-12 text-center">
              <Compass className="h-6 w-6 text-gold mx-auto mb-3" />
              <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-3">
                {query ? "No matches" : "Be early"}
              </p>
              <h3 className="font-display text-2xl mb-3">
                {query
                  ? "No projects match that search."
                  : "No published projects yet."}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                {query
                  ? "Try fewer or different keywords."
                  : "You're early. Be the first to post your own project, then start scouting cofounders."}
              </p>
              {!query && (
                <Link to="/mynet">
                  <Button variant="gold" size="lg">
                    <ArrowRight className="h-4 w-4" />
                    Post a project
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((p) => {
                const status = applied.get(p.id);
                const isOwn = p.ownerId === user?.id;
                return (
                  <article
                    key={p.id}
                    className="rounded-sm border border-border bg-card hover:border-gold/40 transition-colors p-5 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-display text-xl sm:text-2xl leading-tight">
                        {p.title}
                      </h3>
                      {isOwn && (
                        <span className="px-2 py-1 rounded-sm border border-gold/40 bg-gold/10 text-[10px] font-mono uppercase tracking-widest text-gold flex-shrink-0">
                          Your project
                        </span>
                      )}
                    </div>

                    {(p.founderFullName || p.founderHeadline) && (
                      <Link
                        to={`/u/${p.ownerId}`}
                        className="flex items-center gap-2.5 mb-4 group"
                      >
                        {(() => {
                          const url = getAvatarUrl(p.founderAvatarPath);
                          return url ? (
                            <img
                              src={url}
                              alt={p.founderFullName}
                              className="h-8 w-8 rounded-sm object-cover border border-gold/30 flex-shrink-0"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                              <span className="font-display text-[11px] text-gold">
                                {initials(p.founderFullName)}
                              </span>
                            </div>
                          );
                        })()}
                        <div className="min-w-0">
                          <p className="text-xs truncate">
                            <span className="text-muted-foreground">by </span>
                            <span className="text-foreground group-hover:text-gold transition-colors">
                              {p.founderFullName || "Anonymous"}
                            </span>
                          </p>
                          {p.founderHeadline && (
                            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80 truncate">
                              {p.founderHeadline}
                            </p>
                          )}
                        </div>
                      </Link>
                    )}
                    {p.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                        {p.description}
                      </p>
                    )}

                    {(p.criteria.commitment || p.criteria.location) && (
                      <div className="flex flex-wrap gap-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
                        {p.criteria.commitment && (
                          <span className="inline-flex items-center gap-1.5">
                            <Briefcase className="h-3 w-3 text-gold" />
                            {p.criteria.commitment}
                          </span>
                        )}
                        {p.criteria.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-gold" />
                            {p.criteria.location}
                          </span>
                        )}
                      </div>
                    )}

                    {p.criteria.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {p.criteria.skills.slice(0, 6).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 text-[11px] rounded-sm border border-gold/30 bg-gold/5"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                        Posted {formatDate(p.createdAt)}
                      </span>
                      {isOwn ? (
                        <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                          Public listing
                        </span>
                      ) : status ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-sm border text-[11px] font-mono uppercase tracking-widest ${
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
                          size="sm"
                          onClick={() => setApplyTarget(p)}
                        >
                          Apply
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {!loading && !user && <AuthGate />}

      <Footer />

      <ApplyDialog
        project={applyTarget}
        onClose={() => setApplyTarget(null)}
        onApplied={handleApplied}
      />
    </div>
  );
};

export default Talent;
