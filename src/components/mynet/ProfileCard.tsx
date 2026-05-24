import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
 CheckCircle2,
 Clock,
 FileText,
 Linkedin,
 Loader2,
 Save,
 Send,
 Trash2,
 Upload,
 XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile, ReviewStatus } from "@/lib/mynet-types";
import type { Role } from "@/components/netstart/RoleSwitcher";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

const formatBytes = (bytes: number): string => {
 if (bytes < 1024) return `${bytes} B`;
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
 return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isValidLinkedIn = (url: string): boolean => {
 if (!url.trim()) return true;
 try {
 const u = new URL(url);
 return u.hostname.endsWith("linkedin.com");
 } catch {
 return false;
 }
};

const isValidUrl = (url: string): boolean => {
 if (!url.trim()) return true;
 try {
 new URL(url);
 return true;
 } catch {
 return false;
 }
};

export type ProfileSubmission = {
 linkedin?: string;
 file?: File;
 removeResume?: boolean;
 // Founder-only fields. Mirrors what the wizard captures so accepted
 // founders can edit them post-acceptance without going through review.
 website?: string;
 proofFile?: File;
 removeProof?: boolean;
};

type ProfileCardProps = {
 profile: Profile;
 role: Role;
 onSubmit: (changes: ProfileSubmission) => Promise<void>;
};

export const ProfileCard = ({ profile, role, onSubmit }: ProfileCardProps) => {
 const [linkedin, setLinkedin] = useState(profile.linkedinUrl);
 const [linkedinDirty, setLinkedinDirty] = useState(false);
 const [pendingFile, setPendingFile] = useState<File | null>(null);
 const [removeRequested, setRemoveRequested] = useState(false);
 const [website, setWebsite] = useState(profile.websiteUrl ?? "");
 const [websiteDirty, setWebsiteDirty] = useState(false);
 const [pendingProof, setPendingProof] = useState<File | null>(null);
 const [removeProofRequested, setRemoveProofRequested] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const fileRef = useRef<HTMLInputElement | null>(null);
 const proofRef = useRef<HTMLInputElement | null>(null);

 const isFounder = role === "founder";

 useEffect(() => {
 if (!linkedinDirty) setLinkedin(profile.linkedinUrl);
 }, [profile.linkedinUrl, linkedinDirty]);

 useEffect(() => {
 if (!websiteDirty) setWebsite(profile.websiteUrl ?? "");
 }, [profile.websiteUrl, websiteDirty]);

 const linkedinChanged = linkedin.trim() !== profile.linkedinUrl.trim();
 const resumeChanged = pendingFile !== null || removeRequested;
 const websiteChanged =
 website.trim() !== (profile.websiteUrl ?? "").trim();
 const proofChanged = pendingProof !== null || removeProofRequested;
 const hasChanges =
 linkedinChanged ||
 resumeChanged ||
 (isFounder && (websiteChanged || proofChanged));

 const isDraftLike =
 profile.reviewStatus === "draft" || profile.reviewStatus === "rejected";
 const isAccepted = profile.reviewStatus === "accepted";
 const canSubmit = hasChanges || isDraftLike;

 const submitLabel =
 profile.reviewStatus === "draft"
 ? "Submit for review"
 : profile.reviewStatus === "rejected"
 ? "Resubmit for review"
 : isAccepted
 ? hasChanges
 ? "Save changes"
 : "Saved"
 : hasChanges
 ? "Update submission"
 : "Submitted";

 const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 e.target.value = "";
 if (!file) return;
 if (file.size > MAX_FILE_BYTES) {
 toast.error(`File too large. Max ${formatBytes(MAX_FILE_BYTES)}.`);
 return;
 }
 setPendingFile(file);
 setRemoveRequested(false);
 };

 const onProofFileChange = (e: ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 e.target.value = "";
 if (!file) return;
 if (file.size > MAX_FILE_BYTES) {
 toast.error(`File too large. Max ${formatBytes(MAX_FILE_BYTES)}.`);
 return;
 }
 setPendingProof(file);
 setRemoveProofRequested(false);
 };

 const handleClearResume = () => {
 if (pendingFile) {
 setPendingFile(null);
 } else if (profile.resume) {
 setRemoveRequested(true);
 }
 };

 const handleClearProof = () => {
 if (pendingProof) {
 setPendingProof(null);
 } else if (profile.proof) {
 setRemoveProofRequested(true);
 }
 };

 const handleSubmit = async () => {
 if (!isValidLinkedIn(linkedin)) {
 toast.error("Enter a valid LinkedIn URL.");
 return;
 }
 if (isFounder && !isValidUrl(website)) {
 toast.error("Enter a valid website URL.");
 return;
 }
 setSubmitting(true);
 try {
 const changes: ProfileSubmission = {};
 if (linkedinChanged) changes.linkedin = linkedin.trim();
 if (pendingFile) changes.file = pendingFile;
 else if (removeRequested) changes.removeResume = true;
 if (isFounder) {
 if (websiteChanged) changes.website = website.trim();
 if (pendingProof) changes.proofFile = pendingProof;
 else if (removeProofRequested) changes.removeProof = true;
 }

 await onSubmit(changes);

 setPendingFile(null);
 setRemoveRequested(false);
 setLinkedinDirty(false);
 setPendingProof(null);
 setRemoveProofRequested(false);
 setWebsiteDirty(false);
 } catch {
 // parent already toasts; keep local state for retry
 } finally {
 setSubmitting(false);
 }
 };

 const displayResume = pendingFile
 ? { name: pendingFile.name, size: pendingFile.size, isPending: true }
 : profile.resume && !removeRequested
 ? {
 name: profile.resume.name,
 size: profile.resume.size,
 isPending: false,
 }
 : null;

 const displayProof = pendingProof
 ? { name: pendingProof.name, size: pendingProof.size, isPending: true }
 : profile.proof && !removeProofRequested
 ? {
 name: profile.proof.name,
 size: profile.proof.size,
 isPending: false,
 }
 : null;

 return (
 <div className="rounded-sm border border-border bg-card overflow-hidden">
 <div className="p-6 md:p-8">
 <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
 <div>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
 Your profile
 </p>
 <h2 className="font-display text-2xl md:text-3xl">Credentials</h2>
 </div>
 <StatusPill status={profile.reviewStatus} />
 </div>

 {profile.reviewStatus === "rejected" && profile.reviewReason && (
 <div className="rounded-sm border border-destructive bg-destructive p-4 mb-6">
 <p className="text-[11px] font-mono uppercase tracking-widest text-destructive mb-1">
 Reviewer note
 </p>
 <p className="text-sm leading-relaxed">{profile.reviewReason}</p>
 </div>
 )}

 <div className="grid md:grid-cols-2 gap-6 mb-8">
 {/* LinkedIn */}
 <div>
 <Label
 htmlFor="linkedin"
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2"
 >
 <Linkedin className="h-3.5 w-3.5 text-gold" />
 LinkedIn
 </Label>
 <Input
 id="linkedin"
 type="url"
 value={linkedin}
 onChange={(e) => {
 setLinkedin(e.target.value);
 setLinkedinDirty(true);
 }}
 placeholder="https://linkedin.com/in/your-handle"
 className="h-11 bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
 />
 {linkedinChanged ? (
 <p className="text-[11px] font-mono uppercase tracking-widest text-gold mt-2">
 Unsaved change
 </p>
 ) : profile.linkedinUrl ? (
 <p className="text-[11px] text-muted-foreground mt-2">
 Saved · <span className="text-foreground">{profile.linkedinUrl}</span>
 </p>
 ) : null}
 </div>

 {/* Resume (partners) or Website (founders) */}
 {!isFounder ? (
 <div>
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
 <FileText className="h-3.5 w-3.5 text-gold" />
 Resume
 </Label>

 <input
 ref={fileRef}
 type="file"
 accept=".pdf,.doc,.docx,application/pdf"
 onChange={onFileChange}
 className="sr-only"
 aria-label="Upload resume"
 />

 {displayResume ? (
 <FileRow
 name={displayResume.name}
 size={displayResume.size}
 pending={displayResume.isPending}
 onReplace={() => fileRef.current?.click()}
 onClear={handleClearResume}
 />
 ) : (
 <Button
 variant="outlineGold"
 size="lg"
 onClick={() => fileRef.current?.click()}
 className="w-full h-11"
 >
 <Upload className="h-4 w-4" />
 Upload resume
 </Button>
 )}

 {removeRequested && !pendingFile && (
 <UndoRow onUndo={() => setRemoveRequested(false)} />
 )}

 <p className="text-[11px] text-muted-foreground mt-2">
 PDF or DOC, max 4 MB.
 </p>
 </div>
 ) : (
 <div>
 <Label
 htmlFor="website"
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2"
 >
 What you're building
 </Label>
 <Input
 id="website"
 type="url"
 value={website}
 onChange={(e) => {
 setWebsite(e.target.value);
 setWebsiteDirty(true);
 }}
 placeholder="https://your-startup.com"
 className="h-11 bg-background border-border focus-visible:border-gold focus-visible:ring-gold"
 />
 {websiteChanged ? (
 <p className="text-[11px] font-mono uppercase tracking-widest text-gold mt-2">
 Unsaved change
 </p>
 ) : profile.websiteUrl ? (
 <p className="text-[11px] text-muted-foreground mt-2">
 Saved · <span className="text-foreground">{profile.websiteUrl}</span>
 </p>
 ) : (
 <p className="text-[11px] text-muted-foreground mt-2">
 Public site, landing page, or repo. Optional.
 </p>
 )}
 </div>
 )}
 </div>

 {/* Founder proof of work "” full-width row beneath the grid. */}
 {isFounder && (
 <div className="mb-8">
 <Label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
 <FileText className="h-3.5 w-3.5 text-gold" />
 Proof of work
 </Label>

 <input
 ref={proofRef}
 type="file"
 accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.mp4,application/pdf,image/*"
 onChange={onProofFileChange}
 className="sr-only"
 aria-label="Upload proof of work"
 />

 {displayProof ? (
 <FileRow
 name={displayProof.name}
 size={displayProof.size}
 pending={displayProof.isPending}
 onReplace={() => proofRef.current?.click()}
 onClear={handleClearProof}
 />
 ) : (
 <Button
 variant="outlineGold"
 size="lg"
 onClick={() => proofRef.current?.click()}
 className="w-full h-11"
 >
 <Upload className="h-4 w-4" />
 Upload proof
 </Button>
 )}

 {removeProofRequested && !pendingProof && (
 <UndoRow onUndo={() => setRemoveProofRequested(false)} />
 )}

 <p className="text-[11px] text-muted-foreground mt-2">
 Deck, demo video, or screenshots. PDF, image, or doc, max 4 MB.
 </p>
 </div>
 )}

 <div className="border-t border-border pt-6 flex items-center justify-between gap-4 flex-wrap">
 <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 {hasChanges
 ? isAccepted
 ? "Changes save immediately"
 : "Click submit to send for review"
 : profile.reviewStatus === "draft"
 ? "Add your details, then submit"
 : isAccepted
 ? "Your profile is up to date"
 : "Your submission is up to date"}
 </p>
 <Button
 variant="gold"
 size="lg"
 onClick={handleSubmit}
 disabled={!canSubmit || submitting}
 >
 {submitting ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : isAccepted ? (
 <Save className="h-4 w-4" />
 ) : (
 <Send className="h-4 w-4" />
 )}
 {submitLabel}
 </Button>
 </div>
 </div>
 </div>
 );
};

const FileRow = ({
 name,
 size,
 pending,
 onReplace,
 onClear,
}: {
 name: string;
 size: number;
 pending: boolean;
 onReplace: () => void;
 onClear: () => void;
}) => (
 <div
 className={`rounded-sm border bg-background p-3 flex items-center gap-3 ${
 pending ? "border-gold" : "border-border"
 }`}
 >
 <div className="h-10 w-10 rounded-sm bg-gold border border-gold flex items-center justify-center flex-shrink-0">
 <FileText className="h-4 w-4 text-white" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm truncate">{name}</p>
 <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
 {formatBytes(size)}
 {pending && (
 <span className="text-gold normal-case tracking-normal">
 {" "}
 · Ready to save
 </span>
 )}
 </p>
 </div>
 <Button variant="ghost" size="sm" onClick={onReplace}>
 Replace
 </Button>
 <Button variant="ghost" size="sm" onClick={onClear} aria-label="Remove">
 <Trash2 className="h-4 w-4 text-destructive" />
 </Button>
 </div>
);

const UndoRow = ({ onUndo }: { onUndo: () => void }) => (
 <div className="mt-2 flex items-center justify-between gap-2">
 <p className="text-[11px] font-mono uppercase tracking-widest text-destructive">
 Will be removed on save
 </p>
 <button
 type="button"
 onClick={onUndo}
 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
 >
 Undo
 </button>
 </div>
);

const StatusPill = ({ status }: { status: ReviewStatus }) => {
 const config = {
 draft: {
 label: "Draft",
 className: "border-border bg-background text-muted-foreground",
 Icon: Clock,
 },
 pending: {
 label: "Under review",
 className: "border-gold bg-gold text-primary-foreground",
 Icon: Clock,
 },
 accepted: {
 label: "Accepted",
 className: "border-primary bg-primary text-primary-foreground",
 Icon: CheckCircle2,
 },
 rejected: {
 label: "Rejected",
 className: "border-destructive bg-destructive text-destructive",
 Icon: XCircle,
 },
 }[status];
 const Icon = config.Icon;
 return (
 <span
 className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[11px] font-mono uppercase tracking-widest ${config.className}`}
 >
 <Icon className="h-3 w-3" />
 {config.label}
 </span>
 );
};
