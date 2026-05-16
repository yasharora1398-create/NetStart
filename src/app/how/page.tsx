import type { Metadata } from "next";
import HowItWorks from "@/views/HowItWorks";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "See how Polln8 works. Five simple steps from signup to your first cofounder match, built for founders who want quality connections to build the next monumental startup.",
  alternates: { canonical: "https://polln8.com/how" },
};

export default function Page() {
  return <HowItWorks />;
}
