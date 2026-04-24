import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Check,
  ExternalLink,
  FileText,
  Linkedin,
  Loader2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Nav } from "@/components/netstart/Nav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import {
  getResumeSignedUrl,
  listAllProfiles,
  reviewProfile,
  type AdminProfile,
} from "@/lib/mynet-storage";
import type { ReviewStatus } from "@/lib/mynet-types";

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

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const [rows, setRows] = useState<AdminProfile[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [openingPath, setOpeningPath] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminProfile | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!user || !isAdmin) return;
    let cancelled = false;
    setLoadingRows(true);
    listAllProfiles()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRows(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <main className="pt-28 pb-24 container">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-5 w-5 text-gold animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

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

  const applyReview = async (
    row: AdminProfile,
    status: ReviewStatus,
    reason: string | null,
  ) => {
    setWorkingId(row.userId);
    try {
      await reviewProfile(row.userId, status, reason);
      setRows((prev) =>
        prev.map((r) =>
          r.userId === row.userId
            ? {
                ...r,
                reviewStatus: status,
                reviewReason: status === "rejected" ? reason : null,
                reviewedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
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
      setWorkingId(null);
    }
  };

  const handleAccept = (row: AdminProfile) => applyReview(row, "accepted", null);

  const handleReset = (row: AdminProfile) => applyReview(row, "pending", null);

  const openReject = (row: AdminProfile) => {
    setRejectTarget(row);
    setRejectReason(row.reviewStatus === "rejected" ? row.reviewReason ?? "" : "");
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      toast.error("Give a short reason (at least 3 characters).");
      return;
    }
    await applyReview(rejectTarget, "rejected", reason);
    setRejectTarget(null);
    setRejectReason("");
  };

  const totalResumes = rows.filter((r) => r.resume).length;
  const totalLinkedIn = rows.filter((r) => r.linkedinUrl.trim() !== "").length;
  const totalPending = rows.filter((r) => r.reviewStatus === "pending").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main className="pt-28 pb-24">
        <div className="container">
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold-soft bg-gold/5 mb-6">
              <ShieldCheck className="h-3 w-3 text-gold" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">
                Admin
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl leading-[1] mb-4">
              Submissions
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Review every applicant's resume and LinkedIn. Accept to unlock their
              projects, or reject with a reason they'll see.
            </p>
          </header>

          <div className="grid sm:grid-cols-4 gap-3 mb-10">
            <StatCard label="Members" value={rows.length} icon={Users} />
            <StatCard label="Pending" value={totalPending} icon={ShieldCheck} />
            <StatCard label="Resumes" value={totalResumes} icon={FileText} />
            <StatCard label="LinkedIn" value={totalLinkedIn} icon={Linkedin} />
          </div>

          {loadingRows ? (
            <div className="rounded-sm border border-border bg-card/40 p-12 text-center">
              <Loader2 className="h-5 w-5 text-gold animate-spin mx-auto mb-3" />
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Loading submissions...
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border bg-card/40 p-12 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-3">
                Empty
              </p>
              <h3 className="font-display text-2xl">No submissions yet.</h3>
            </div>
          ) : (
            <div className="rounded-sm border border-border bg-card overflow-hidden">
              <div className="hidden md:grid grid-cols-[1.2fr_1.3fr_1.5fr_1.5fr] gap-4 px-6 py-3 border-b border-border bg-background/40">
                <ColHeader label="Member" />
                <ColHeader label="LinkedIn" />
                <ColHeader label="Resume" />
                <ColHeader label="Review" />
              </div>
              <ul className="divide-y divide-border">
                {rows.map((row) => {
                  const busy = workingId === row.userId;
                  return (
                    <li
                      key={row.userId}
                      className="grid md:grid-cols-[1.2fr_1.3fr_1.5fr_1.5fr] gap-4 px-6 py-5 items-start"
                    >
                      <div className="min-w-0 pt-1">
                        <p className="text-sm truncate">
                          {row.fullName || "Unnamed"}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground truncate">
                          {row.email || row.userId.slice(0, 8)}
                        </p>
                        <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
                          Joined {formatDate(row.createdAt)}
                        </p>
                      </div>

                      <div className="min-w-0 pt-1">
                        {row.linkedinUrl ? (
                          <a
                            href={row.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-gold hover:underline truncate max-w-full"
                          >
                            <Linkedin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{row.linkedinUrl}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                            None
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        {row.resume ? (
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-4 w-4 text-gold" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">
                                {row.resume.name}
                              </p>
                              <p className="text-[11px] font-mono text-muted-foreground">
                                {formatBytes(row.resume.size)} ·{" "}
                                {formatDate(row.resume.uploadedAt)}
                              </p>
                            </div>
                            <Button
                              variant="outlineGold"
                              size="sm"
                              onClick={() => openResume(row.resume!.path)}
                              disabled={openingPath === row.resume.path}
                            >
                              {openingPath === row.resume.path ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Open"
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                            None
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <StatusBadge status={row.reviewStatus} />
                        {row.reviewStatus === "rejected" && row.reviewReason && (
                          <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                            <span className="font-mono uppercase tracking-widest text-destructive/80">
                              Reason:
                            </span>{" "}
                            {row.reviewReason}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {row.reviewStatus !== "accepted" && (
                            <Button
                              variant="gold"
                              size="sm"
                              onClick={() => handleAccept(row)}
                              disabled={busy}
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Accept
                            </Button>
                          )}
                          {row.reviewStatus !== "rejected" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReject(row)}
                              disabled={busy}
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          )}
                          {row.reviewStatus !== "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReset(row)}
                              disabled={busy}
                            >
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
          )}
        </div>
      </main>

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject submission</DialogTitle>
            <DialogDescription>
              {rejectTarget?.fullName || rejectTarget?.email || "Member"} will see
              this reason on their MyNet page.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Be direct. What specifically is missing or insufficient?"
            rows={5}
            className="bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
              disabled={workingId === rejectTarget?.userId}
            >
              Cancel
            </Button>
            <Button
              variant="gold"
              onClick={submitReject}
              disabled={workingId === rejectTarget?.userId}
            >
              {workingId === rejectTarget?.userId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Send rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatusBadge = ({ status }: { status: ReviewStatus }) => {
  const { label, className } = {
    pending: {
      label: "Pending",
      className:
        "border-gold/40 bg-gold/10 text-gold",
    },
    accepted: {
      label: "Accepted",
      className:
        "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    },
    rejected: {
      label: "Rejected",
      className:
        "border-destructive/40 bg-destructive/10 text-destructive",
    },
  }[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-sm border text-[11px] font-mono uppercase tracking-widest ${className}`}
    >
      {label}
    </span>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) => (
  <div className="rounded-sm border border-border bg-card p-5 flex items-center gap-4">
    <div className="h-10 w-10 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-gold" />
    </div>
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-2xl">{value}</p>
    </div>
  </div>
);

const ColHeader = ({ label }: { label: string }) => (
  <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
    {label}
  </p>
);

export default Admin;
