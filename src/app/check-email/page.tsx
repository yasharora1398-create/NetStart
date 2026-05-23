import type { Metadata } from "next";
import CheckEmail from "@/views/CheckEmail";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Check email | Confirm your account" },
 description:
 "Almost there. Confirm your email to unlock your Polln8 account and start finding the cofounder or early hire your startup needs to get off the ground.",
 alternates: { canonical: "https://polln8.com/check-email" },
 robots: { index: false, follow: false },
};

export default function Page() {
 return <CheckEmail />;
}
