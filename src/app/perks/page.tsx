import type { Metadata } from "next";
import Perks from "@/views/Perks";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Paid features | Boost, Verified, Spotlight" },
 description:
 "All three Polln8 paid features in one place. Boost (72-hour pin), Verified (permanent badge), and Spotlight (both bundled). Pick one or all three.",
 alternates: { canonical: "https://polln8.com/perks" },
};

export default function Page() {
 return <Perks />;
}
