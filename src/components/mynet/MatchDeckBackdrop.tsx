import { MapPin, User } from "lucide-react";

// Mock Match deck rendered as the decorative background behind
// MyNetSetupModal. Heavily blurred + dimmed by the modal's
// backdrop so the user sees the silhouette of the app they'll
// land in once setup is done, without us actually loading real
// candidates / firing any RPCs.
//
// All static. No data fetching, no auth checks, no real names.
// Purely visual placeholder.

const MOCK_CARDS: Array<{
 title: string;
 commitment: string;
 location: string;
 pills: string[];
}> = [
 {
 title: "Full-stack engineer ready to cofound",
 commitment: "Full-time",
 location: "Berlin",
 pills: ["Backend dev", "DevOps / Infra"],
 },
 {
 title: "Designer-engineer looking for founder",
 commitment: "Full-time",
 location: "Remote",
 pills: ["UI/UX design", "Frontend dev"],
 },
 {
 title: "Growth-led operator building B2B SaaS",
 commitment: "Part-time",
 location: "New York",
 pills: ["Growth marketing", "Sales & Business Development"],
 },
 {
 title: "ML engineer seeking a technical cofounder",
 commitment: "Full-time",
 location: "London",
 pills: ["Machine learning / AI", "Backend dev"],
 },
];

export const MatchDeckBackdrop = () => (
 <div className="pointer-events-none select-none container max-w-4xl py-8">
 <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold mb-2">
 Match
 </p>
 <h1 className="font-display text-3xl md:text-4xl mb-8">
 The deck that&apos;s waiting for you.
 </h1>
 <div className="grid sm:grid-cols-2 gap-4">
 {MOCK_CARDS.map((card, i) => (
 <article
 key={i}
 className="overflow-hidden rounded-2xl border border-gold bg-card shadow-sm"
 >
 <div className="relative w-full aspect-[4/3] bg-muted flex items-center justify-center">
 <User
 className="h-16 w-16 text-muted-foreground"
 strokeWidth={1.4}
 />
 </div>
 <div className="p-4">
 <h3 className="font-display text-lg leading-tight text-foreground mb-2">
 {card.title}
 </h3>
 <div className="flex flex-wrap gap-1.5">
 <span className="inline-flex items-center gap-1 rounded-full border border-gold bg-gold px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground">
 {card.commitment}
 </span>
 <span className="inline-flex items-center gap-1 rounded-full border border-gold bg-gold px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground">
 <MapPin className="h-3 w-3" />
 {card.location}
 </span>
 {card.pills.map((p) => (
 <span
 key={p}
 className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
 >
 {p}
 </span>
 ))}
 </div>
 </div>
 </article>
 ))}
 </div>
 </div>
);

export default MatchDeckBackdrop;
