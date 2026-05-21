"use client";
/**
 * One-page intro shown when the user lands on a tab (MyNet, Match,
 * Saved, Chat). Acts as a gateway: explains what the tab is, what
 * lives there, then a single CTA at the bottom that opens the
 * actual page.
 *
 * Auth flow stays where it already lived. Clicking the CTA flips
 * the parent's `opened` state and renders the real tab content;
 * that content shows its own AuthGate when the visitor isn't
 * signed in. So unsigned visitors get: intro -> click CTA -> sign-in
 * gate. Signed-in users get: intro -> click CTA -> normal page.
 *
 * Layout intentionally simple: brand header (via the global Sidebar
 * / Nav that wraps each route), then a one-screen marketing column.
 */
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { AppLayout } from "@/components/netstart/AppLayout";
import { Button } from "@/components/ui/button";

export type TabIntroDetail = {
  title: string;
  body: string;
};

type TabIntroProps = {
  title: string;
  body: ReactNode;
  details?: TabIntroDetail[];
  ctaLabel: string;
  onCta: () => void;
};

export const TabIntro = ({
  title,
  body,
  details,
  ctaLabel,
  onCta,
}: TabIntroProps) => {
  return (
    <AppLayout>
      <div className="container max-w-3xl py-12 md:py-16">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1] mb-8 font-bold">
          {title}
        </h1>

        <div className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-10 space-y-4">
          {body}
        </div>

        {details && details.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {details.map((d) => (
              <div
                key={d.title}
                className="rounded-sm border border-border bg-card p-5"
              >
                <h3 className="font-display text-lg mb-2 font-semibold">
                  {d.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {d.body}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <Button
          variant="gold"
          size="xl"
          onClick={onCta}
          className="group"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </AppLayout>
  );
};
