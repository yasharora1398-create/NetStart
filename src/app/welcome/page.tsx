import type { Metadata } from "next";
import Welcome from "@/views/Welcome";

export const metadata: Metadata = {
  title: { absolute: "Polln8 | Welcome | Find your cofounder" },
  description:
    "Polln8 is where founders find cofounders and builders find startups to join for equity: vetted profiles, real shipping history, no spam.",
  alternates: { canonical: "https://polln8.com/welcome" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Welcome />;
}
