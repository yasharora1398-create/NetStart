"use client";
/**
 * Admin dashboard - gated by useAuth().isAdmin.
 *
 * Two tabs:
 *   • Overview   - visitor analytics (24h/7d/30d unique views) + line
 *                  graph of last 30 days, plus a table of all
 *                  signups with their MyNet completion status.
 *   • Review queue - pending MyNet submissions as collapsible cards.
 *                    Click a name to expand the full submitted info,
 *                    then accept or decline.
 *
 * Visitor data comes from the page_views table (0015 migration).
 * Each device gets one row per calendar day.
 */
import { useEffect, useState } from "react";
import { Link, Navigate } from "@/lib/router-compat";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  Linkedin,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import {
  getAnalytics,
  listAllSignups,
  listPendingSubmissions,
  type DailyViewPoint,
  type PendingSubmission,
  type SignupRow,
  type ViewCounts,
} from "@/lib/admin-storage";
import { getResumeSignedUrl, reviewProfile } from "@/lib/mynet-storage";
import { MothEmptyState } from "@/components/netstart/MothEmptyState";

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

const formatDayShort = (day: string): string => {
  const [y, m, d] = day.split("-");
  return `${m}/${d}`;
};

// ────────────────────────────────────────────────────────────────
// Page shell
// ────────────────────────────────────────────────────────────────

type Tab = "overview" | "review";

// Operator email gets admin access even if the profiles.is_admin
// row isn't set - covers fresh installs and ensures the nav icons
// in the Sidebar / IconRail (gated on this same email) always lead
// to a working dashboard.
const ADMIN_EMAIL = "netstartapp@outlook.com";

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      </div>
    );
  }

  const isOperator =
    (user?.email ?? "").toLowerCase() === ADMIN_EMAIL;
  if (!user || (!isAdmin && !isOperator)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/50">
        <div className="mx-auto max-w-6xl px-5 md:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1">
            <ShieldCheck className="h-3 w-3 text-primary" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary">
              Admin
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 md:px-8 pt-10 pb-24">
        <h1 className="font-display text-4xl md:text-5xl tracking-[-0.03em] mb-8">
          Admin
        </h1>

        <div className="flex items-center gap-2 border-b border-border mb-8">
          <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
            Overview
          </TabButton>
          <TabButton active={tab === "review"} onClick={() => setTab("review")}>
            Review queue
          </TabButton>
        </div>

        {tab === "overview" ? <OverviewTab /> : <ReviewTab />}
      </main>
    </div>
  );
};

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative px-4 py-3 text-sm font-medium transition-colors ${
      active
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {children}
    {active && (
      <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
    )}
  </button>
);

// ────────────────────────────────────────────────────────────────
// Overview tab
// ────────────────────────────────────────────────────────────────

