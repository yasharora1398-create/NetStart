import type { Metadata } from "next";
import Authenticated from "@/views/Authenticated";

export const metadata: Metadata = {
  title: "Verified",
  description: "You're in. Finishing up your Polln8 session.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Authenticated />;
}
