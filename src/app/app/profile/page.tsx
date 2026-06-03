import type { Metadata } from "next";
import Profile from "@/views/Profile";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Profile | Your cofounder profile" },
 description:
 "Your Polln8 profile. Avatar, bio, skills, and account settings in one place.",
 alternates: { canonical: "https://polln8.com/app/profile" },
 robots: { index: false, follow: false },
};

export default function Page() {
 return <Profile />;
}
