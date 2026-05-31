"use client";
import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
 ArrowRight,
 Clock,
 Eye,
 Rocket,
 Sparkles,
 Trophy,
 User,
} from "lucide-react";

import { FadeUp } from "@/components/netstart/FadeUp";
import { getAvatarUrl, type ActiveBoost } from "@/lib/mynet-storage";
import type { Profile, Project } from "@/lib/mynet-types";
import { cn } from "@/lib/utils";

// Celebratory banner shown at the top of MyNet for the full 72-hour
// window after a user pays for a boost. Auto-disappears the moment
// expires_at passes (the ticking effect keeps re-rendering, and the
// component returns null when remaining ms hits 0).
//
// Visual is intentionally "louder" than the rest of MyNet - thick
// primary border, big display countdown, animated rocket, sparkles
// in the corners, animated progress bar - so the user actually
// feels they got something for their money.

const TOTAL_BOOST_MS = 72 * 60 * 60 * 1000;

const formatRemaining = (ms: number): { primary: string; secondary: string } => {
 if (ms <= 0) return { primary: "Expired", secondary: "" };
 const totalSec = Math.floor(ms / 1000);
 const days = Math.floor(totalSec / 86400);
 const hours = Math.floor((totalSec % 86400) / 3600);
 const minutes = Math.floor((totalSec % 3600) / 60);
 if (days > 0) {
 return {
 primary: `${days}d ${hours}h`,
 secondary: `${minutes}m`,
 };
 }
 if (hours > 0) {
 return {
 primary: `${hours}h ${minutes}m`,
 secondary: "",
 };
 }
 return {
 primary: `${minutes}m`,
 secondary: "",
 };
};

const formatDateTime = (iso: string): string => {
 try {
 return new Date(iso).toLocaleString(undefined, {
 month: "short",
 day: "numeric",
 hour: "numeric",
 minute: "2-digit",
 });
 } catch {
 return iso;
 }
};

type Props = {
 boost: ActiveBoost;
 profile: Profile;
 // The project displayed in the preview card. Caller picks the
 // user's active project (or first published one); null when the
 // user has no project yet, in which case we fall back to a
 // profile-only preview.
 project: Project | null;
 // How many of the user's projects are getting boosted. We pin all
 // their projects to the top together, so this surfaces the count
 // when it's more than one.
 projectCount: number;
};

