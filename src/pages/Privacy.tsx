import { Link } from "react-router-dom";
import { Nav } from "@/components/netstart/Nav";
import { Footer } from "@/components/netstart/Footer";

const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: "1. What we collect",
    body:
      "Account: email, password (hashed by Supabase Auth, never visible to us). Profile: full name, headline, pitch, skills, location, commitment, LinkedIn URL, resume file, avatar, review status. Activity: projects you create, applications you send and receive, candidates you save, notifications you receive.",
  },
  {
    title: "2. How we use it",
    body:
      "To run the marketplace: show your profile to founders or candidates per your visibility settings, route applications, send notifications, and rank matches. We compute semantic embeddings of your profile and projects via Google's text-embedding-004 model so we can rank matches better.",
  },
  {
    title: "3. Who sees what",
    body:
      "Your credentials (LinkedIn, resume) are visible only to admins reviewing submissions and to founders of projects you've applied to. Your candidate profile (headline, pitch, skills, location, commitment, LinkedIn, avatar) is visible to other authenticated users only when you flip Open to work. Your projects are private until you publish them. Applications are visible to you and the project owner.",
  },
  {
    title: "4. Storage",
    body:
      "Data is stored on Supabase (PostgreSQL + Storage), in the region you signed up under. Resumes and avatars live in private and public Supabase Storage buckets respectively, with row-level access policies.",
  },
  {
    title: "5. Sharing",
    body:
      "We don't sell your data. We share embeddings with Google when computing matches (text only, no PII attached beyond what's in your profile fields). We don't run third-party ads. Analytics, if enabled, use a privacy-friendly provider that doesn't track you across sites.",
  },
  {
    title: "6. Your rights",
    body:
      "You can update or remove your profile fields, resume, and avatar at any time from your account. You can request a copy of your data or full deletion by emailing us. We aim to respond within 30 days.",
  },
  {
    title: "7. Cookies",
    body:
      "We use cookies only for keeping you signed in (set by Supabase Auth). No tracking cookies.",
  },
  {
    title: "8. Children",
    body:
      "NetStart is not intended for users under 18. If we discover an underage account, we will delete it.",
  },
  {
    title: "9. Changes",
    body:
      "We'll announce material privacy changes in-app. Continued use after the change means you accept the new policy.",
  },
  {
    title: "10. Contact",
    body:
      "Privacy questions, takedown requests, or data exports: NetStartapp@outlook.com.",
  },
];

const Privacy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Nav />
    <main className="pt-28 pb-24">
      <div className="container max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
          Legal
        </p>
        <h1 className="font-display text-4xl md:text-5xl leading-[1] mb-3">
          Privacy Policy
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
          <Link to="/terms" className="text-gold hover:underline">
            Terms
          </Link>
          .
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
