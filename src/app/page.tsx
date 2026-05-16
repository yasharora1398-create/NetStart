// Homepage. Server component so we can export per-route metadata; the
// underlying Home view is a client component (heavy interaction state).
import type { Metadata } from "next";
import Home from "@/views/Home";

export const metadata: Metadata = {
  title: { absolute: "Polln8 | Home | Where cofounders find each other" },
  description:
    "Find your cofounder faster. Polln8 matches certified founders and partners through a quality, skill discovery platform built to accelerate early-stage startups.",
  alternates: { canonical: "https://polln8.com/" },
};

export default function Page() {
  return <Home />;
}