export const BoostActiveBanner = ({
 boost,
 profile,
 project,
 projectCount,
}: Props) => {
 // Tick once per minute so the countdown updates without re-mount.
 const [now, setNow] = useState(() => Date.now());
 useEffect(() => {
 const id = window.setInterval(() => setNow(Date.now()), 60_000);
 return () => window.clearInterval(id);
 }, []);

 const expiresMs = new Date(boost.expiresAt).getTime();
 const remainingMs = Math.max(0, expiresMs - now);
 const progress = Math.min(
 1,
 Math.max(0, 1 - remainingMs / TOTAL_BOOST_MS),
 );

 // Hide the moment the timer hits zero. The next MyNet load will
 // confirm via getMyActiveBoost that there's no longer an active
 // row, so the dashboard returns to its non-boosted state on its
 // own.
 if (remainingMs === 0) return null;

 const opposite = boost.targetRole;
 const remaining = formatRemaining(remainingMs);
 const avatarUrl = getAvatarUrl(profile.avatarPath);

 return (
 <FadeUp>
 <section
 className={cn(
 "relative rounded-sm border-2 border-primary bg-card p-6 md:p-10 overflow-hidden",
 )}
 >
 {/* Decorative sparkles in the corners. Static (no opacity
 pulse / no glow per the design rules) - just there to
 dress up the otherwise plain card. */}
 <Sparkles
 className="absolute top-4 right-4 h-4 w-4 text-primary"
 strokeWidth={1.6}
 />
 <Sparkles
 className="absolute bottom-4 right-10 h-3 w-3 text-primary"
 strokeWidth={1.6}
 />

 <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 md:gap-12 items-center">
 {/* LEFT: copy + countdown + meta */}
 <div className="min-w-0">
 <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary mb-3 flex items-center gap-2">
 <Rocket
 className="h-3.5 w-3.5 animate-bounce"
 strokeWidth={1.8}
 />
 Your boost is live
 </p>
 <h2 className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.05] mb-3">
 You&apos;re at position
 <br />
 <em className="not-italic text-gradient-gold">
 #1 of the {opposite} deck.
 </em>
 </h2>
 <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md leading-relaxed">
 Every {opposite} who opens Match starts with you. The pin
 holds until the timer below hits zero, then your card slides
 back to its normal rank automatically.
 </p>

 {/* Big countdown */}
 <FadeUp delay={100}>
 <div className="mb-6">
 <div className="flex items-baseline gap-3 mb-1">
 <p className="font-display text-6xl md:text-7xl leading-none transition-transform duration-500 hover:scale-105 origin-bottom-left">
 {remaining.primary}
 </p>
 {remaining.secondary ? (
 <p className="font-display text-2xl md:text-3xl text-muted-foreground leading-none">
 {remaining.secondary}
 </p>
 ) : null}
 </div>
 <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-2 flex items-center gap-1.5">
 <Clock className="h-3 w-3" />
 Time remaining
 </p>
 </div>
 </FadeUp>

 {/* Progress bar */}
 <div className="relative h-2 rounded-full bg-muted overflow-hidden mb-6">
 <div
 className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-700 ease-out"
 style={{ width: `${progress * 100}%` }}
 />
 </div>

 {/* Meta grid */}
 <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-md">
 <MetaItem
 icon={<Trophy className="h-3.5 w-3.5" />}
 label="Position"
 value="#1"
 />
 <MetaItem
 icon={<Eye className="h-3.5 w-3.5" />}
 label={`${opposite}s see`}
 value={
 projectCount > 1 ? `All ${projectCount} projects` : "Your card"
 }
 />
 <MetaItem
 icon={<Clock className="h-3.5 w-3.5" />}
 label="Expires"
 value={formatDateTime(boost.expiresAt)}
 />
 </dl>

 {/* Outline CTA - secondary, jumps to /match so they can
 verify the placement themselves. */}
 <div className="mt-7">
 <Link
 to="/match"
 className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
 >
 See your card live in Match
 <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 </div>

 {/* RIGHT: preview card (mocked the way it appears in Match) */}
 <FadeUp delay={200}>
 <div>
 <div className="flex items-center gap-2 mb-3 ml-1">
 <Sparkles className="h-3.5 w-3.5 text-primary" />
 <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
 How {opposite}s see you right now
 </span>
 </div>
 <PreviewCard
 project={project}
 profile={profile}
 avatarUrl={avatarUrl}
 />
 <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-3 text-center">
 Pinned to position #1 for the next {remaining.primary}
 </p>
 </div>
 </FadeUp>
 </div>
 </section>
 </FadeUp>
 );
};

const MetaItem = ({
 icon,
 label,
 value,
}: {
 icon: React.ReactNode;
 label: string;
 value: string;
}) => (
 <div>
 <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1 flex items-center gap-1 text-gold">
 {icon}
 {label}
 </dt>
 <dd className="text-sm text-foreground font-medium">{value}</dd>
 </div>
);

// Pixel-for-pixel mock of the user's card as it appears in the Match
// deck right now. Same border-2 border-primary, same primary header
// strip, same picture + criteria pills as MatchProjectCard.
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
 {/* Boost = green outline ONLY. The "Recommended by Polln8"
 header strip is reserved for verified-perk owners and
 Polln8-curated picks; boosted cards just get the heavier
 border + the position-#1 pin. */}
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
 <h3 className="mb-2 font-display text-xl leading-tight text-foreground">
 {title}
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

export default BoostActiveBanner;
