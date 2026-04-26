import { Link } from "react-router-dom";
import { Nav } from "@/components/netstart/Nav";
import { Footer } from "@/components/netstart/Footer";

const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: "1. The deal",
    body:
      "NetStart is a platform that connects founders with operators willing to join their projects. By creating an account you agree to use NetStart honestly: real identity, real work history, real intent. Misrepresentation is grounds for removal.",
  },
  {
    title: "2. Eligibility",
    body:
      "You must be at least 18 years old and able to enter into a binding contract. Don't sign up on behalf of someone else without their permission.",
  },
  {
    title: "3. Your account",
    body:
      "You are responsible for what happens under your account. Keep your password private. Use one of the recovery options if you lose access. Suspicious activity may trigger a lockout while we investigate.",
  },
  {
    title: "4. Content you submit",
    body:
      "Your LinkedIn, resume, project details, candidate profile, and applications are stored in our backend (Supabase). You retain ownership. By submitting them you grant NetStart a non-exclusive license to display them to other authenticated users in line with the visibility settings you choose (open to work, project published, etc.).",
  },
  {
    title: "5. Conduct",
    body:
      "Don't spam, harass, scrape, or impersonate. Don't use the platform to discriminate. Don't post anything illegal. Don't try to break the system. Founders who notify candidates in bulk should keep messages personal and relevant.",
  },
  {
    title: "6. AI matching",
    body:
      "We use a Google embeddings model to compute semantic similarity between profiles and projects. Your profile text is sent to that model to generate a vector. We don't sell your data. The model provider's policies apply to that one API call.",
  },
  {
    title: "7. Termination",
    body:
      "You can stop using NetStart at any time. We can suspend or terminate accounts that violate these terms. We'll typically email you first unless the violation is severe.",
  },
  {
    title: "8. No guarantees",
    body:
      "We provide the platform as-is. We don't guarantee a match, a hire, a fit, or any specific outcome. Choose your collaborators with care.",
  },
  {
    title: "9. Changes",
    body:
      "We may update these terms. Material changes will be announced in-app. Continued use after a change means you accept the new terms.",
  },
  {
    title: "10. Contact",
    body:
      "Questions, concerns, takedown requests: NetStartapp@outlook.com.",
  },
];

const Terms = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Nav />
    <main className="pt-28 pb-24">
      <div className="container max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
          Legal
        </p>
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

export default Terms;
