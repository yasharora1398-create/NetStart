"use client";
/**
 * Slim top-of-page banner that pings the user to finish profile
 * setup. Modelled on Stripe's "TEST DATA" sandbox banner: ~32px
 * tall, full viewport width, sticky at the very top, primary brand
 * tint so it reads as an action prompt without screaming.
 *
 * Visibility: shown only when the auth'd user's reviewStatus is
 * still "draft" (i.e. they hit Skip on the post-signup wizard).
 * Hidden everywhere else - including unauth, loading, and pages
 * the user opens before review status is known.
 *
 * Layout: fixed at the top of the viewport with z-50 so it sits
 * above the left panel and right rail. AppLayout pushes its main
 * content down by the banner's height via a CSS variable so
 * nothing renders underneath it.
 */
import { useEffect } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import { ArrowRight } from "lucide-react";
import { useReviewStatus } from "@/hooks/useReviewStatus";
import { useAuth } from "@/context/AuthContext";

const BANNER_HEIGHT = "32px";

export const ProfileSetupBanner = () => {
 const { user, loading } = useAuth();
 const status = useReviewStatus();
 const { pathname } = useLocation();

 // Reasons to hide:
 //  - auth still hydrating (we'd flash the banner then hide)
 //  - signed out
 //  - status not known yet
 //  - status is anything but draft
 //  - the user is already on the edit surface (don't tell them to
 //    go where they already are)
 const shouldShow =
 !loading &&
 !!user &&
 status === "draft" &&
 !pathname.startsWith("/app/profile/edit");

 // Drive a global --profile-banner-height variable so AppLayout
 // can pad its main column past the banner. Cleared on hide so
 // pages without the banner snap back to zero padding.
 useEffect(() => {
 document.documentElement.style.setProperty(
 "--profile-banner-height",
 shouldShow ? BANNER_HEIGHT : "0px",
 );
 return () => {
 document.documentElement.style.removeProperty("--profile-banner-height");
 };
 }, [shouldShow]);

 if (!shouldShow) return null;

 return (
 <div
 className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-gold px-4 text-[11px] font-mono uppercase tracking-[0.2em] text-primary-foreground"
 style={{ height: BANNER_HEIGHT }}
 role="status"
 >
 <span>Profile not finished</span>
 <Link
 to="/app/profile/edit"
 className="group inline-flex items-center gap-1 text-primary-foreground underline-offset-2 hover:underline"
 >
 Finish setup
 <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
 </Link>
 </div>
 );
};
