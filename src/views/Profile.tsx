"use client";
/**
 * /app/profile - the user's own profile dashboard.
 *
 * Layout (desktop):
 *   - LEFT (~2/3): large avatar, full name, headline, Edit + Preview
 *     buttons, then a bio block + optional inline card preview.
 *   - RIGHT (~1/3): compact details column - links, skills, preferred
 *     role, location, commitment, availability.
 *   - Bottom: Account section folding the items that used to live in
 *     the left sidebar (Settings, Upgrade, Admin if applicable, Sign
 *     out).
 *
 * Edit button -> /app/profile/edit, which renders the existing
 * profile-wizard surface (formerly /app/profile/edit) within the same
 * /app/ chrome (left chats/saved panel + right rail stay visible).
 *
 * Preview button toggles an inline mockup of the user's Match card
 * so they can see what other people see without leaving the page.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import {
 BadgeCheck,
 Eye,
 ExternalLink,
 Linkedin,
 Loader2,
 LogOut,
 MapPin,
 Pencil,
 Settings as SettingsIcon,
 ShieldAlert,
 User as UserIcon,
} from "lucide-react";

import { AppLayout } from "@/components/netstart/AppLayout";
import { AuthGate } from "@/components/netstart/AuthGate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/netstart/VerifiedBadge";
import { useAuth } from "@/context/AuthContext";
import { useConfirmSignOut } from "@/components/netstart/SignOutConfirm";
import { getAvatarUrl, getProfile } from "@/lib/mynet-storage";
import type { Profile as ProfileType } from "@/lib/mynet-types";
import { cn } from "@/lib/utils";

// Same email gate the legacy Sidebar used; only this account sees
// the Admin link inside Account section. The Admin page itself
// re-checks isAdmin so a leaked URL still bounces.
const ADMIN_EMAIL = "netstartapp@outlook.com";

const initials = (name: string): string => {
 if (!name.trim()) return "?";
 return name
 .trim()
 .split(/\s+/)
 .slice(0, 2)
 .map((p) => p[0]?.toUpperCase() ?? "")
 .join("");
};

const Profile = () => {
 const { user, loading } = useAuth();
 const navigate = useNavigate();
 const confirmSignOut = useConfirmSignOut();

 const [profile, setProfile] = useState<ProfileType | null>(null);
 const [loadingProfile, setLoadingProfile] = useState(false);
 const [previewOpen, setPreviewOpen] = useState(false);

 useEffect(() => {
 if (!user) return;
 let cancelled = false;
 setLoadingProfile(true);
 getProfile(user.id)
 .then((p) => {
 if (!cancelled) setProfile(p);
 })
 .catch(() => {
 // Soft-fail: the empty state below covers a missing
 // profile and points the user at Edit.
 })
 .finally(() => {
 if (!cancelled) setLoadingProfile(false);
 });
 return () => {
 cancelled = true;
 };
 }, [user]);

 const isAdmin =
 !!user && (user.email ?? "").toLowerCase() === ADMIN_EMAIL;

 return (
 <AppLayout>
 <AuthGate
 authLoading={loading}
 signedIn={Boolean(user)}
 authTitle="Sign in to see your profile"
 authBody="Your profile is the canonical you on Polln8. Sign in to view and edit it."
 >
 <div className="container max-w-5xl py-10 md:py-14">
 {loadingProfile && !profile ? (
 <div className="flex items-center justify-center py-32 text-muted-foreground">
 <Loader2 className="h-5 w-5 animate-spin" />
 </div>
 ) : !profile ? (
 <EmptyProfile onEdit={() => navigate("/app/profile/edit")} />
 ) : (
 <ProfileBody
 profile={profile}
 previewOpen={previewOpen}
 onTogglePreview={() => setPreviewOpen((v) => !v)}
 onEdit={() => navigate("/app/profile/edit")}
 />
 )}

 {/* Account section - the items that used to live in the
 left sidebar (Settings, Upgrade, Admin, Sign out)
 collapsed into the bottom of the profile so there's
 still one always-reachable place for them. */}
 <AccountSection
 isAdmin={isAdmin}
 onSignOut={() => void confirmSignOut()}
 />
 </div>
 </AuthGate>
 </AppLayout>
 );
};

