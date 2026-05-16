import type { Metadata } from "next";
import FounderProfile from "@/views/FounderProfile";

export const metadata: Metadata = {
  title: "Founder profile",
  description:
    "A vetted Polln8 founder profile. Sign in to view full details, see the project they're building, and request a chat.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <FounderProfile />;
}
