"use client";
import { Link } from "@/lib/router-compat";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/netstart/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: "1. The deal",
    body:
      "Polln8 is a platform that connects founders with partners willing to join their projects. By creating an account you agree to use Polln8 honestly: real identity, real work history, real intent. Misrepresentation is grounds for removal.",
  },
  {
    title: "2. Eligibility",
    body:
      "Members must be at least 18 and able to enter into a binding contract. Sign up for yourself; act on someone else's behalf only with their explicit written permission.",
  },
  {
    title: "3. Your account",
    body:
      "You are responsible for what happens under your account. Keep your password private. Use one of the recovery options if you lose access. Suspicious activity may trigger a lockout while we investigate.",
  },
  {
    title: "4. Content you submit",
    body:
      "Your LinkedIn, resume, project details, candidate profile, and applications are stored in our backend (Supabase). You retain ownership. By submitting them you grant Polln8 a non-exclusive license to display them to other authenticated users in line with the visibility settings you choose (open to work, project published, etc.).",
  },
  {
    title: "5. Conduct",
    body:
      "Use Polln8 honestly: stay in your own identity, treat every recipient like a real person, respect the law, and let the platform work as designed. Founders sending bulk outreach should keep every message personal and relevant. Harassment, impersonation, scraping, discrimination, and illegal content end an account on sight.",
  },
  {
    title: "6. AI matching",
    body:
      "We use a Google embeddings model to compute semantic similarity between profiles and projects. Your profile text is sent to that model to generate a vector. Your data stays with us. The model provider's policies apply to that one API call.",
  },
  {
    title: "7. Termination",
    body:
      "You can stop using Polln8 at any time. We can suspend or terminate accounts that violate these terms. We'll typically email you first unless the violation is severe.",
  },
  {
    title: "8. No guarantees",
    body:
      "We provide the platform as-is. Outcomes — a match, a hire, a long partnership — depend on the work you put in. Choose your collaborators with care.",
  },
  {
    title: "9. Changes",
    body:
      "We may update these terms. Material changes will be announced in-app. Continued use after a change means you accept the new terms.",
  },
  {
    title: "10. Contact",
    body:
      "Questions, concerns, takedown requests: Polln8app@outlook.com.",
  },
];

const Terms = () => {
  usePageMeta({
    title: "Terms of Service | Polln8 Cofounder Matchmaking",
    description:
      "Terms governing use of Polln8's cofounder matchmaking platform. Account responsibilities, conduct rules, content policy, and how we handle removal from the network.",
    path: "/terms",
  });
  return (
  <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/50">
      <div className="mx-auto max-w-3xl px-5 md:px-8 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-xl tracking-[-0.02em] text-foreground"
        >
          <img
            src="/polln8-logo.png"
            alt=""
            className="h-9 w-9 object-contain"
            draggable={false}
          />
          Polln8
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back home
        </Link>
      </div>
    </header>
    <main className="pt-12 pb-24">
      <div className="container max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl leading-[1] mb-3">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-12">
          Last updated 2026-04-26.
        </p>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-xl mb-2">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {s.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          See also{" "}
          <Link to="/privacy" className="text-gold hover:underline">
            Privacy
          </Link>
          .
        </div>
      </div>
    </main>
    <Footer />
  </div>
  );
};

export default Terms;
