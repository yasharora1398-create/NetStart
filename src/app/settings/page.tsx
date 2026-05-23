import type { Metadata } from "next";
import Settings from "@/views/Settings";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Settings | Manage your account" },
 description:
 "Manage your Polln8 account. Update your profile details, notification preferences, and security settings. Keep your cofounder search profile accurate and your account secure.",
 alternates: { canonical: "https://polln8.com/settings" },
 robots: { index: false, follow: false },
};

export default function Page() {
 return <Settings />;
}
