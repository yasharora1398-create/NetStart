"use client";
/**
 * Listen to the Supabase auth state and route to /welcome the moment
 * a real session transitions to null. Catches every sign-out path —
 * the modal, settings account-deletion, supabase global-signout from
 * another device, JWT expiry — without each call site having to wire
 * its own navigate. Plays nice with the welcome screen's moth
 * animation since the user always lands on the same surface.
 *
 * The "real session" guard (`hadSessionRef`) prevents a freshly-loaded
 * page from bouncing every unauthenticated visitor to /welcome on
 * first paint. We only redirect on the authed -> null transition.
 *
 * /welcome itself is excluded so a sign-out triggered from the
 * welcome page (impossible but defensive) doesn't loop.
 */
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_PATHS = new Set([
  "/welcome",
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/check-email",
]);

export const SignedOutRedirect = () => {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const hadSessionRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (session) {
      hadSessionRef.current = true;
      return;
    }
    // session is null. Only redirect if we previously had one
    // (i.e. the user just signed out) and aren't already sitting on
    // a public auth surface.
    if (hadSessionRef.current && !PUBLIC_PATHS.has(pathname)) {
      hadSessionRef.current = false;
      router.replace("/welcome");
    }
  }, [session, loading, pathname, router]);

  return null;
};