// ============================ Body ================================
// 2-column dashboard. Avatar + name + bio on the left; the small
// right column lists the structured fields a viewer would skim
// before deciding whether to chat.
const ProfileBody = ({
 profile,
 previewOpen,
 onTogglePreview,
 onEdit,
}: {
 profile: ProfileType;
 previewOpen: boolean;
 onTogglePreview: () => void;
 onEdit: () => void;
}) => {
 const avatarUrl = getAvatarUrl(profile.avatarPath);
 const c = profile.candidate;
 return (
 <div className="grid gap-8 lg:gap-12 lg:grid-cols-[2fr_1fr]">
 {/* ───── LEFT column ───── */}
 <div className="min-w-0">
 <div className="flex items-start gap-5">
 <Avatar className="size-24 md:size-28 shrink-0 border border-border">
 {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
 <AvatarFallback className="text-xl font-display">
 {initials(profile.fullName)}
 </AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <h1 className="font-display text-3xl md:text-4xl leading-[1.05] flex items-center gap-2 flex-wrap">
 {profile.fullName || "Unnamed"}
 {profile.isVerified ? <VerifiedBadge size="md" /> : null}
 </h1>
 {c.headline ? (
 <p className="mt-1 text-sm md:text-base text-muted-foreground">
 {c.headline}
 </p>
 ) : null}

 {/* Edit + Preview buttons sit directly under the name
 so the two highest-value actions on this page are
 the first thing the user can reach. */}
 <div className="mt-4 flex flex-wrap gap-2">
 <Button variant="gold" size="sm" onClick={onEdit}>
 <Pencil className="h-4 w-4" />
 Edit
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={onTogglePreview}
 aria-pressed={previewOpen}
 >
 <Eye className="h-4 w-4" />
 {previewOpen ? "Hide preview" : "Preview card"}
 </Button>
 </div>
 </div>
 </div>

 {/* Bio block */}
 <section className="mt-8">
 <SectionLabel>About</SectionLabel>
 {c.bio.trim() ? (
 <p className="mt-2 text-sm md:text-base text-foreground leading-relaxed whitespace-pre-wrap">
 {c.bio}
 </p>
 ) : (
 <EmptyHint>
 Your bio is empty. Click <strong>Edit</strong> to add one.
 </EmptyHint>
 )}
 </section>

 {/* Inline card preview - shown when the user toggles
 Preview. Same visual vocabulary as the deck card,
 simplified for the preview frame. */}
 {previewOpen ? (
 <section className="mt-8">
 <SectionLabel>How others see your card</SectionLabel>
 <div className="mt-3 max-w-sm">
 <PreviewCard profile={profile} />
 </div>
 </section>
 ) : null}
 </div>

 {/* ───── RIGHT column ───── */}
 <aside className="lg:border-l lg:border-border lg:pl-8">
 <div className="space-y-6">
 <RightSection label="Links">
 <LinksList profile={profile} />
 </RightSection>

 <RightSection label="Skills">
 {c.skills.length === 0 ? (
 <EmptyHint compact>No skills yet.</EmptyHint>
 ) : (
 <ul className="flex flex-wrap gap-1.5">
 {c.skills.map((s) => (
 <li
 key={s}
 className="rounded-sm border border-border bg-card px-2 py-1 text-xs text-foreground"
 >
 {s}
 </li>
 ))}
 </ul>
 )}
 </RightSection>

 <RightSection label="Preferred role">
 {c.partnerRole ? (
 <span className="inline-block rounded-sm border border-gold bg-gold px-2 py-1 text-xs font-semibold text-primary-foreground">
 {c.partnerRole}
 </span>
 ) : (
 <EmptyHint compact>Not set.</EmptyHint>
 )}
 </RightSection>

 <RightSection label="Location">
 {c.location ? (
 <p className="inline-flex items-center gap-1.5 text-sm text-foreground">
 <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
 {c.location}
 </p>
 ) : (
 <EmptyHint compact>Not set.</EmptyHint>
 )}
 </RightSection>

 <RightSection label="Commitment">
 {c.commitment ? (
 <p className="text-sm text-foreground">{c.commitment}</p>
 ) : (
 <EmptyHint compact>Not set.</EmptyHint>
 )}
 </RightSection>

 <RightSection label="Availability">
 <AvailabilityPill availability={c.availability} />
 </RightSection>
 </div>
 </aside>
 </div>
 );
};

// ============================ Account =============================
// Items that used to live in the left sidebar collapse here. Same
// styling as a right-column section so the page reads as one
// continuous surface rather than a separate menu.
const AccountSection = ({
 isAdmin,
 onSignOut,
}: {
 isAdmin: boolean;
 onSignOut: () => void;
}) => (
 <section className="mt-14 border-t border-border pt-8">
 <SectionLabel>Account</SectionLabel>
 <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
 <AccountLink
 to="/app/settings"
 icon={<SettingsIcon className="h-4 w-4" />}
 label="Settings"
 />
 <AccountLink
 to="/app/perks"
 icon={<BadgeCheck className="h-4 w-4" />}
 label="Upgrade"
 />
 {isAdmin && (
 <AccountLink
 to="/app/admin"
 icon={<ShieldAlert className="h-4 w-4" />}
 label="Admin"
 />
 )}
 <button
 type="button"
 onClick={onSignOut}
 className="group flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-destructive hover:text-destructive"
 >
 <LogOut className="h-4 w-4" />
 Sign out
 </button>
 </div>
 </section>
);

const AccountLink = ({
 to,
 icon,
 label,
}: {
 to: string;
 icon: React.ReactNode;
 label: string;
}) => (
 <Link
 to={to}
 className="group flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
 >
 {icon}
 {label}
 </Link>
);

// ============================ Preview =============================
// Minimal Match-card mockup. Same shape as the partner card the
// other side sees in the deck. Not pixel-perfect to MatchCard - the
// point is to show the user what their fields are surfacing as,
// not to fully reproduce the swipe interaction.
const PreviewCard = ({ profile }: { profile: ProfileType }) => {
 const avatarUrl = getAvatarUrl(profile.avatarPath);
 const c = profile.candidate;
 return (
 <article
 className={cn(
 "overflow-hidden rounded-2xl border bg-card shadow-sm",
 profile.isVerified ? "border-2 border-primary" : "border-border",
 )}
 >
 {profile.isVerified ? (
 <div className="bg-primary px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
 Recommended by Polln8
 </div>
 ) : null}

 <div className="relative aspect-[4/3] bg-muted">
 {avatarUrl ? (
 <img
 src={avatarUrl}
 alt=""
 className="h-full w-full object-cover"
 />
 ) : (
 <div className="flex h-full w-full items-center justify-center">
 <UserIcon
 className="h-14 w-14 text-muted-foreground"
 strokeWidth={1.4}
 />
 </div>
 )}
 </div>

 <div className="p-4 space-y-3">
 <div>
 <h3 className="font-display text-lg leading-tight inline-flex items-center gap-1">
 {profile.fullName || "Unnamed"}
 {profile.isVerified ? <VerifiedBadge size="sm" /> : null}
 </h3>
 {c.headline ? (
 <p className="text-xs text-muted-foreground line-clamp-1">
 {c.headline}
 </p>
 ) : null}
 </div>
 {c.bio ? (
 <p className="text-xs text-foreground leading-relaxed line-clamp-3">
 {c.bio}
 </p>
 ) : null}
 {c.skills.length > 0 ? (
 <ul className="flex flex-wrap gap-1">
 {c.skills.slice(0, 5).map((s) => (
 <li
 key={s}
 className="rounded-sm border border-gold bg-gold px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-primary-foreground"
 >
 {s}
 </li>
 ))}
 </ul>
 ) : null}
 </div>
 </article>
 );
};

// ============================ Atoms ===============================
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
 <h2 className="text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
 {children}
 </h2>
);

