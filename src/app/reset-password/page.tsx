import type { Metadata } from "next";
import ResetPassword from "@/views/ResetPassword";

export const metadata: Metadata = {
  title: { absolute: "Polln8 | Reset password | Set a new password" },
  description:
    "Set a new password and jump back in. Your Polln8 profile, cofounder matches, and startup connections are waiting. Secure your account and keep building.",
  alternates: { canonical: "https://polln8.com/reset-password" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResetPassword />;
}
