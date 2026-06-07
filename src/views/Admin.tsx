"use client";
/**
 * Admin dashboard - gated by useAuth().isAdmin.
 *
 * Two tabs:
 * • Overview - visitor analytics (24h/7d/30d unique views) + line
 * graph of last 30 days, plus a table of all
 * signups with their Profile completion status.
 * • Review queue - pending Profile submissions as collapsible cards.
 * Click a name to expand the full submitted info,
 * then accept or decline.
 *
 * Visitor data comes from the page_views table (0015 migration).
 * Each device gets one row per calendar day.
 */
import { useEffect, useState } from "react";
import { Link, Navigate } from "@/lib/router-compat";
import { BackButton } from "@/components/netstart/BackButton";
import {
 ArrowLeft,
 Camera,
 Check,
 ChevronDown,
 ExternalLink,
 FileText,
 Linkedin,
 Loader2,
 ShieldCheck,
 Trash2,
 User,
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
import {
 createPolln8RecommendedProject,
 deleteProject,
 getAvatarUrl,
 getResumeSignedUrl,
 listProjects,
 removePolln8RecommendationAvatar,
 reviewProfile,
 setProjectPublished,
 updatePolln8RecommendedProject,
 updateProject,
 uploadPolln8RecommendationAvatar,
} from "@/lib/mynet-storage";
import type { Project } from "@/lib/mynet-types";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { emptyCriteria } from "@/lib/mynet-types";
import { Autocomplete } from "@/components/ui/autocomplete";
import { TagInput } from "@/components/mynet/TagInput";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
 BUSINESS_TYPE_OPTIONS,
 COMMITMENT_OPTIONS,
 LOCATION_OPTIONS,
 SKILLS_OPTIONS,
} from "@/lib/options";
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