const RightSection = ({
 label,
 children,
}: {
 label: string;
 children: React.ReactNode;
}) => (
 <div>
 <SectionLabel>{label}</SectionLabel>
 <div className="mt-2">{children}</div>
 </div>
);

const EmptyHint = ({
 children,
 compact = false,
}: {
 children: React.ReactNode;
 compact?: boolean;
}) => (
 <p
 className={cn(
 "text-muted-foreground",
 compact ? "text-xs" : "mt-2 text-sm",
 )}
 >
 {children}
 </p>
);

const LinksList = ({ profile }: { profile: ProfileType }) => {
 const items: Array<{ href: string; label: string; icon: React.ReactNode }> = [];
 if (profile.linkedinUrl) {
 items.push({
 href: profile.linkedinUrl,
 label: "LinkedIn",
 icon: <Linkedin className="h-3.5 w-3.5" />,
 });
 }
 if (profile.websiteUrl) {
 items.push({
 href: profile.websiteUrl,
 label: "Website",
 icon: <ExternalLink className="h-3.5 w-3.5" />,
 });
 }
 if (items.length === 0) {
 return <EmptyHint compact>No links yet.</EmptyHint>;
 }
 return (
 <ul className="space-y-1.5">
 {items.map((it) => (
 <li key={it.href}>
 <a
 href={it.href}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
 >
 {it.icon}
 {it.label}
 </a>
 </li>
 ))}
 </ul>
 );
};

const AvailabilityPill = ({
 availability,
}: {
 availability: ProfileType["candidate"]["availability"];
}) => {
 const labels: Record<typeof availability, { text: string; tone: string }> = {
 open: { text: "Open to intros", tone: "border-emerald-500 text-emerald-600" },
 discoverable: {
 text: "Discoverable",
 tone: "border-amber-500 text-amber-600",
 },
 closed: { text: "Not looking", tone: "border-border text-muted-foreground" },
 };
 const m = labels[availability] ?? labels.closed;
 return (
 <span
 className={cn(
 "inline-block rounded-sm border bg-card px-2 py-1 text-xs font-medium",
 m.tone,
 )}
 >
 {m.text}
 </span>
 );
};

// ============================ Empty ===============================
const EmptyProfile = ({ onEdit }: { onEdit: () => void }) => (
 <div className="rounded-sm border border-border bg-card p-10 text-center">
 <UserIcon
 className="mx-auto h-10 w-10 text-muted-foreground"
 strokeWidth={1.4}
 />
 <h2 className="mt-4 font-display text-2xl">Your profile is empty</h2>
 <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
 Add an avatar, headline, bio, and a few skills so the people you
 match with know who you are.
 </p>
 <div className="mt-6">
 <Button variant="gold" size="lg" onClick={onEdit}>
 <Pencil className="h-4 w-4" />
 Fill in your profile
 </Button>
 </div>
 </div>
);

export default Profile;
