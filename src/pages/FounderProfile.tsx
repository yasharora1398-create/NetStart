import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  ExternalLink,
  Linkedin,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Nav } from "@/components/netstart/Nav";
import { Footer } from "@/components/netstart/Footer";
import { AuthGate } from "@/components/netstart/AuthGate";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  getAvatarUrl,
  getPublicFounder,
  listPublishedProjectsForOwner,
  type PublicFounder,
} from "@/lib/mynet-storage";
import type { PublicProject } from "@/lib/mynet-types";

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

const FounderProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [founder, setFounder] = useState<PublicFounder | null>(null);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    setLoadingData(true);
    Promise.all([getPublicFounder(id), listPublishedProjectsForOwner(id)])
      .then(([f, ps]) => {
        if (cancelled) return;
        setFounder(f);
        setProjects(ps);
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
  }, [user, id]);

  const isAuthed = Boolean(user) && !loading;
  const avatarUrl = founder ? getAvatarUrl(founder.avatarPath) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main
        className={`pt-28 pb-24 ${!isAuthed ? "pointer-events-none select-none blur-sm" : ""}`}
      >
        <div className="container max-w-3xl">
          <Link
            to="/talent"
            className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Browse projects
          </Link>

          {loadingData ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-5 w-5 text-gold animate-spin" />
            </div>
          ) : !founder ? (
            <div className="rounded-sm border border-dashed border-border bg-card/40 p-12 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-3">
                Not found
              </p>
              <h2 className="font-display text-2xl">No such profile.</h2>
            </div>
          ) : (
            <>
              <header className="rounded-sm border border-gold-soft bg-gradient-to-br from-gold/5 to-transparent p-6 sm:p-8 mb-10">
                <div className="flex items-start gap-5 flex-wrap">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={founder.fullName}
                      className="h-20 w-20 sm:h-24 sm:w-24 rounded-sm object-cover border border-gold/40 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-sm bg-gold/10 border border-gold/40 flex items-center justify-center flex-shrink-0">
                      <span className="font-display text-2xl text-gold">
                        {initials(founder.fullName)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-1">
                      Profile
                    </p>
                    <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-1">
                      {founder.fullName || "Unnamed"}
                    </h1>
                    {founder.headline && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {founder.headline}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {founder.commitment && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-border bg-background font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                          <Briefcase className="h-3 w-3 text-gold" />
                          {founder.commitment}
                        </span>
                      )}
                      {founder.location && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-border bg-background font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                          <MapPin className="h-3 w-3 text-gold" />
                          {founder.location}
                        </span>
                      )}
                      {founder.isOpenToWork && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-sm border border-emerald-500/40 bg-emerald-500/10 font-mono text-[11px] text-emerald-400 uppercase tracking-widest">
                          Open to work
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {founder.bio && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
                      Pitch / Bio
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {founder.bio}
                    </p>
                  </div>
                )}

                {founder.skills.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {founder.skills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 text-[11px] rounded-sm border border-gold/30 bg-gold/5"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {founder.linkedinUrl && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <a
                      href={founder.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-gold hover:underline"
                    >
                      <Linkedin className="h-4 w-4" />
                      {founder.linkedinUrl}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </div>
                )}
              </header>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-1">
                      Building
                    </p>
                    <h2 className="font-display text-2xl sm:text-3xl">
                      Active projects{" "}
                      <span className="text-muted-foreground">
                        ({projects.length})
                      </span>
                    </h2>
                  </div>
                </div>

                {projects.length === 0 ? (
                  <div className="rounded-sm border border-dashed border-border bg-card/40 p-10 text-center">
                    <Sparkles className="h-5 w-5 text-gold mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No published projects yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {projects.map((p) => (
                      <Link
                        key={p.id}
                        to="/talent"
                        className="rounded-sm border border-border bg-card hover:border-gold/40 transition-colors p-5"
                      >
                        <h3 className="font-display text-xl leading-tight mb-2">
                          {p.title}
                        </h3>
                        {p.description && (
                          <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                            {p.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            {formatDate(p.createdAt)}
                          </span>
                          {p.criteria.skills.length > 0 && (
                            <span className="text-[10px] font-mono uppercase tracking-widest text-gold">
                              {p.criteria.skills.length} skills
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-8 flex justify-center">
                  <Link to="/talent">
                    <Button variant="outlineGold" size="lg">
                      Browse all open projects
                    </Button>
                  </Link>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {!loading && !user && <AuthGate />}

      <Footer />
    </div>
  );
};

export default FounderProfile;
