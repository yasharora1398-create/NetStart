"use client";
/**
 * Gated LinkedIn link. Renders a real <a target="_blank"> for users
 * whose profile is accepted; for anyone else (logged out, draft,
 * pending, rejected) it renders a visually identical <button> that
 * shows a toast on click explaining why the link is locked.
 *
 * Rationale: Polln8 is the middleman. If a half-set-up user could
 * click the LinkedIn icon and ping the other party off-platform,
 * we'd lose the conversation and the relationship signal we exist
 * to broker. The icon stays visible so users know it's a thing they
 * unlock by finishing their profile.
 *
 * The `children` slot is whatever the call site was already rendering
 * (usually a <Linkedin /> icon + optional label text), so this is a
 * 1:1 drop-in replacement at every existing call site without any
 * visual regression.
 */
import { toast } from "sonner";
import { useReviewStatus } from "@/hooks/useReviewStatus";
import { cn } from "@/lib/utils";

type Props = {
 /** The LinkedIn profile URL. If null/empty, the component renders nothing. */
 url: string | null | undefined;
 /** Classes applied to the <a> or the <button> (same shape). */
 className?: string;
 /** Visible content (icon, optional text). */
 children?: React.ReactNode;
 /** aria-label / title for the accessible form. */
 ariaLabel?: string;
};

export const LinkedInLink = ({
 url,
 className,
 children,
 ariaLabel = "Open LinkedIn",
}: Props) => {
 const status = useReviewStatus();
 // status === null means we're still hydrating. Treat that as
 // "not accepted yet" so we never flash a live link to a user who
 // turns out to be a draft account.
 const canView = status === "accepted";

 if (!url) return null;

 if (canView) {
 return (
 <a
 href={url}
 target="_blank"
 rel="noopener noreferrer"
 aria-label={ariaLabel}
 className={className}
 >
 {children}
 </a>
 );
 }

 return (
 <button
 type="button"
 aria-disabled="true"
 aria-label="Finish your profile to view LinkedIn"
 title="Finish your profile to view LinkedIn"
 onClick={(e) => {
 e.preventDefault();
 toast.message("Finish your profile to view LinkedIn", {
 description:
 "Polln8 keeps intros inside the network until your profile is approved.",
 });
 }}
 className={cn(className, "cursor-not-allowed opacity-70")}
 >
 {children}
 </button>
 );
};
