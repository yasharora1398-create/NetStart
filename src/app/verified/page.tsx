import type { Metadata } from "next";
import Verified from "@/views/Verified";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Verified | Get the blue check for 50 cents" },
 description:
 "Permanent blue verified badge next to your name everywhere on Polln8. One-time 50 cents, no subscription.",
 alternates: { canonical: "https://polln8.com/verified" },
};

export default function Page() {
 return <Verified />;
}
