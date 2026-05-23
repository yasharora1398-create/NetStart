"use client";
/**
 * Flag-icon button that opens a small report dialog. Drop it into any
 * surface where the user is looking at another user (chat header,
 * founder profile page, candidate card hovering, etc.) and it'll
 * pull up the report flow.
 *
 * On submit it calls the report_user RPC (migration 0025). RLS makes
 * sure reporters can only file reports under their own auth.uid(),
 * and the RPC bounces self-reports. A toast confirms when the row
 * lands; if the user reports the same target twice the RPC upserts
 * silently.
 */
import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { reportUser, type ReportCategory } from "@/lib/user-reports";
import { cn } from "@/lib/utils";

type Props = {
 reportedUserId: string;
 reportedName?: string;
 /** Visual variant: "icon" for a bare flag button (chat header),
 * "full" for an inline button with text. */
 variant?: "icon" | "full";
 className?: string;
};

const CATEGORIES: { value: ReportCategory; label: string }[] = [
 { value: "spam", label: "Spam or self-promotion" },
 { value: "harassment", label: "Harassment or threats" },
 { value: "fake", label: "Fake profile / impersonation" },
 { value: "inappropriate", label: "Inappropriate content" },
 { value: "other", label: "Something else" },
];

export const ReportUserButton = ({
 reportedUserId,
 reportedName,
 variant = "icon",
 className,
}: Props) => {
 const [open, setOpen] = useState(false);
 const [category, setCategory] = useState<ReportCategory>("spam");
 const [reason, setReason] = useState("");
 const [submitting, setSubmitting] = useState(false);

 const submit = async () => {
 if (submitting) return;
 if (!reason.trim()) {
 toast.error("Add a short note so we know what to look at.");
 return;
 }
 setSubmitting(true);
 try {
 await reportUser(reportedUserId, category, reason);
 toast.success(
 "Report received. We'll review and remove the account if it breaks the rules.",
 );
 setOpen(false);
 setReason("");
 setCategory("spam");
 } catch (err) {
 const msg =
 err instanceof Error
 ? err.message
 : (err as { message?: string } | null)?.message ?? "Couldn't submit.";
 toast.error(msg);
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <>
 <button
 type="button"
 onClick={() => setOpen(true)}
 aria-label={`Report ${reportedName ?? "user"}`}
 className={cn(
 "inline-flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors",
 variant === "icon"
 ? "h-8 w-8 justify-center rounded-sm hover:bg-card"
 : "rounded-sm border border-border px-3 py-1.5 text-xs font-mono uppercase tracking-[0.18em] hover:border-destructive",
 className,
 )}
 >
 <Flag className="h-3.5 w-3.5" />
 {variant === "full" && <span>Report</span>}
 </button>

 <AlertDialog open={open} onOpenChange={(o) => !submitting && setOpen(o)}>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>
 Report {reportedName ?? "this user"}
 </AlertDialogTitle>
 <AlertDialogDescription>
 A real person on our team reviews every report within 24h. If
 the account breaks our standards it's removed. The reported
 user never sees who filed the report.
 </AlertDialogDescription>
 </AlertDialogHeader>

 <div className="space-y-4 py-2">
 <div>
 <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1.5 block">
 Reason
 </label>
 <Select
 value={category}
 onValueChange={(v) => setCategory(v as ReportCategory)}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {CATEGORIES.map((c) => (
 <SelectItem key={c.value} value={c.value}>
 {c.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div>
 <label className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1.5 block">
 What happened?
 </label>
 <Textarea
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 placeholder="A sentence or two about what we should look at."
 rows={4}
 maxLength={1000}
 />
 <p className="text-[10px] text-muted-foreground mt-1 text-right">
 {reason.length} / 1000
 </p>
 </div>
 </div>

 <AlertDialogFooter>
 <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
 <AlertDialogAction
 onClick={(e) => {
 e.preventDefault();
 void submit();
 }}
 disabled={submitting || !reason.trim()}
 className="gap-2"
 >
 {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
 Submit report
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </>
 );
};
