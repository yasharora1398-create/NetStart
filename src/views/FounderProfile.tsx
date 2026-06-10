"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "@/lib/router-compat";
import {
 ArrowLeft,
 Briefcase,
 Camera,
 ExternalLink,
 Globe,
 ImagePlus,
 Linkedin,
 Loader2,
 MapPin,
 MessageCircle,
 ShieldCheck,
 User,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/netstart/AppLayout";
import { LinkedInLink } from "@/components/netstart/LinkedInLink";
import { AuthGate } from "@/components/netstart/AuthGate";
import { MothEmptyState } from "@/components/netstart/MothEmptyState";
import { VerifiedBadge } from "@/components/netstart/VerifiedBadge";
import { BannerCropper } from "@/components/mynet/BannerCropper";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
 getAvatarUrl,
 getPublicFounder,
 listPublishedProjectsForOwner,
 uploadBanner,
 type PublicFounder,
} from "@/lib/mynet-storage";
import type { PublicProject } from "@/lib/mynet-types";
import { cn } from "@/lib/utils";

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
 const [uploadingBanner, setUploadingBanner] = useState(false);
 const bannerInputRef = useRef<HTMLInputElement | null>(null);
 // Two-step picker: pick file -> open cropper -> confirm -> upload.
 // pendingBannerFile holds the picked File while the cropper is open.
 const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);

 useEffect(() => {
 if (!id) return;
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
 }, [id]);

 const isAuthed = Boolean(user) && !loading;
 const isOwner = Boolean(user?.id && id && user.id === id);
 const avatarUrl = founder ? getAvatarUrl(founder.avatarPath) : null;
 const bannerUrl = founder?.bannerImagePath
 ? getAvatarUrl(founder.bannerImagePath)
 : null;

 // Aggregate "skills looking for" across this founder's published
 // projects so the right rail has a clean single list.
 const skillsLookingFor = useMemo(() => {
 if (projects.length === 0) return [];
 const set = new Set<string>();
 for (const p of projects) {
 for (const s of p.criteria.skills) {
 if (s.trim()) set.add(s.trim());
 }
 }
 return Array.from(set);
 }, [projects]);

 // Step 1: file picker -> stash the file + open the cropper.
 const handleBannerPick = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 e.target.value = ""; // reset so picking the same file twice works
 if (!file || !isOwner || !user) return;
 setPendingBannerFile(file);
 };

 // Step 2: cropper returns a Blob; upload it as a JPEG and refresh the
 // founder state so the new banner appears immediately.
 const handleCroppedBanner = async (blob: Blob) => {
 if (!user) return;
 setUploadingBanner(true);
 try {
 const newPath = await uploadBanner(
 user.id,
 blob,
 founder?.bannerImagePath || null,
 "jpg",
 );
 setFounder((prev) =>
 prev ? { ...prev, bannerImagePath: newPath } : prev,
 );
 setPendingBannerFile(null);
 toast.success("Banner updated.");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Could not upload.");
 } finally {
 setUploadingBanner(false);
 }
 };

 // Loading / not-found states. Render inside AppLayout so the
 // sidebar is consistent with everything else.
 if (loadingData) {
 return (
 <AppLayout>
 <div className="container max-w-6xl py-16 flex items-center justify-center">
 <Loader2 className="h-5 w-5 text-gold animate-spin" />
 </div>
 </AppLayout>
 );
 }
 if (!founder) {
 return (
 <AppLayout>
 <div className="container max-w-3xl py-16">
 <div className="rounded-sm border border-dashed border-border bg-card">
 <MothEmptyState
 variant="platform"
 ctx="Not found"
 title="No such profile."
 sub="The trail goes cold here. The person you're looking for may have left the platform."
 />
 </div>
 </div>
 </AppLayout>
 );
 }

 return (
 <AppLayout>
 <div className="container max-w-6xl py-6 md:py-8">
 <Link
 to="/app/match"
 className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-4"
 >
 <ArrowLeft className="h-3.5 w-3.5" />
 Back to Match
 </Link>

 {/* BANNER: h-56 cover. Owner sees a click-to-upload affordance
 (hover overlay + Camera icon). Guests see whatever the
 founder uploaded (or a neutral placeholder). */}
 <div
 className={cn(
 "relative w-full overflow-hidden rounded-sm border border-border",
 "h-44 sm:h-56 md:h-64",
 isOwner && !uploadingBanner ? "cursor-pointer group" : "",
 )}
 onClick={() => {
 if (isOwner && !uploadingBanner) bannerInputRef.current?.click();
 }}
 role={isOwner ? "button" : undefined}
 aria-label={isOwner ? "Change banner image" : undefined}
 >
 {bannerUrl ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={bannerUrl}
 alt=""
 className="absolute inset-0 h-full w-full object-cover"
 />
 ) : (
 <div className="absolute inset-0 bg-muted" />
 )}
 {isOwner ? (
 <div
 className={cn(
 "absolute inset-0 flex items-center justify-center transition-colors",
 bannerUrl
 ? "bg-black/0 group-hover:bg-black/40"
 : "bg-black/10",
 )}
 >
 {uploadingBanner ? (
 <Loader2 className="h-6 w-6 text-white animate-spin" />
 ) : (
 <span
 className={cn(
 "inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm text-foreground shadow",
 bannerUrl
 ? "opacity-0 group-hover:opacity-100 transition-opacity"
 : "",
 )}
 >
 {bannerUrl ? (
 <>
 <Camera className="h-4 w-4 text-primary" />
 Change banner
 </>
 ) : (
 <>
 <ImagePlus className="h-4 w-4 text-primary" />
 Add a banner image
 </>
 )}
 </span>
 )}
 </div>
 ) : null}
 <input
 ref={bannerInputRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={handleBannerPick}
 />
 </div>

 {/* PFP overlap row. The pfp sits aligned with the bottom of the
 banner, on the right side. Name + headline sit on the left,
 vertically aligned with the bottom of the pfp via mt-4 on
 the left + negative-margin on the pfp. */}
 <div className="relative flex items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-6 px-1 sm:px-4">
 <div className="flex-1 min-w-0 pt-12 sm:pt-16">
 <h1 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight inline-flex items-center gap-2 flex-wrap">
 <span>{founder.fullName || "Unnamed"}</span>
 {founder.isVerified ? <VerifiedBadge size="lg" /> : null}
 </h1>
 {founder.headline ? (
 <p className="mt-1 text-sm sm:text-base text-muted-foreground max-w-2xl">
 {founder.headline}
 </p>
 ) : null}
 </div>
 {/* PFP - aligned with banner bottom right. White ring sets it
 off from whatever banner image sits behind. */}
 <div className="relative flex-shrink-0">
 {avatarUrl ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={avatarUrl}
 alt={founder.fullName}
 className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover border-4 border-background shadow-md bg-muted"
 />
 ) : (
 <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-muted border-4 border-background shadow-md flex items-center justify-center">
 <User
 className="h-10 w-10 sm:h-14 sm:w-14 text-muted-foreground"
 strokeWidth={1.4}
 />
 </div>
 )}
 </div>
 </div>

 {/* MAIN GRID: left = bio + pitch, right = info rectangle.
 Stacks on mobile, two-col on md+. */}
 <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 md:gap-8">
 {/* LEFT COLUMN: bio + pitch */}
 <div className="space-y-6 min-w-0">
 {founder.bio ? (
 <section className="rounded-sm border border-border bg-card p-6">
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
 Bio
 </p>
 <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line text-foreground">
 {founder.bio}
 </p>
 </section>
 ) : null}

 {/* Message CTA - bottom of left column for non-owners. */}
 {!isOwner && user && id ? (
 <Link to={`/app/chats/${id}`} className="inline-block">
 <Button variant="gold" size="lg">
 <MessageCircle className="h-4 w-4" />
 Message {founder.fullName.split(" ")[0] || "founder"}
 </Button>
 </Link>
 ) : null}
 </div>

 {/* RIGHT COLUMN: info rectangle */}
 <aside className="md:sticky md:top-6 md:self-start">
 <div className="rounded-sm border border-border bg-card p-5 space-y-5">
 {/* Links */}
 <RightSection title="Links">
 <ul className="space-y-2">
 {founder.websiteUrl ? (
 <ExternalLinkRow
 icon={<Globe className="h-3.5 w-3.5 text-gold flex-shrink-0" />}
 label="Website"
 href={founder.websiteUrl}
 />
 ) : null}
 {founder.linkedinUrl ? (
 <li>
 <LinkedInLink
 url={founder.linkedinUrl}
 className="inline-flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors max-w-full"
 >
 <Linkedin className="h-3.5 w-3.5 text-gold flex-shrink-0" />
 <span className="truncate">LinkedIn</span>
 <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
 </LinkedInLink>
 </li>
 ) : null}
 {!founder.websiteUrl && !founder.linkedinUrl ? (
 <li className="text-xs text-muted-foreground italic">
 No links yet.
 </li>
 ) : null}
 </ul>
 </RightSection>

 {/* Skills they have */}
 {founder.skills.length > 0 ? (
 <RightSection title="Skills">
 <div className="flex flex-wrap gap-1.5">
 {founder.skills.map((s) => (
 <span
 key={s}
 className="px-2 py-0.5 text-[11px] rounded-sm border border-gold bg-gold text-primary-foreground"
 >
 {s}
 </span>
 ))}
 </div>
 </RightSection>
 ) : null}

 {/* Skills they're looking for (aggregate from projects) */}
 {skillsLookingFor.length > 0 ? (
 <RightSection title="Looking for">
 <div className="flex flex-wrap gap-1.5">
 {skillsLookingFor.map((s) => (
 <span
 key={s}
 className="px-2 py-0.5 text-[11px] rounded-sm border border-border bg-muted text-muted-foreground"
 >
 {s}
 </span>
 ))}
 </div>
 </RightSection>
 ) : null}

 {/* Credentials - location, commitment, open-to-work, verified */}
 <RightSection title="Credentials">
 <ul className="space-y-1.5 text-xs">
 {founder.location ? (
 <li className="flex items-center gap-2 text-muted-foreground">
 <MapPin className="h-3.5 w-3.5 text-gold flex-shrink-0" />
 {founder.location}
 </li>
 ) : null}
 {founder.commitment ? (
 <li className="flex items-center gap-2 text-muted-foreground">
 <Briefcase className="h-3.5 w-3.5 text-gold flex-shrink-0" />
 {founder.commitment}
 </li>
 ) : null}
 {founder.isOpenToWork ? (
 <li className="flex items-center gap-2 text-foreground">
 <ShieldCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
 Open to work
 </li>
 ) : null}
 {!founder.location &&
 !founder.commitment &&
 !founder.isOpenToWork ? (
 <li className="text-muted-foreground italic">
 Nothing on file yet.
 </li>
 ) : null}
 </ul>
 </RightSection>

 {/* Other projects */}
 <RightSection
 title={
 projects.length === 1 ? "Project" : "Other projects"
 }
 >
 {projects.length === 0 ? (
 <p className="text-xs text-muted-foreground italic">
 No published projects.
 </p>
 ) : (
 <ul className="space-y-3">
 {projects.map((p) => (
 <li
 key={p.id}
 className="rounded-sm border border-border bg-background p-3"
 >
 <p className="text-sm font-medium text-foreground mb-1">
 {p.title}
 </p>
 {p.description ? (
 <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
 {p.description}
 </p>
 ) : null}
 <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
 {formatDate(p.createdAt)}
 </p>
 </li>
 ))}
 </ul>
 )}
 </RightSection>
 </div>
 </aside>
 </div>
 </div>

 {!loading && !user ? <AuthGate /> : null}

 {/* Banner crop modal. Opens once a file is picked; closes on
 cancel or after a successful upload. */}
 <BannerCropper
 file={pendingBannerFile}
 open={Boolean(pendingBannerFile)}
 onClose={() => setPendingBannerFile(null)}
 onConfirm={handleCroppedBanner}
 />
 </AppLayout>
 );
};

// Right-rail section header + slot. Same eyebrow style across all
// blocks so the rectangle reads as one continuous panel.
const RightSection = ({
 title,
 children,
}: {
 title: string;
 children: React.ReactNode;
}) => (
 <div>
 <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
 {title}
 </p>
 {children}
 </div>
);

const ExternalLinkRow = ({
 icon,
 label,
 href,
}: {
 icon: React.ReactNode;
 label: string;
 href: string;
}) => (
 <li>
 <a
 href={href.startsWith("http") ? href : `https://${href}`}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors max-w-full"
 >
 {icon}
 <span className="truncate">{label}</span>
 <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
 </a>
 </li>
);

export default FounderProfile;
