import type { Metadata } from "next";
import Admin from "@/views/Admin";

export const metadata: Metadata = {
  title: { absolute: "Polln8 | Admin | Platform oversight tools" },
  description:
    "Platform oversight for the Polln8 team. Monitor signups, review pending profiles, and maintain the quality bar that makes every cofounder match on Polln8 worth making.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Admin />;
}
