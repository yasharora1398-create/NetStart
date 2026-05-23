import type { Metadata } from "next";
import MyNet from "@/views/MyNet";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | My Net | Your cofounder dashboard" },
 description:
 "Your cofounder dashboard. Complete your profile, showcase your projects, and track your match progress. Everything a founder or partner needs to attract the right startup partner.",
 alternates: { canonical: "https://polln8.com/mynet" },
 robots: { index: false, follow: false },
};

export default function Page() {
 return <MyNet />;
}
