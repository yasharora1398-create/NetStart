import type { Metadata } from "next";
import Terms from "@/views/Terms";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Clear rules for the Polln8 platform. Polln8's terms of service define how the platform works, what's expected of every member, and how we keep cofounder matching safe and fair.",
  alternates: { canonical: "https://polln8.com/terms" },
};

export default function Page() {
  return <Terms />;
}
