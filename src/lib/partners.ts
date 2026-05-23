import partner1 from "@/assets/partner-1.jpg";
import partner2 from "@/assets/partner-2.jpg";
import partner3 from "@/assets/partner-3.jpg";
import { assetUrl } from "@/lib/asset-url";

const partner1Url = assetUrl(partner1);
const partner2Url = assetUrl(partner2);
const partner3Url = assetUrl(partner3);

export type Partner = {
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

export const PARTNERS: Partner[] = [
  {
    id: "marcus-vey",
    name: "Marcus Vey",
    role: "Founding Engineer · ex-Stripe",
    location: "San Francisco",
    image: partner1Url,
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
    image: partner2Url,
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
    image: partner3Url,
    match: 88,
    ships: "0 to 1 in 14 days",
    commitment: "Part-time · Open to FT",
    skills: ["Product design", "TypeScript", "Motion"],
    proof: "Designed 3 of YC's top-rated developer tools.",
    building: "Want to join a serious team rebuilding CRM from first principles.",
  },
];

export const partnerById = (id: string): Partner | undefined =>
  PARTNERS.find((b) => b.id === id);
