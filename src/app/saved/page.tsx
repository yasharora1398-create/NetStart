import type { Metadata } from "next";
import Saved from "@/views/Saved";

export const metadata: Metadata = {
  title: { absolute: "Polln8 | Saved | Your shortlist of matches" },
  description:
    "Your shortlist of potential cofounders and startup projects. Revisit top matches, track your active focus, and move the right connections toward a real conversation.",
  alternates: { canonical: "https://polln8.com/saved" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Saved />;
}
