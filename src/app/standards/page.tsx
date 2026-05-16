import type { Metadata } from "next";
import Standards from "@/views/Standards";

export const metadata: Metadata = {
  title: { absolute: "Polln8 | Standards | Principles behind every match" },
  description:
    "The principles behind every match. Polln8 verifies every profile, matches on real capability, and keeps decisions decisive so you spend less time filtering and more time building.",
  alternates: { canonical: "https://polln8.com/standards" },
};

export default function Page() {
  return <Standards />;
}
