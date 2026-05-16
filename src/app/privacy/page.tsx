import type { Metadata } from "next";
import Privacy from "@/views/Privacy";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Your data stays yours. Learn how Polln8 handles your profile, resume, and messages.",
  alternates: { canonical: "https://polln8.com/privacy" },
};

export default function Page() {
  return <Privacy />;
}
