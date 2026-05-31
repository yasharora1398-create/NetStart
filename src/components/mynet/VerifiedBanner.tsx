"use client";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Sparkles, User } from "lucide-react";

import { FadeUp } from "@/components/netstart/FadeUp";
import { VerifiedBadge } from "@/components/netstart/VerifiedBadge";
import { getAvatarUrl } from "@/lib/mynet-storage";
import type { Profile, Project } from "@/lib/mynet-types";

// Permanent banner shown at the top of MyNet for any user whose
// profile.is_verified = true. Mirrors the BoostActiveBanner pattern
// (split: copy on the left, preview card on the right) but with no
// countdown - verified is a one-time, never-expires perk.
//
// Bordered in the same blue (#1d9bf0) used by the verified badge
// so the page reads as "this is the verified surface" without
// stealing the boost banner's primary-green identity.

type Props = {
 profile: Profile;
 project: Project | null;
};

export const VerifiedBanner = ({ profile, project }: Props) => {
 const avatarUrl = getAvatarUrl(profile.avatarPath);

 return (
 <FadeUp>
 <section className="relative rounded-sm border-2 border-[#1d9bf0] bg-card p-6 md:p-10 overflow-hidden">
 {/* Static sparkles, same pattern as BoostActiveBanner. */}
 <Sparkles
 className="absolute top-4 right-4 h-4 w-4 text-[#1d9bf0]"
 strokeWidth={1.6}
 />
 <Sparkles
 className="absolute bottom-4 right-10 h-3 w-3 text-[#1d9bf0]"
 strokeWidth={1.6}
 />

 <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 md:gap-12 items-center">
 {/* LEFT: copy */}
 <div className="min-w-0">
 <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#1d9bf0] mb-3 flex items-center gap-2">
 <VerifiedBadge size="sm" />
 You&apos;re verified
 </p>
 <h2 className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.05] mb-3 inline-flex items-center gap-3 flex-wrap">
 <span>The blue check is live.</span>
 <VerifiedBadge size="lg" />
 </h2>
 <p className="text-sm md:text-base text-muted-foreground mb-5 max-w-md leading-relaxed">
 Every place your name appears on Polln8 now shows the
 badge. Your card in Match also gets the green outline and
 the &ldquo;Recommended by Polln8&rdquo; treatment.
 </p>

 <dl className="grid grid-cols-2 gap-4 max-w-md mb-7">
 <MetaItem
 label="Term"
 value="Permanent"
 />
 <MetaItem
 label="Cost"
 value="50¢ USD, paid"
 />
 </dl>

 <Link
 to="/match"
 className="inline-flex items-center gap-2 text-sm font-medium text-[#1d9bf0] hover:underline"
 >
 See your card live in Match
 <ArrowRight className="h-4 w-4" />
 </Link>
 </div>

 {/* RIGHT: preview card showing how the user's card renders
 in the deck right now - identical visual to what other
 users see (border-2 border-primary + ribbon + badge inline
 with the name). */}
 <FadeUp delay={150}>
 <div>
 <div className="flex items-center gap-2 mb-3 ml-1">
 <Sparkles className="h-3.5 w-3.5 text-[#1d9bf0]" />
 <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1d9bf0]">
 How others see you
 </span>
 </div>
 <PreviewCard
 project={project}
 profile={profile}
 avatarUrl={avatarUrl}
 />
 </div>
 </FadeUp>
 </div>
 </section>
 </FadeUp>
 );
};

const MetaItem = ({
 label,
 value,
}: {
 label: string;
 value: string;
}) => (
 <div>
 <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
 {label}
 </dt>
 <dd className="text-sm text-foreground font-medium">{value}</dd>
 </div>
);

// Pixel-for-pixel mock of the verified user's Match card, populated
// with their actual avatar + project info. Same treatment that
// MatchProjectCard applies when isOwnerVerified=true: green outline
// + "Recommended by Polln8" ribbon + verified badge next to the
// name inside the card body.
const PreviewCard = ({
 project,
 profile,
 avatarUrl,
}: {
 project: Project | null;
 profile: Profile;
 avatarUrl: string | null;
}) => {
 const title =
 project?.title?.trim() ||
 profile.fullName.trim() ||
 "Your project";
 const description = project?.description?.trim() ?? "";
 const pills: string[] = [];
 if (project?.criteria.commitment) pills.push(project.criteria.commitment);
 if (project?.criteria.location) pills.push(project.criteria.location);
 if (project?.criteria.skills?.length) {
 pills.push(...project.criteria.skills.slice(0, 2));
 }

 return (
 <article className="overflow-hidden rounded-2xl bg-card shadow-md border-2 border-primary transition-transform duration-300 hover:scale-[1.02]">
 <div className="bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
 Recommended by Polln8
 </div>
 <div className="relative w-full aspect-[4/3] bg-muted">
 {avatarUrl ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={avatarUrl}
 alt=""
 className="absolute inset-0 h-full w-full object-cover"
 />
 ) : (
 <div className="absolute inset-0 flex items-center justify-center">
 <User
 className="h-24 w-24 text-muted-foreground"
 strokeWidth={1.4}
 />
 </div>
 )}
 </div>
 <div className="p-4">
 <h3 className="mb-2 font-display text-xl leading-tight text-foreground inline-flex items-center gap-1.5">
 <span>{title}</span>
 <VerifiedBadge size="md" />
 </h3>
 {pills.length > 0 ? (
 <div className="flex flex-wrap gap-1.5 mb-2">
 {pills.slice(0, 3).map((p) => (
 <span
 key={p}
 className="px-2 py-0.5 text-[11px] rounded-sm border border-gold bg-gold text-primary-foreground"
 >
 {p}
 </span>
 ))}
 </div>
 ) : null}
 {description ? (
 <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
 {description}
 </p>
 ) : null}
 </div>
 </article>
 );
};

export default VerifiedBanner;
