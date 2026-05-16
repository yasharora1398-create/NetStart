import type { Metadata } from "next";
import NotFound from "@/views/NotFound";

export const metadata: Metadata = {
  title: "Page not found",
  description: "We couldn't find that page on Polln8.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <NotFound />;
}
