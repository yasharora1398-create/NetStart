import type { Metadata } from "next";
import Admin from "@/views/Admin";

export const metadata: Metadata = {
  title: "Admin",
  description:
    "Platform oversight for Polln8 operators. Monitor signups, review pending profiles, and maintain the quality bar that makes every cofounder match on Polln8 worth making.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Admin />;
}
