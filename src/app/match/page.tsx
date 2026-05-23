import type { Metadata } from "next";
import Match from "@/views/Match";

export const metadata: Metadata = {
  title: { absolute: "Polln8 | Match | Discover vetted startup talent" },
  description:
    "Swipe through vetted startup talent. Founders discover skilled partners ranked against their project. Partners explore real cofounder opportunities filtered by skill, location, and commitment level.",
  alternates: { canonical: "https://polln8.com/match" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Match />;
}
