import type { Metadata } from "next";
import SignIn from "@/views/SignIn";

export const metadata: Metadata = {
  title: { absolute: "Polln8 | Sign in | Back to your matches" },
  description:
    "Log back into your cofounder search. Access your matches, active projects, and founder conversations. Your next startup partner could be one message away.",
  alternates: { canonical: "https://polln8.com/signin" },
};

export default function Page() {
  return <SignIn />;
}
