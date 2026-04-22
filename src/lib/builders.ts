import builder1 from "@/assets/builder-1.jpg";
import builder2 from "@/assets/builder-2.jpg";
import builder3 from "@/assets/builder-3.jpg";

export type Builder = {
  id: string;
  name: string;
  role: string;
  location: string;
  image: string;
  match: number;
  ships: string;
  commitment: string;
  skills: string[];
  proof: string;
  building: string;
};

export const BUILDERS: Builder[] = [
  {
    id: "marcus-vey",
    name: "Marcus Vey",
    role: "Founding Engineer · ex-Stripe",
    location: "San Francisco",
    image: builder1,
    match: 94,
    ships: "0 to 1 in 21 days",
    commitment: "Full-time · No salary",
    skills: ["Rust", "Distributed systems", "Payments infra"],
    proof: "Shipped 4 production systems. $40M ARR at last role.",
    building: "Looking for a non-technical cofounder with deep fintech network.",
  },
  {
    id: "elena-rusk",
    name: "Elena Rusk",
    role: "Product & Growth · 2x Founder",
    location: "New York",
    image: builder2,
    match: 91,
    ships: "0 to 1 in 30 days",
    commitment: "Full-time · Equity-first",
    skills: ["Marketplaces", "B2B GTM", "Pricing"],
    proof: "Acquired by Square (2022). Took prev. startup to $8M ARR.",
    building: "Hunting a technical cofounder for vertical AI in logistics.",
  },
  {
    id: "kai-nakamura",
    name: "Kai Nakamura",
    role: "Design Engineer · ex-Linear",
    location: "Remote · EU",
    image: builder3,
    match: 88,
    ships: "0 to 1 in 14 days",
    commitment: "Part-time · Open to FT",
    skills: ["Product design", "TypeScript", "Motion"],
    proof: "Designed 3 of YC's top-rated developer tools.",
    building: "Want to join a serious team rebuilding CRM from first principles.",
  },
];

export const builderById = (id: string): Builder | undefined =>
  BUILDERS.find((b) => b.id === id);
