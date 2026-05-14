/**
 * About / team page. Trust signal for first-time visitors: a name,
 * a face (or stand-in), an email, and a one-paragraph reason the
 * site exists. Marketing surface, so wrapped in the IconRail +
 * Footer the rest of the public site uses.
 *
 * Edit YOUR_NAME / YOUR_EMAIL / paragraph copy below directly when
 * the team grows -- this isn't meant to be CMS-driven.
 */
"use client";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/netstart/Footer";
import { IconRail } from "@/components/netstart/IconRail";
import { FadeUp } from "@/components/netstart/FadeUp";

const About = () => {
  return (
    <div className="min-h-dvh bg-background text-foreground overflow-x-clip">
      <IconRail />

      <main className="md:pl-20">
        <section className="px-4 sm:px-8 pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="mx-auto max-w-3xl">
            <FadeUp>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
                Who's behind this
              </p>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1] tracking-tight mb-8">
                Polln8 is built by people who needed it themselves.
              </h1>
            </FadeUp>

            <FadeUp delay={120}>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
                Every founder we know has the same story: spent months
                cold-DMing strangers on Twitter, sat through coffee chats with
                consultants pretending to be cofounders, watched a YC matcher
                turn into a 2,000-person scroll. Builders have the mirror
                version: open to joining the right startup, but the actual
                projects worth joining live in private DMs they don't see.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-10">
                Polln8 is the network we wished existed. Every profile is
                reviewed by a real person. Every match needs both sides to
                accept before chat opens. No spam, no recruiters, no
                lurkers. The only people you meet here are the ones who
                showed up.
              </p>
            </FadeUp>

            <FadeUp delay={240}>
              <div className="rounded-sm border border-border bg-card/60 p-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
                  Team
                </p>
                <h2 className="font-display text-2xl mb-2 leading-tight">
                  Yash Arora
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  Founder. Built Polln8 because the last cofounder hunt
                  burned six months and produced one good intro out of a
                  hundred. Open to feedback at any time -- if something on
                  the site feels off, that email below goes straight to me.
                </p>
                <a
                  href="mailto:Polln8app@outlook.com"
                  className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-[0.2em] text-gold hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  Polln8app@outlook.com
                </a>
              </div>
            </FadeUp>

            <FadeUp delay={360}>
              <div className="mt-14 flex flex-wrap items-center gap-3">
                <Link to="/signup">
                  <Button variant="gold" size="xl" className="group">
                    Join the network
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/how">
                  <Button variant="outlineGold" size="xl">
                    How it works
                  </Button>
                </Link>
                <Link
                  to="/standards"
                  className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-gold transition-colors inline-flex items-center gap-1.5"
                >
                  Read the bar we hold members to
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </FadeUp>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