type Tab = "overview" | "review" | "recommend" | "myposts";

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
 <header className="sticky top-0 z-30 bg-background border-b border-border">
 <div className="mx-auto max-w-6xl px-5 md:px-8 h-16 flex items-center justify-between">
 <Link
 to="/"
 className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
 >
 <ArrowLeft className="h-4 w-4" />
 Back to home
 </Link>
 <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
 <ShieldCheck className="h-3 w-3 text-primary" />
 <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary">
 Admin
 </span>
 </div>
 </div>
 </header>

 <main className="mx-auto max-w-6xl px-5 md:px-8 pt-10 pb-24">
 <BackButton to="/app/profile" label="Back to profile" />
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
 <TabButton active={tab === "recommend"} onClick={() => setTab("recommend")}>
 Recommend a startup
 </TabButton>
 <TabButton active={tab === "myposts"} onClick={() => setTab("myposts")}>
 My posts
 </TabButton>
 </div>

 {tab === "overview" ? (
 <OverviewTab />
 ) : tab === "review" ? (
 <ReviewTab />
 ) : tab === "recommend" ? (
 <RecommendTab />
 ) : (
 <MyPostsTab adminUserId={user.id} />
 )}
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
 <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
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
 <div className="rounded-2xl border border-border bg-card overflow-hidden">
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
 <th className="px-5 py-3 font-normal">Profile</th>
 </tr>
 </thead>
 <tbody>
 {signups.map((row) => (
 <tr
 key={row.userId}
 className="border-b border-border last:border-b-0"
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
 <ProfileBadge row={row} />
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
 <div className="rounded-2xl border border-border bg-card p-6">
 <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
 {label}
 </p>
 <p className="font-display text-4xl tracking-[-0.02em] text-foreground">
 {value}
 </p>
 </div>
);

const ProfileBadge = ({ row }: { row: SignupRow }) => {
 if (!row.mynetSubmitted) {
 return (
 <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-border text-[11px] text-muted-foreground">
 Not started
 </span>
 );
 }
 if (row.reviewStatus === "accepted") {
 return (
 <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-primary bg-primary text-[11px] text-primary-foreground">
 Accepted
 </span>
 );
 }
 if (row.reviewStatus === "rejected") {
 return (
 <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-destructive bg-destructive text-[11px] text-destructive">
 Rejected
 </span>
 );
 }
 // pending
 return (
 <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-border bg-muted text-[11px] text-foreground">
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
 <div className="rounded-2xl border border-border bg-card ">
 <MothEmptyState
 variant="queue"
 title="Queue is clear."
 sub="No pending submissions right now. New ones land here as people finish Profile."
 />
 </div>
 ) : (
 <ul className="space-y-3">
 {submissions.map((sub) => {
 const open = openId === sub.userId;
 const busy = workingId === sub.userId;
 return (
 <li key={sub.userId}>
 <article className="rounded-2xl border border-border bg-card overflow-hidden">
 <button
 type="button"
 onClick={() => setOpenId(open ? null : sub.userId)}
 className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-accent transition-colors"
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
 <div className="px-5 pb-5 pt-1 border-t border-border space-y-5">
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
 className="inline-flex items-center gap-1.5 text-primary hover:underline"
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
 className="px-2 py-0.5 rounded-md border border-border bg-muted text-xs text-foreground"
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
 className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:"
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
 className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-destructive hover:text-destructive"
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
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
 <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
 <h3 className="font-display text-xl tracking-[-0.02em] mb-2">
 Decline submission
 </h3>
 <p className="text-sm text-muted-foreground mb-5">
 Give {target.fullName || target.email} a short reason. They'll see it
 on their Profile page.
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
 className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:"
 >
 {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
 Decline
 </button>
 </div>
 </div>
 </div>
);

// ────────────────────────────────────────────────────────────────
// Recommend a startup tab - admin-only post-on-behalf-of form. The
// created project is owned by the admin's user_id but renders in the
// partner-side Match deck under the supplied founder name + a green
// outline + a 'Recommended by Polln8' badge. Website URL renders
// big and clickable above the card.
// ────────────────────────────────────────────────────────────────

const RecommendTab = () => {
 const [founderName, setFounderName] = useState("");
 const [founderHeadline, setFounderHeadline] = useState("");
 const [founderWebsite, setFounderWebsite] = useState("");
 const [pendingFile, setPendingFile] = useState<File | null>(null);
 const [pendingPreview, setPendingPreview] = useState<string | null>(null);
 const [title, setTitle] = useState("");
 const [description, setDescription] = useState("");
 const [businessType, setBusinessType] = useState("");
 const [skills, setSkills] = useState<string[]>([]);
 const [commitment, setCommitment] = useState("");
 const [location, setLocation] = useState("");
 const [locationEnabled, setLocationEnabled] = useState(false);
 const [keywords, setKeywords] = useState("");
 const [submitting, setSubmitting] = useState(false);

 const reset = () => {
 setFounderName("");
 setFounderHeadline("");
 setFounderWebsite("");
 setPendingFile(null);
 setPendingPreview(null);
 setTitle("");
 setDescription("");
 setBusinessType("");
 setSkills([]);
 setCommitment("");
 setLocation("");
 setLocationEnabled(false);
 setKeywords("");
 };

 const valid =
 founderName.trim() !== "" &&
 title.trim().length >= 2 &&
 description.trim() !== "" &&
 skills.length >= 1 &&
 commitment.trim() !== "";

 const submit = async () => {
 if (!valid || submitting) return;
 setSubmitting(true);
 try {
 const newId = await createPolln8RecommendedProject({
 title,
 description,
 criteria: {
 ...emptyCriteria(),
 skills,
 commitment: commitment.trim(),
 location: locationEnabled ? location.trim() : "",
 keywords: keywords.trim(),
 },
 businessType,
 founderName,
 founderHeadline,
 founderWebsite,
 });
 // If the admin picked a logo, upload it now that the row has an
 // id. We let upload errors throw so the user sees the real
 // reason in a toast (most often: migration 0036 not run yet).
 if (pendingFile) {
 await uploadPolln8RecommendationAvatar(newId, pendingFile, null);
 }
 toast.success("Recommendation posted. It's live in the deck.");
 reset();
 } catch (err) {
 toast.error(
 err instanceof Error
 ? err.message
 : "Could not post recommendation.",
 );
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="max-w-2xl space-y-8">
 <div>
 <h2 className="font-display text-2xl mb-2">Recommend a startup</h2>
 <p className="text-sm text-muted-foreground leading-relaxed">
 Posts a card in the partner-side Match deck under the founder
 name you choose. The card shows a green outline and a
 'Recommended by Polln8' badge so partners know it's a
 curated pick. The founder's website (optional) renders big +
 clickable above the card.
 </p>
 </div>

 <section className="space-y-5">
 <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
 Who is it from?
 </h3>
 <Field label="Founder name" required>
 <Input
 value={founderName}
 onChange={(e) => setFounderName(e.target.value)}
 placeholder="e.g. Owen Carter"
 className="h-11 bg-background border-border focus-visible:border-primary"
 />
 </Field>
 <Field label="Founder headline (optional)">
 <Input
 value={founderHeadline}
 onChange={(e) => setFounderHeadline(e.target.value)}
 placeholder="e.g. Ex-payments lead, building fintech infra"
 className="h-11 bg-background border-border focus-visible:border-primary"
 />
 </Field>
 <Field label="Founder website (optional)">
 <Input
 type="url"
 value={founderWebsite}
 onChange={(e) => setFounderWebsite(e.target.value)}
 placeholder="https://example.com"
 className="h-11 bg-background border-border focus-visible:border-primary"
 />
 <p className="text-[11px] text-muted-foreground mt-2">
 Shown big + clickable above the card on the partner Match
 deck.
 </p>
 </Field>
 <LogoField
 label="Founder photo / logo (optional)"
 previewUrl={pendingPreview}
 onPick={(file, dataUrl) => {
 setPendingFile(file);
 setPendingPreview(dataUrl);
 }}
 onRemove={() => {
 setPendingFile(null);
 setPendingPreview(null);
 }}
 />
 </section>

 <section className="space-y-5 border-t border-border pt-8">
 <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
 The startup
 </h3>
 <Field label="Project title" required>
 <Input
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="e.g. Ledger Rails"
 className="h-11 bg-background border-border focus-visible:border-primary"
 />
 </Field>
 <Field label="What they're building" required>
 <Textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 rows={3}
 placeholder="One or two sentences. Stage, market, what's shipped."
 className="bg-background border-border focus-visible:border-primary"
 />
 </Field>
 <Field label="Business type">
 <Autocomplete
 value={businessType}
 onChange={setBusinessType}
 options={BUSINESS_TYPE_OPTIONS}
 placeholder="SaaS, Marketplace, Hardware..."
 />
 </Field>
 <Field label="Skills they need" required>
 <TagInput
 value={skills}
 onChange={setSkills}
 options={SKILLS_OPTIONS}
 placeholder="Type to filter, click to add..."
 />
 </Field>
 <Field label="Commitment" required>
 <Autocomplete
 value={commitment}
 onChange={setCommitment}
 options={COMMITMENT_OPTIONS}
 placeholder="Full-time, equity-only..."
 />
 </Field>
 <div>
 <div className="flex items-center justify-between mb-2 gap-3">
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 Location
 </Label>
 <div className="flex items-center gap-2">
 <span
 className={`text-[11px] font-mono uppercase tracking-[0.18em] ${
 locationEnabled ? "text-primary" : "text-muted-foreground"
 }`}
 >
 {locationEnabled ? "On" : "Off"}
 </span>
 <button
 type="button"
 onClick={() => {
 const next = !locationEnabled;
 setLocationEnabled(next);
 if (!next) setLocation("");
 }}
 aria-label="Toggle location"
 className={`h-6 w-11 rounded-full border transition-colors ${
 locationEnabled
 ? "bg-primary border-primary"
 : "bg-muted border-border"
 }`}
 >
 <span
 className={`block h-4 w-4 rounded-full bg-white transition-transform ${
 locationEnabled ? "translate-x-6" : "translate-x-1"
 }`}
 />
 </button>
 </div>
 </div>
 {locationEnabled ? (
 <Autocomplete
 value={location}
 onChange={setLocation}
 options={LOCATION_OPTIONS}
 placeholder="Pick a country..."
 />
 ) : (
 <div className="h-11 rounded-sm border border-dashed border-border bg-background px-3 flex items-center text-[12px] text-muted-foreground">
 Location off - turn on to pick a country.
 </div>
 )}
 <p className="text-[11px] text-muted-foreground mt-2">
 Adding a location is beneficial but not required.
 </p>
 </div>
 <Field label="Keywords (optional)">
 <Input
 value={keywords}
 onChange={(e) => setKeywords(e.target.value)}
 placeholder="payments, fintech, ex-Stripe"
 className="h-11 bg-background border-border focus-visible:border-primary"
 />
 </Field>
 </section>

 <div className="border-t border-border pt-6 flex items-center justify-end gap-3">
 <button
 type="button"
 onClick={reset}
 disabled={submitting}
 className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
 >
 Clear
 </button>
 <button
 type="button"
 onClick={() => void submit()}
 disabled={!valid || submitting}
 className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
 >
 {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
 Post recommendation
 </button>
 </div>
 </div>
 );
};

const Field = ({
 label,
 required,
 children,
}: {
 label: string;
 required?: boolean;
 children: React.ReactNode;
}) => (
 <div>
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
 {label}
 {required && <span className="text-primary">*</span>}
 </Label>
 {children}
 </div>
);

// Photo picker for the founder logo on Polln8 recommendations.
// Shows the existing/preview image (or a silhouette fallback) +
// an upload button. Reads the picked file as a data URL so the
// preview swaps in immediately; the actual storage upload happens
// later when the caller submits the form.
const AVATAR_MAX_MB = 2;
const LogoField = ({
 label,
 previewUrl,
 onPick,
 onRemove,
}: {
 label: string;
 previewUrl: string | null;
 onPick: (file: File, dataUrl: string) => void;
 onRemove: () => void;
}) => {
 const [inputKey, setInputKey] = useState(0);

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
 toast.error(`Photo too large. Max ${AVATAR_MAX_MB} MB.`);
 setInputKey((k) => k + 1);
 return;
 }
 const reader = new FileReader();
 reader.onload = () => {
 const dataUrl = typeof reader.result === "string" ? reader.result : "";
 onPick(file, dataUrl);
 setInputKey((k) => k + 1);
 };
 reader.readAsDataURL(file);
 };

 return (
 <div>
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
 {label}
 </Label>
 <div className="flex items-center gap-4">
 <div className="h-20 w-20 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
 {previewUrl ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={previewUrl}
 alt=""
 className="h-full w-full object-cover"
 />
 ) : (
 <User
 strokeWidth={1.4}
 className="h-10 w-10 text-muted-foreground"
 />
 )}
 </div>
 <div className="flex items-center gap-2">
 <label className="inline-flex items-center gap-2 rounded-full border border-primary bg-card px-4 py-1.5 text-xs font-medium text-primary cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground">
 <Camera className="h-3.5 w-3.5" />
 {previewUrl ? "Change photo" : "Upload photo"}
 <input
 key={inputKey}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={handleChange}
 />
 </label>
 {previewUrl ? (
 <button
 type="button"
 onClick={onRemove}
 className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
 >
 <Trash2 className="h-3.5 w-3.5" />
 Remove
 </button>
 ) : null}
 </div>
 </div>
 <p className="text-[11px] text-muted-foreground mt-2">
 Square works best. Max {AVATAR_MAX_MB} MB. Replaces the silhouette
 fallback on the partner Match card.
 </p>
 </div>
 );
};

// ────────────────────────────────────────────────────────────────
// My posts tab - admin sees every project owned by their account
// (their own + every Polln8-recommended post they made) and can
// publish / unpublish / delete each one.
// ────────────────────────────────────────────────────────────────

const MyPostsTab = ({ adminUserId }: { adminUserId: string }) => {
 const [items, setItems] = useState<Project[] | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [busy, setBusy] = useState<string | null>(null);
 const [editing, setEditing] = useState<Project | null>(null);

 const load = () => {
 setError(null);
 // Admin tab shows everything the admin owns - own projects AND
 // Polln8-recommended posts they made on behalf of others - so they
 // can edit / publish / delete each one.
 listProjects(adminUserId, { includeRecommendations: true })
 .then((rows) => setItems(rows))
 .catch((err: unknown) => {
 setError(err instanceof Error ? err.message : "Could not load posts.");
 setItems([]);
 });
 };

 useEffect(() => {
 load();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [adminUserId]);

 const togglePublished = async (project: Project) => {
 setBusy(project.id);
 try {
 await setProjectPublished(project.id, !project.isPublished);
 toast.success(project.isPublished ? "Hidden from deck." : "Live on deck.");
 load();
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Could not update.");
 } finally {
 setBusy(null);
 }
 };

 const remove = async (project: Project) => {
 if (
 !window.confirm(
 `Delete "${project.title}"? This wipes the post and all saved / passed records attached to it. Cannot be undone.`,
 )
 ) {
 return;
 }
 setBusy(project.id);
 try {
 await deleteProject(project.id);
 toast.success("Post deleted.");
 load();
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Could not delete.");
 } finally {
 setBusy(null);
 }
 };

 if (items === null) {
 return (
 <div className="flex items-center justify-center py-24">
 <Loader2 className="h-5 w-5 text-primary animate-spin" />
 </div>
 );
 }

 if (error) {
 return (
 <div className="rounded-sm border border-destructive bg-card p-6">
 <p className="text-sm text-destructive mb-3">{error}</p>
 <button
 type="button"
 onClick={load}
 className="text-sm font-medium text-primary hover:underline"
 >
 Try again
 </button>
 </div>
 );
 }

 if (items.length === 0) {
 return (
 <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
 <p className="text-sm text-muted-foreground">
 You haven&apos;t posted anything yet. Open the &quot;Recommend a
 startup&quot; tab to post one.
 </p>
 </div>
 );
 }

 return (
 <div className="space-y-4">
 <div className="flex items-center justify-between mb-2">
 <p className="text-sm text-muted-foreground">
 {items.length} {items.length === 1 ? "post" : "posts"} owned by
 your admin account.
 </p>
 <button
 type="button"
 onClick={load}
 className="text-sm font-medium text-primary hover:underline"
 >
 Refresh
 </button>
 </div>
 {items.map((project) => (
 <article
 key={project.id}
 className="rounded-sm border border-border bg-card p-5"
 >
 <div className="flex items-start justify-between gap-4 mb-3">
 <div className="min-w-0">
 <div className="flex items-center gap-2 mb-1 flex-wrap">
 <h3 className="font-display text-lg leading-tight">
 {project.title}
 </h3>
 {project.isPolln8Recommended ? (
 <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
 Recommended by Polln8
 </span>
 ) : null}
 {project.isPublished ? (
 <span className="rounded-full border border-primary bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
 Live
 </span>
 ) : (
 <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
 Hidden
 </span>
 )}
 </div>
 {project.description ? (
 <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
 {project.description}
 </p>
 ) : null}
 </div>
 </div>
 <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
 <button
 type="button"
 onClick={() => setEditing(project)}
 disabled={busy === project.id}
 className="inline-flex items-center gap-2 rounded-full border border-primary bg-card px-4 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
 >
 Edit
 </button>
 <button
 type="button"
 onClick={() => void togglePublished(project)}
 disabled={busy === project.id}
 className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
 >
 {busy === project.id && (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 )}
 {project.isPublished ? "Unpublish" : "Publish"}
 </button>
 <button
 type="button"
 onClick={() => void remove(project)}
 disabled={busy === project.id}
 className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-1.5 text-xs font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
 >
 {busy === project.id && (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 )}
 Delete
 </button>
 </div>
 </article>
 ))}
 <EditPostDialog
 project={editing}
 onClose={() => setEditing(null)}
 onSaved={() => {
 setEditing(null);
 load();
 }}
 />
 </div>
 );
};

// Edit modal for an admin-owned post. Reuses every field the
// RecommendTab form has so the same shape can edit a curated post
// or a plain admin project. The polln8_* fields are skipped on save
// for non-recommended posts.
const EditPostDialog = ({
 project,
 onClose,
 onSaved,
}: {
 project: Project | null;
 onClose: () => void;
 onSaved: () => void;
}) => {
 const [founderName, setFounderName] = useState("");
 const [founderHeadline, setFounderHeadline] = useState("");
 const [founderWebsite, setFounderWebsite] = useState("");
 const [existingPhotoPath, setExistingPhotoPath] = useState<string>("");
 const [pendingFile, setPendingFile] = useState<File | null>(null);
 const [pendingPreview, setPendingPreview] = useState<string | null>(null);
 // True when the user clicked Remove on the existing photo - on save
 // we wipe the storage object + clear the row column.
 const [photoRemoved, setPhotoRemoved] = useState(false);
 const [title, setTitle] = useState("");
 const [description, setDescription] = useState("");
 const [businessType, setBusinessType] = useState("");
 const [skills, setSkills] = useState<string[]>([]);
 const [commitment, setCommitment] = useState("");
 const [location, setLocation] = useState("");
 const [locationEnabled, setLocationEnabled] = useState(false);
 const [keywords, setKeywords] = useState("");
 const [submitting, setSubmitting] = useState(false);

 // Re-seed the form whenever a new project lands in the dialog.
 useEffect(() => {
 if (!project) return;
 setFounderName(project.polln8FounderName);
 setFounderHeadline(project.polln8FounderHeadline);
 setFounderWebsite(project.polln8FounderWebsite);
 setExistingPhotoPath(project.polln8FounderAvatarPath);
 setPendingFile(null);
 setPendingPreview(null);
 setPhotoRemoved(false);
 setTitle(project.title);
 setDescription(project.description);
 setBusinessType(project.businessType);
 setSkills(project.criteria.skills);
 setCommitment(project.criteria.commitment);
 setLocation(project.criteria.location);
 setLocationEnabled(Boolean(project.criteria.location?.trim()));
 setKeywords(project.criteria.keywords);
 }, [project]);

 if (!project) return null;
 const recommended = project.isPolln8Recommended;

 const valid =
 title.trim().length >= 2 &&
 description.trim() !== "" &&
 skills.length >= 1 &&
 commitment.trim() !== "" &&
 (!recommended || founderName.trim() !== "");

 const submit = async () => {
 if (!valid || submitting) return;
 setSubmitting(true);
 try {
 const criteria = {
 ...emptyCriteria(),
 skills,
 commitment: commitment.trim(),
 location: locationEnabled ? location.trim() : "",
 keywords: keywords.trim(),
 };
 if (recommended) {
 // Photo first, then fields. Photo failures throw - the save
 // halts and the toast carries the real reason (most often a
 // missing column, which means migration 0036 wasn't run).
 if (pendingFile) {
 await uploadPolln8RecommendationAvatar(
 project.id,
 pendingFile,
 existingPhotoPath || null,
 );
 } else if (photoRemoved && existingPhotoPath) {
 await removePolln8RecommendationAvatar(
 project.id,
 existingPhotoPath,
 );
 }
 await updatePolln8RecommendedProject(project.id, {
 title,
 description,
 criteria,
 businessType,
 founderName,
 founderHeadline,
 founderWebsite,
 });
 } else {
 await updateProject(project.id, {
 title,
 description,
 criteria,
 businessType,
 });
 }
 toast.success("Post updated.");
 onSaved();
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Could not update.");
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
 <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>
 {recommended ? "Edit Polln8 recommendation" : "Edit post"}
 </DialogTitle>
 </DialogHeader>
 <div className="space-y-6 mt-4">
 {recommended ? (
 <section className="space-y-5">
 <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
 Who is it from?
 </h3>
 <Field label="Founder name" required>
 <Input
 value={founderName}
 onChange={(e) => setFounderName(e.target.value)}
 placeholder="e.g. Owen Carter"
 className="h-11 bg-background border-border focus-visible:border-primary"
 />
 </Field>
 <Field label="Founder headline (optional)">
 <Input
 value={founderHeadline}
 onChange={(e) => setFounderHeadline(e.target.value)}
 placeholder="e.g. Ex-payments lead"
 className="h-11 bg-background border-border focus-visible:border-primary"
 />
 </Field>
 <Field label="Founder website (optional)">
 <Input
 type="url"
 value={founderWebsite}
 onChange={(e) => setFounderWebsite(e.target.value)}
 placeholder="https://example.com"
 className="h-11 bg-background border-border focus-visible:border-primary"
 />
 </Field>
 <LogoField
 label="Founder photo / logo (optional)"
 previewUrl={
 pendingPreview ??
 (photoRemoved ? null : getAvatarUrl(existingPhotoPath))
 }
 onPick={(file, dataUrl) => {
 setPendingFile(file);
 setPendingPreview(dataUrl);
 setPhotoRemoved(false);
 }}
 onRemove={() => {
 setPendingFile(null);
 setPendingPreview(null);
 setPhotoRemoved(true);
 }}
 />
 </section>
 ) : null}

 <section
 className={
 recommended ? "space-y-5 border-t border-border pt-6" : "space-y-5"
 }
 >
 <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
 The startup
 </h3>
 <Field label="Project title" required>
 <Input
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 className="h-11 bg-background border-border focus-visible:border-primary"
 />
 </Field>
 <Field label="Description" required>
 <Textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 rows={3}
 className="bg-background border-border focus-visible:border-primary"
 />
 </Field>
 <Field label="Business type">
 <Autocomplete
 value={businessType}
 onChange={setBusinessType}
 options={BUSINESS_TYPE_OPTIONS}
 placeholder="SaaS, Marketplace..."
 />
 </Field>
 <Field label="Skills" required>
 <TagInput
 value={skills}
 onChange={setSkills}
 options={SKILLS_OPTIONS}
 placeholder="Type to filter, click to add..."
 />
 </Field>
 <Field label="Commitment" required>
 <Autocomplete
 value={commitment}
 onChange={setCommitment}
 options={COMMITMENT_OPTIONS}
 placeholder="Full-time, equity-only..."
 />
 </Field>
 <div>
 <div className="flex items-center justify-between mb-2 gap-3">
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 Location
 </Label>
 <button
 type="button"
 onClick={() => {
 const next = !locationEnabled;
 setLocationEnabled(next);
 if (!next) setLocation("");
 }}
 className={`h-6 w-11 rounded-full border transition-colors ${
 locationEnabled
 ? "bg-primary border-primary"
 : "bg-muted border-border"
 }`}
 >
 <span
 className={`block h-4 w-4 rounded-full bg-white transition-transform ${
 locationEnabled ? "translate-x-6" : "translate-x-1"
 }`}
 />
 </button>
 </div>
 {locationEnabled ? (
 <Autocomplete
 value={location}
 onChange={setLocation}
 options={LOCATION_OPTIONS}
 placeholder="Pick a country..."
 />
 ) : (
 <div className="h-11 rounded-sm border border-dashed border-border bg-background px-3 flex items-center text-[12px] text-muted-foreground">
 Location off
 </div>
 )}
 </div>
 <Field label="Keywords (optional)">
 <Input
 value={keywords}
 onChange={(e) => setKeywords(e.target.value)}
 className="h-11 bg-background border-border focus-visible:border-primary"
 />
 </Field>
 </section>

 <div className="border-t border-border pt-5 flex items-center justify-end gap-3">
 <button
 type="button"
 onClick={onClose}
 disabled={submitting}
 className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={() => void submit()}
 disabled={!valid || submitting}
 className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
 >
 {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
 Save changes
 </button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 );
};

export default Admin;
