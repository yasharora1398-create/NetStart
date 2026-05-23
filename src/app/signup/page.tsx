import type { Metadata } from "next";
import SignUp from "@/views/SignUp";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Sign up | Join the cofounder network" },
 description:
 "Join the network built for serious individuals. Create your Polln8 profile as a founder or partner/partner and start matching with verified startup talent ready to move fast.",
 alternates: { canonical: "https://polln8.com/signup" },
};

export default function Page() {
 return <SignUp />;
}
