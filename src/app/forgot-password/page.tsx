import type { Metadata } from "next";
import ForgotPassword from "@/views/ForgotPassword";

export const metadata: Metadata = {
  title: "Forgot password",
  description:
    "Locked out? Reset your Polln8 password quickly and get back to your cofounder matches, saved projects, and active startup conversations without losing your progress.",
  alternates: { canonical: "https://polln8.com/forgot-password" },
};

export default function Page() {
  return <ForgotPassword />;
}
