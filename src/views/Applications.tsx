"use client";
/**
 * Applications page. Wraps the existing ApplicationsPanel inside the
 * standard AppLayout so it has its own first-class route. Both
 * incoming (founder) and outgoing (builder) applications surface here.
 *
 * The panel itself loads the founder's owned projects to drive the
 * incoming list; if the user has no owned projects, the panel still
 * shows their outgoing pitches.
 */
import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";

import { AppLayout } from "@/components/netstart/AppLayout";
import { AuthGate } from "@/components/netstart/AuthGate";
import { ApplicationsPanel } from "@/components/mynet/ApplicationsPanel";
import { useAuth } from "@/context/AuthContext";
import { useReviewStatus } from "@/hooks/useReviewStatus";
import { listProjects } from "@/lib/mynet-storage";
import type { Project } from "@/lib/mynet-types";

const Applications = () => {
  const { user, loading } = useAuth();
  const reviewStatus = useReviewStatus();
  const needsSetup =
    Boolean(user) && reviewStatus !== null && reviewStatus !== "accepted";
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const ps = await listProjects(user.id);
        if (!cancelled) setOwnedProjects(ps);
      } catch {
        // soft-fail; an empty owned list just hides the incoming column
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <AppLayout>
      <AuthGate
        authLoading={loading}
        signedIn={Boolean(user)}
        needsSetup={needsSetup}
        authTitle="Sign in to see applications"
        authBody="Track every pitch you've sent and every application your projects receive."
        setupTitle="Finish setting up MyNet to track applications."
        setupBody="Your application pipeline unlocks once your MyNet profile is set up. It only takes a minute."
      >
        <div className="container py-10">
          <header className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-sm border border-gold bg-gold px-3 py-1.5">
              <Inbox className="size-3 text-white" />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white">
                Applications
              </span>
            </div>
            <h1 className="mb-2 font-display text-4xl leading-[1.05] md:text-5xl">
              Pipeline.
            </h1>
            <p className="max-w-xl text-muted-foreground">
              Pitches you've sent and applications landing on your projects, all
              in one place.
            </p>
          </header>

          <ApplicationsPanel ownedProjects={ownedProjects} mode="all" />
        </div>
      </AuthGate>
    </AppLayout>
  );
};

export default Applications;
