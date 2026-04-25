import { useEffect, useState } from "react";
import {
  Check,
  ExternalLink,
  Handshake,
  Inbox,
  Linkedin,
  Loader2,
  Send,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAvatarUrl,
  listApplicationsForProject,
  listMyApplications,
  updateApplicationStatus,
  withdrawApplication,
} from "@/lib/mynet-storage";
import type {
  ApplicationStatus,
  IncomingApplication,
  OutgoingApplication,
  Project,
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
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

const statusBadge = (status: ApplicationStatus) => {
  const config = {
    pending: {
      label: "Pending",
      className: "border-gold/40 bg-gold/10 text-gold",
    },
    accepted: {
      label: "Accepted",
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    },
    rejected: {
      label: "Rejected",
      className: "border-destructive/40 bg-destructive/10 text-destructive",
    },
    withdrawn: {
      label: "Withdrawn",
      className: "border-border bg-background text-muted-foreground",
    },
  }[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm border text-[10px] font-mono uppercase tracking-widest ${config.className}`}
    >
      {config.label}
    </span>
  );
};

type ApplicationsPanelProps = {
  ownedProjects: Project[];
};

export const ApplicationsPanel = ({ ownedProjects }: ApplicationsPanelProps) => {
  const [incoming, setIncoming] = useState<
    Array<{ projectId: string; projectTitle: string; apps: IncomingApplication[] }>
  >([]);
  const [outgoing, setOutgoing] = useState<OutgoingApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const [incomingResults, mine] = await Promise.all([
        Promise.all(
          ownedProjects.map(async (p) => ({
            projectId: p.id,
            projectTitle: p.title,
            apps: await listApplicationsForProject(p.id),
          })),
        ),
        listMyApplications(),
      ]);
      setIncoming(incomingResults.filter((r) => r.apps.length > 0));
      setOutgoing(mine);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownedProjects.length]);

  const handleSetStatus = async (
    appId: string,
    status: "accepted" | "rejected" | "pending",
  ) => {
    setActing(appId);
    try {
      await updateApplicationStatus(appId, status);
      await reload();
      toast.success(
        status === "accepted"
          ? "Accepted."
          : status === "rejected"
            ? "Rejected."
            : "Reset to pending.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setActing(null);
    }
  };

  const handleWithdraw = async (appId: string) => {
    setActing(appId);
    try {
      await withdrawApplication(appId);
      await reload();
      toast.success("Withdrawn.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not withdraw.");
    } finally {
      setActing(null);
    }
  };

  const totalIncoming = incoming.reduce((acc, g) => acc + g.apps.length, 0);

  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
            Applications
          </p>
          <h2 className="font-display text-2xl md:text-3xl">Inbox</h2>
        </div>

        <Tabs defaultValue="incoming">
          <TabsList className="bg-background border border-border">
            <TabsTrigger value="incoming">
              Received <span className="ml-2 text-muted-foreground">({totalIncoming})</span>
            </TabsTrigger>
            <TabsTrigger value="outgoing">
              Sent <span className="ml-2 text-muted-foreground">({outgoing.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 text-gold animate-spin" />
              </div>
            ) : totalIncoming === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No applications yet."
                body="Publish a project to start getting applicants."
              />
            ) : (
              <div className="space-y-8">
                {incoming.map((group) => (
                  <div key={group.projectId}>
                    <h3 className="font-display text-lg mb-3">
                      {group.projectTitle}{" "}
                      <span className="text-muted-foreground font-display text-base">
                        ({group.apps.length})
                      </span>
                    </h3>
                    <ul className="divide-y divide-border border border-border rounded-sm bg-background/40">
                      {group.apps.map((app) => {
                        const avatarUrl = getAvatarUrl(app.candidate.avatarPath);
                        return (
                        <li key={app.id} className="p-4 flex gap-4">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={app.candidate.fullName}
                              className="h-10 w-10 rounded-sm object-cover border border-gold/30 flex-shrink-0"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                              <span className="font-display text-xs text-gold">
                                {initials(app.candidate.fullName)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="text-sm font-medium truncate">
                                {app.candidate.fullName || "Unnamed"}
                              </h4>
                              {statusBadge(app.status)}
                              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
                                {formatDate(app.createdAt)}
                              </span>
                            </div>
                            {app.candidate.headline && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {app.candidate.headline}
                              </p>
                            )}
                            {app.message && (
                              <p className="text-sm leading-relaxed mb-2">
                                {app.message}
                              </p>
                            )}
                            {app.candidate.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {app.candidate.skills.slice(0, 6).map((s) => (
                                  <span
                                    key={s}
                                    className="px-2 py-0.5 text-[10px] rounded-sm border border-border text-muted-foreground"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              {app.candidate.linkedinUrl && (
                                <a
                                  href={app.candidate.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[11px] text-gold hover:underline"
                                >
                                  <Linkedin className="h-3 w-3" />
                                  LinkedIn
                                  <ExternalLink className="h-3 w-3 opacity-60" />
                                </a>
                              )}
                              {app.status !== "accepted" && (
                                <Button
                                  variant="gold"
                                  size="sm"
                                  onClick={() =>
                                    handleSetStatus(app.id, "accepted")
                                  }
                                  disabled={acting === app.id}
                                >
                                  <Check className="h-4 w-4" />
                                  Accept
                                </Button>
                              )}
                              {app.status !== "rejected" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleSetStatus(app.id, "rejected")
                                  }
                                  disabled={acting === app.id}
                                >
                                  <X className="h-4 w-4" />
                                  Reject
                                </Button>
                              )}
                              {app.status !== "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleSetStatus(app.id, "pending")
                                  }
                                  disabled={acting === app.id}
                                >
                                  <Undo2 className="h-4 w-4" />
                                  Reset
                                </Button>
                              )}
                            </div>
                          </div>
                        </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="outgoing" className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 text-gold animate-spin" />
              </div>
            ) : outgoing.length === 0 ? (
              <EmptyState
                icon={Send}
                title="You haven't applied yet."
                body="Browse projects on the Talent page and send a pitch."
              />
            ) : (
              <ul className="divide-y divide-border border border-border rounded-sm bg-background/40">
                {outgoing.map((app) => (
                  <li key={app.id} className="p-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-sm font-medium truncate">
                        {app.projectTitle}
                      </h4>
                      {statusBadge(app.status)}
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
                        {formatDate(app.createdAt)}
                      </span>
                    </div>
                    {app.message && (
                      <p className="text-sm leading-relaxed text-muted-foreground mb-2">
                        {app.message}
                      </p>
                    )}
                    {app.status === "accepted" &&
                      (app.founderLinkedin || app.founderFullName) && (
                        <div className="rounded-sm border border-emerald-500/30 bg-emerald-500/5 p-3 mt-2 mb-2">
                          <p className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-1.5">
                            <Handshake className="h-3 w-3" />
                            You're in. Reach out:
                          </p>
                          {app.founderFullName && (
                            <p className="text-sm">{app.founderFullName}</p>
                          )}
                          {app.founderLinkedin && (
                            <a
                              href={app.founderLinkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline mt-1"
                            >
                              <Linkedin className="h-3 w-3" />
                              {app.founderLinkedin}
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                          )}
                        </div>
                      )}
                    {app.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleWithdraw(app.id)}
                        disabled={acting === app.id}
                      >
                        Withdraw
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const EmptyState = ({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Inbox;
  title: string;
  body: string;
}) => (
  <div className="rounded-sm border border-dashed border-border bg-card/40 p-10 text-center">
    <Icon className="h-5 w-5 text-gold mx-auto mb-3" />
    <h3 className="font-display text-xl mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{body}</p>
  </div>
);