const OverviewTab = () => {
  const [counts, setCounts] = useState<ViewCounts | null>(null);
  const [daily, setDaily] = useState<DailyViewPoint[]>([]);
  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Promise.allSettled so one failing query doesn't blank the whole
    // tab. Supabase errors aren't Error instances, so we read .message
    // off the rejected reason instead of relying on `instanceof Error`
    // (which silently fell back to a generic "Failed to load.").
    Promise.allSettled([getAnalytics(), listAllSignups()])
      .then(([analyticsResult, signupsResult]) => {
        if (cancelled) return;
        if (analyticsResult.status === "fulfilled") {
          setCounts(analyticsResult.value.counts);
          setDaily(analyticsResult.value.daily);
        } else {
          const r = analyticsResult.reason as { message?: string } | undefined;
          toast.error(`Analytics: ${r?.message ?? "load failed"}`);
        }
        if (signupsResult.status === "fulfilled") {
          setSignups(signupsResult.value);
        } else {
          const r = signupsResult.reason as { message?: string } | undefined;
          toast.error(`Signups: ${r?.message ?? "load failed"}`);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Last 24 hours" value={counts?.last24h ?? 0} />
        <StatCard label="Last 7 days" value={counts?.last7d ?? 0} />
        <StatCard label="Last 30 days" value={counts?.last30d ?? 0} />
      </div>

      {/* Line graph */}
      <section>
        <h2 className="font-display text-xl tracking-[-0.02em] mb-4">
          Daily unique visitors
        </h2>
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 md:p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="day"
                  tickFormatter={formatDayShort}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(label: string) => formatDate(label)}
                  formatter={(value: number) => [value, "Visitors"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Signups table */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl tracking-[-0.02em]">Signups</h2>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {signups.length} total
          </span>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden">
          {signups.length === 0 ? (
            <MothEmptyState
              variant="queue"
              title="No signups yet."
              sub="New accounts will appear here as people register."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="px-5 py-3 font-normal">Name</th>
                    <th className="px-5 py-3 font-normal">Email</th>
                    <th className="px-5 py-3 font-normal">Signed up</th>
                    <th className="px-5 py-3 font-normal">MyNet</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map((row) => (
                    <tr
                      key={row.userId}
                      className="border-b border-border/60 last:border-b-0"
                    >
                      <td className="px-5 py-3 text-foreground">
                        {row.fullName || "-"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {row.email || "-"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <MyNetBadge row={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6">
    <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
      {label}
    </p>
    <p className="font-display text-4xl tracking-[-0.02em] text-foreground">
      {value}
    </p>
  </div>
);

const MyNetBadge = ({ row }: { row: SignupRow }) => {
  if (!row.mynetSubmitted) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-border text-[11px] text-muted-foreground">
        Not started
      </span>
    );
  }
  if (row.reviewStatus === "accepted") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-[11px] text-primary">
        Accepted
      </span>
    );
  }
  if (row.reviewStatus === "rejected") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-destructive/40 bg-destructive/10 text-[11px] text-destructive">
        Rejected
      </span>
    );
  }
  // pending
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-border bg-muted/40 text-[11px] text-foreground">
      Pending review
    </span>
  );
};

// ────────────────────────────────────────────────────────────────
// Review queue tab
// ────────────────────────────────────────────────────────────────

const ReviewTab = () => {
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [openingPath, setOpeningPath] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingSubmission | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listPendingSubmissions()
      .then((data) => {
        if (!cancelled) setSubmissions(data);
      })
      .catch((err: { message?: string } | undefined) => {
        if (!cancelled) {
          // Surface the real Supabase / network error instead of the
          // old generic "Failed to load." which silently swallowed
          // RLS denials and session-expired cases.
          toast.error(`Review queue: ${err?.message ?? "load failed"}`);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const removeFromList = (userId: string) => {
    setSubmissions((prev) => prev.filter((s) => s.userId !== userId));
    if (openId === userId) setOpenId(null);
  };

  const handleAccept = async (sub: PendingSubmission) => {
    setWorkingId(sub.userId);
    try {
      await reviewProfile(sub.userId, "accepted", null);
      toast.success(`Accepted ${sub.fullName || sub.email}.`);
      removeFromList(sub.userId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept.");
    } finally {
      setWorkingId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      toast.error("Give a short reason (at least 3 characters).");
      return;
    }
    setWorkingId(rejectTarget.userId);
    try {
      await reviewProfile(rejectTarget.userId, "rejected", reason);
      toast.success(`Declined ${rejectTarget.fullName || rejectTarget.email}.`);
      removeFromList(rejectTarget.userId);
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not decline.");
    } finally {
      setWorkingId(null);
    }
  };

  const openResume = async (path: string) => {
    setOpeningPath(path);
    try {
      const url = await getResumeSignedUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open resume.");
    } finally {
      setOpeningPath(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-xl tracking-[-0.02em]">
          Pending submissions
        </h2>
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
          {submissions.length} waiting
        </span>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
          <MothEmptyState
            variant="queue"
            title="Queue is clear."
            sub="No pending submissions right now. New ones land here as people finish MyNet."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {submissions.map((sub) => {
            const open = openId === sub.userId;
            const busy = workingId === sub.userId;
            return (
              <li key={sub.userId}>
                <article className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : sub.userId)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-accent/30 transition-colors"
                  >
                    <span className="font-medium text-foreground truncate">
                      {sub.fullName || sub.email || "Unnamed submission"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {open && (
                    <div className="px-5 pb-5 pt-1 border-t border-border/60 space-y-5">
                      <DetailRow label="Email" value={sub.email || "-"} />
                      <DetailRow
                        label="Submitted"
                        value={formatDate(sub.createdAt)}
                      />

                      {sub.linkedinUrl && (
                        <DetailRow
                          label="LinkedIn"
                          value={
                            <a
                              href={sub.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-primary hover:underline"
                            >
                              <Linkedin className="h-3.5 w-3.5" />
                              {sub.linkedinUrl}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          }
                        />
                      )}

                      {sub.resume && (
                        <DetailRow
                          label="Resume"
                          value={
                            <button
                              type="button"
                              onClick={() => openResume(sub.resume!.path)}
                              disabled={openingPath === sub.resume.path}
                              className="inline-flex items-center gap-1.5 text-primary hover:underline disabled:opacity-50"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {sub.resume.name}
                              <span className="text-muted-foreground">
                                · {formatBytes(sub.resume.size)}
                              </span>
                              {openingPath === sub.resume.path ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ExternalLink className="h-3 w-3" />
                              )}
                            </button>
                          }
                        />
                      )}

                      {sub.candidate.headline && (
                        <DetailRow
                          label="Headline"
                          value={sub.candidate.headline}
                        />
                      )}
                      {sub.candidate.bio && (
                        <DetailRow
                          label="Bio"
                          value={
                            <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                              {sub.candidate.bio}
                            </p>
                          }
                        />
                      )}
                      {sub.candidate.skills.length > 0 && (
                        <DetailRow
                          label="Skills"
                          value={
                            <div className="flex flex-wrap gap-1.5">
                              {sub.candidate.skills.map((s) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 rounded-md border border-border bg-muted/40 text-xs text-foreground"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          }
                        />
                      )}
                      {sub.candidate.location && (
                        <DetailRow
                          label="Location"
                          value={sub.candidate.location}
                        />
                      )}
                      {sub.candidate.commitment && (
                        <DetailRow
                          label="Commitment"
                          value={sub.candidate.commitment}
                        />
                      )}
                      <DetailRow
                        label="Open to work"
                        value={sub.candidate.isOpenToWork ? "Yes" : "No"}
                      />

                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleAccept(sub)}
                          disabled={busy}
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectTarget(sub);
                            setRejectReason("");
                          }}
                          disabled={busy}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          Decline
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {rejectTarget && (
        <RejectDialog
          target={rejectTarget}
          reason={rejectReason}
          onReasonChange={setRejectReason}
          onCancel={() => {
            setRejectTarget(null);
            setRejectReason("");
          }}
          onSubmit={submitReject}
          submitting={workingId === rejectTarget.userId}
        />
      )}
    </div>
  );
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground pt-0.5">
      {label}
    </span>
    <div className="text-foreground min-w-0 break-words">{value}</div>
  </div>
);

const RejectDialog = ({
  target,
  reason,
  onReasonChange,
  onCancel,
  onSubmit,
  submitting,
}: {
  target: PendingSubmission;
  reason: string;
  onReasonChange: (s: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
      <h3 className="font-display text-xl tracking-[-0.02em] mb-2">
        Decline submission
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        Give {target.fullName || target.email} a short reason. They'll see it
        on their MyNet page.
      </p>
      <textarea
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        rows={4}
        placeholder="Why are you declining?"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
      />
      <div className="flex justify-end gap-3 mt-5">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Decline
        </button>
      </div>
    </div>
  </div>
);

export default Admin;
